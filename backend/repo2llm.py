import os
from pathlib import Path
from tqdm import tqdm
from pathspec import PathSpec
from pathspec.patterns import GitWildMatchPattern
import re

def remove_comments(code_contents_str, code_file_extension):
    if code_file_extension in ['js', 'css']:
        pattern = re.compile(r'//.*?$|/\*.*?\*/', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'py':
        pattern = re.compile(r'#.*?$|\'\'\'.*?\'\'\'|\"\"\".*?\"\"\"', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'html':
        pattern = re.compile(r'<!--.*?-->', re.DOTALL | re.MULTILINE)
    else:
        raise ValueError("Unsupported file extension")
    return re.sub(pattern, '', code_contents_str)

class LocalRepoReader:
    def __init__(self, directory=".", extensions=None):
        self.base_path = Path(directory).resolve()
        self.extensions = extensions or [".py", ".js", ".html", ".css"]
        self.gitignore_spec = self._parse_gitignore()
        self.files = []
        self.file_contents = {}

    def _parse_gitignore(self):
        gitignore_path = self.base_path / '.gitignore'
        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                return PathSpec.from_lines(GitWildMatchPattern, f)
        return PathSpec([])

    def _should_ignore(self, path):
        return self.gitignore_spec.match_file(str(path))

    def get_files(self):
        for root, dirs, filenames in os.walk(self.base_path):
            dirs[:] = [d for d in dirs if not self._should_ignore(Path(root) / d)]
            
            for filename in filenames:
                file_path = Path(root) / filename
                relative_path = file_path.relative_to(self.base_path)
                if not self._should_ignore(relative_path):
                    if not self.extensions or any(filename.endswith(ext) for ext in self.extensions):
                        self.files.append(file_path)

    def read_files(self):
        for file in tqdm(self.files):
            relative_path = file.relative_to(self.base_path)
            try:
                with open(file, "r") as f:
                    content = f.read()
                    file_extension = file.suffix
                    content = remove_comments(content, file_extension[1:])
                    self.file_contents[str(relative_path)] = content
            except UnicodeDecodeError:
                self.file_contents[str(relative_path)] = "Binary file, contents not included"

    def _generate_directory_structure(self):
        tree = {}
        for file in self.files:
            parts = file.relative_to(self.base_path).parts
            current = tree
            for part in parts[:-1]:
                current = current.setdefault(part, {})
            current[parts[-1]] = None

        def build_tree(node, prefix=""):
            lines = []
            items = list(node.items())
            for i, (name, subtree) in enumerate(items):
                is_last = i == len(items) - 1
                lines.append(f"{prefix}{'└── ' if is_last else '├── '}{name}")
                if subtree is not None:
                    lines.extend(build_tree(subtree, prefix + ("    " if is_last else "│   ")))
            return lines

        return "\n".join(build_tree(tree))

    def generate_markdown(self):
        output = []
        output.append(f"# {self.base_path.name}\n")
        output.append("This file contains truncated repository contents for LLM consumption. It provides an overview of the code structure and contents in this repository or folder, with comments removed for brevity.\n")
        
        output.append("## Directory Structure\n")
        output.append("```")
        output.append(self._generate_directory_structure())
        output.append("```\n")
        
        for relative_path, content in self.file_contents.items():
            output.append(f"## {relative_path}\n")
            if content != "Binary file, contents not included":
                output.append(f"```{Path(relative_path).suffix.lstrip('.')}")
                output.append(content)
                output.append("```\n")
            else:
                output.append(content + "\n")
        
        return "\n".join(output)

    def process(self):
        self.get_files()
        self.read_files()
        return self.file_contents

    def save_markdown(self, output_file):
        markdown_content = self.generate_markdown()
        with open(output_file, "w") as out:
            out.write(markdown_content)
        print(f"Directory contents written to {output_file}")





import os
import tempfile
import shutil
from git import Repo
from pathlib import Path
from urllib.parse import urlparse

class GitHubRepoReader:
    def __init__(self, github_url):
        self.github_url = self.normalize_url(github_url)
        self.temp_dir = None
        self.file_contents = {}

    def normalize_url(self, url):
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.strip('/').split('/')
        
        if len(path_parts) < 2:
            raise ValueError("Invalid GitHub URL")
        
        username, repo = path_parts[:2]
        branch = 'main'  # Default branch
        
        if len(path_parts) > 2:
            if 'tree' in path_parts:
                branch_index = path_parts.index('tree') + 1
                if branch_index < len(path_parts):
                    branch = path_parts[branch_index]
        
        normalized_url = f"https://github.com/{username}/{repo}.git"
        return normalized_url, branch

    def clone_repo(self):
        self.temp_dir = tempfile.mkdtemp()
        url, branch = self.github_url
        Repo.clone_from(url, self.temp_dir, branch=branch)

    def read_files(self):
        for root, _, files in os.walk(self.temp_dir):
            for file in files:
                file_path = Path(root) / file
                if file_path.is_file() and file_path.suffix in ['.txt', '.py', '.md', '.json', '.yaml', '.yml']:
                    relative_path = file_path.relative_to(self.temp_dir)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            self.file_contents[str(relative_path)] = f.read()
                    except UnicodeDecodeError:
                        print(f"Warning: Unable to read {file_path} as text. Skipping.")

    def cleanup(self):
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def process(self):
        try:
            self.clone_repo()
            self.read_files()
            return self.file_contents
        finally:
            self.cleanup()

# Example usage
if __name__ == "__main__":
    github_urls = [
        # "https://github.com/username/repo",
        # "https://github.com/username/repo/tree/develop",
        "https://github.com/quadrismegistus/multiprompt",
        # "https://github.com/username/repo/blob/feature/new-feature/README.md"
    ]
    
    for url in github_urls:
        print(f"Processing: {url}")
        reader = GitHubRepoReader(url)
        contents = reader.process()
        print(f"Number of files read: {len(contents)}")
        for path, content in list(contents.items())[:2]:  # Print details of first two files
            print(f"File: {path}")
            print(f"Content preview: {content[:100]}...")
        print("-" * 50)




# # Example usage
# if __name__ == "__main__":
#     reader = LocalRepoReader(".", [".py", ".js", ".html", ".css"])
#     contents = reader.process()
#     reader.save_markdown(".robots.md")

