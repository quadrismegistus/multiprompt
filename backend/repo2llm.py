#!/usr/bin/env python3
from config import *

def remove_comments(code_contents_str, code_file_extension):
    if code_file_extension in ['js', 'css']:
        pattern = re.compile(r'//.*?$|/\*.*?\*/', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'py':
        pattern = re.compile(r'#.*?$|\'\'\'.*?\'\'\'|\"\"\".*?\"\"\"', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'html':
        pattern = re.compile(r'<!--.*?-->', re.DOTALL | re.MULTILINE)
    elif code_file_extension in {'md','txt'}:
        return code_contents_str
    else:
        logger.warning(f"Unsupported file extension: {code_file_extension}")
        return code_contents_str
    return re.sub(pattern, '', code_contents_str)

class BaseRepoReader(ABC):
    def __init__(self, extensions=None):
        self.extensions = extensions or [".py", ".js", ".html", ".css", ".md", ".txt", ".json", ".yaml", ".yml", ".toml"]

    @abstractmethod
    def get_files(self):
        pass

    @abstractmethod
    def read_file(self, file_path):
        pass

    def should_ignore(self, path):
        path_parts = Path(path).parts
        for i in range(len(path_parts)):
            partial_path = os.path.join(*path_parts[:i+1])
            if any(fnmatch.fnmatch(partial_path, pattern) for pattern in IGNORE_PATHS):
                return True
        return False

    @cached_property
    def file_contents(self):
        contents = {}
        for file_path in tqdm(self.get_files()):
            if not self.should_ignore(file_path):
                content = self.read_file(file_path)
                if content is not None:
                    contents[str(file_path)] = content
        return contents

    def _generate_directory_structure(self):
        tree = {}
        for file_path in self.file_contents.keys():
            parts = Path(file_path).parts
            current = tree
            for part in parts[:-1]:
                current = current.setdefault(part, {})
            current[parts[-1]] = None

        def build_tree(node, prefix=""):
            lines = []
            items = sorted(node.items())
            for i, (name, subtree) in enumerate(items):
                is_last = i == len(items) - 1
                lines.append(f"{prefix}{'└── ' if is_last else '├── '}{name}")
                if subtree is not None:
                    lines.extend(build_tree(subtree, prefix + ("    " if is_last else "│   ")))
            return lines

        return "\n".join(build_tree(tree))

    @cached_property
    @abstractmethod
    def markdown(self):
        pass

    def save_markdown(self, output_file):
        with open(output_file, "w") as out:
            out.write(self.markdown)
        print(f"Repository contents written to {output_file}")

class LocalRepoReader(BaseRepoReader):
    def __init__(self, directory=".", extensions=None):
        super().__init__(extensions)
        self.base_path = Path(directory).resolve()
        self.gitignore_spec = self._parse_gitignore()

    def _parse_gitignore(self):
        gitignore_path = self.base_path / '.gitignore'
        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                return PathSpec.from_lines(GitWildMatchPattern, f)
        return PathSpec([])

    def should_ignore(self, path):
        return super().should_ignore(path) or self.gitignore_spec.match_file(str(path))

    def get_files(self):
        for root, _, filenames in os.walk(self.base_path):
            for filename in filenames:
                file_path = Path(root) / filename
                relative_path = file_path.relative_to(self.base_path)
                if not self.should_ignore(relative_path) and file_path.suffix in self.extensions:
                    yield relative_path

    def read_file(self, file_path):
        full_path = self.base_path / file_path
        try:
            with open(full_path, "r", encoding='utf-8') as f:
                content = f.read()
                return remove_comments(content, file_path.suffix[1:])
        except UnicodeDecodeError:
            logger.warning(f"Unable to read {full_path} as text. Skipping.")
            return None

    @cached_property
    def markdown(self):
        output = []
        output.append(f"# {self.base_path.name}\n")
        output.append("This file contains truncated repository contents for LLM consumption. It provides an overview of the code structure and contents in this repository or folder, with comments removed for brevity.\n")
        
        output.append("## Directory Structure\n")
        output.append("```")
        output.append(self._generate_directory_structure())
        output.append("```\n")
        
        for relative_path, content in self.file_contents.items():
            output.append(f"## {relative_path}\n")
            output.append(f"```{Path(relative_path).suffix.lstrip('.')}")
            output.append(content)
            output.append("```\n")
        
        return "\n".join(output)

class GitHubRepoReader(BaseRepoReader):
    def __init__(self, github_url, extensions=None):
        super().__init__(extensions)
        self.url, self.branch, self.username, self.repo = self._normalize_url(github_url)
        self.temp_dir = None

    def _normalize_url(self, url):
        if '.com/' not in url:
            url=f'https://github.com/{url}'
        elif url.startswith('github.com'): 
            url=f'https://github.com/{url}'
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
        return normalized_url, branch, username, repo

    def clone_repo(self):
        self.temp_dir = tempfile.mkdtemp()
        Repo.clone_from(self.url, self.temp_dir, branch=self.branch)

    def cleanup(self):
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def get_files(self):
        self.clone_repo()
        try:
            for root, _, files in os.walk(self.temp_dir):
                for file in files:
                    if file not in IGNORE_PATHS:
                        file_path = Path(root) / file
                        relative_path = file_path.relative_to(self.temp_dir)
                        if not self.should_ignore(relative_path) and file_path.suffix in self.extensions:
                            yield relative_path
        finally:
            self.cleanup()

    def read_file(self, file_path):
        full_path = Path(self.temp_dir) / file_path
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                return remove_comments(content, file_path.suffix[1:])
        except UnicodeDecodeError:
            logger.warning(f"Unable to read {full_path} as text. Skipping.")
            return None

    @cached_property
    def markdown(self):
        output = []
        output.append(f"# GitHub Repository: {self.username}/{self.repo}\n")
        output.append("This file contains truncated repository contents for LLM consumption. It provides an overview of the code structure and contents in this GitHub repository, with comments removed for brevity.\n")
        
        output.append("## Directory Structure\n")
        output.append("```")
        output.append(self._generate_directory_structure())
        output.append("```\n")
        
        for relative_path, content in self.file_contents.items():
            output.append(f"## {relative_path}\n")
            output.append(f"```{Path(relative_path).suffix.lstrip('.')}")
            output.append(content)
            output.append("```\n")
        
        return "\n".join(output)

def main():
    parser = argparse.ArgumentParser(
        description="Generate a single markdown file from a repository's contents, respecting .gitignore and ignoring specific files."
    )
    parser.add_argument(
        "source",
        help="Directory to process or GitHub URL",
    )
    parser.add_argument(
        "--extensions",
        "-e",
        nargs="+",
        default=[".py", ".js", ".html", ".css"],
        help='File extensions to include (default: .py, .js, .html, .css)',
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output filename (default: .robots.md)",
    )
    args = parser.parse_args()

    if args.source.startswith('http://') or args.source.startswith('https://'):
        reader = GitHubRepoReader(args.source, args.extensions)
        output_file = args.output or "github_repo_contents.md"
    else:
        directory = Path(args.source).resolve()
        reader = LocalRepoReader(directory, args.extensions)
        if args.output:
            output_file = Path(args.output) if os.path.isabs(args.output) else directory / args.output
        else:
            output_file = directory / ".robots.md"

    reader.save_markdown(output_file)

if __name__ == "__main__":
    main()