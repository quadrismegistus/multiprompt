#!/usr/bin/env python3
from .imports import *


def remove_comments(code_contents_str, code_file_extension):
    if code_file_extension in ['js', 'css']:
        pattern = re.compile(r'//.*?$|/\*.*?\*/', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'py':
        pattern = re.compile(r'#.*?$|\'\'\'.*?\'\'\'|\"\"\".*?\"\"\"', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'html':
        pattern = re.compile(r'<!--.*?-->', re.DOTALL | re.MULTILINE)
    elif code_file_extension in {'md','txt','json','toml','ipynb'}:
        return code_contents_str
    else:
        logger.warning(f"Unsupported file extension: {code_file_extension}")
        return code_contents_str
    return re.sub(pattern, '', code_contents_str)

class BaseRepoReader(ABC):
    def __init__(self, extensions=None):
        self.extensions = extensions or REPO2LLM_EXTENSIONS

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
        for file_path in self.get_files():
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
        try:
            import pyperclip
            pyperclip.copy(self.markdown)
            print(f"Contents copied to clipboard")
        except Exception as e:
            print(f"!! COULD NOT COPY TO CLIPBOARD: {e}")
            pass

class LocalReader(BaseRepoReader):
    def __init__(self, paths, extensions=None):
        super().__init__(extensions)
        self.paths = [Path(path).resolve() for path in paths]
        self.gitignore_specs = self._parse_gitignores()

    def _parse_gitignores(self):
        specs = {}
        for path in self.paths:
            if path.is_dir():
                gitignore_path = path / '.gitignore'
                logger.info(f'?? {gitignore_path}')
                if gitignore_path.exists():
                    with open(gitignore_path, 'r') as f:
                        specs[path] = PathSpec.from_lines(GitWildMatchPattern, f)
        logger.info(pformat(specs))
        return specs

    def should_ignore(self, path):
        if super().should_ignore(path):
            return True
        
        for base_path, gitignore_spec in self.gitignore_specs.items():
            if path.is_relative_to(base_path):
                relative_path = path.relative_to(base_path)
                if gitignore_spec.match_file(str(relative_path)):
                    return True
        
        return False

    def get_files(self):
        for path in self.paths:
            if path.is_file():
                if not self.should_ignore(path) and path.suffix in self.extensions:
                    yield path.relative_to(path.parent)
            elif path.is_dir():
                for root, _, filenames in os.walk(path):
                    if self.should_ignore(Path(root)): continue
                    for filename in filenames:
                        file_path = Path(root) / filename
                        logger.info(file_path)
                        if not self.should_ignore(file_path) and file_path.suffix in self.extensions:
                            yield file_path.relative_to(path)

    def read_file(self, file_path):
        full_path = next(path / file_path for path in self.paths if (path / file_path).exists())
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
        output.append("# Local Files and Directories\n")
        output.append("This file contains truncated contents for LLM consumption. It provides an overview of the code structure and contents in the specified files and directories, with comments removed for brevity.\n")
        
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
            url=f'https://{url}'
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

def main(source_or_paths, extensions=REPO2LLM_EXTENSIONS, output_file='.robots.md'):
    if isinstance(source_or_paths, str):
        if source_or_paths.startswith('http://') or source_or_paths.startswith('https://'):
            reader = GitHubRepoReader(source_or_paths, extensions)
        else:
            reader = LocalReader([source_or_paths], extensions)
    else:  # Assume it's a list of paths
        reader = LocalReader(source_or_paths, extensions)
    
    if output_file:
        output_file = Path(output_file)
        if not output_file.is_absolute():
            output_file = Path.cwd() / output_file
    else:
        output_file = Path.cwd() / ".robots.md"

    reader.save_markdown(output_file)