#!/usr/bin/env python3

from tqdm import tqdm
import os
import argparse
import re
from pathlib import Path
from pathspec import PathSpec
from pathspec.patterns import GitWildMatchPattern

import re

def remove_comments(code_contents_str, code_file_extension):
    """
    Remove comments from code based on the file extension.

    :param code_contents_str: String containing the code.
    :param code_file_extension: Extension of the file (js, py, html, css).
    :return: String with comments removed.
    """
    if code_file_extension == 'js' or code_file_extension == 'css':
        # Remove single-line comments (//) and multi-line comments (/* */)
        pattern = re.compile(r'//.*?$|/\*.*?\*/', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'py':
        # Remove single-line comments (#) and multi-line comments (''' ''' or """ """)
        pattern = re.compile(r'#.*?$|\'\'\'.*?\'\'\'|\"\"\".*?\"\"\"', re.DOTALL | re.MULTILINE)
    elif code_file_extension == 'html':
        # Remove HTML comments (<!-- -->)
        pattern = re.compile(r'<!--.*?-->', re.DOTALL | re.MULTILINE)
    else:
        raise ValueError("Unsupported file extension")

    # Substitute comments with an empty string
    code_without_comments_str = re.sub(pattern, '', code_contents_str)
    
    return code_without_comments_str


def parse_gitignore(gitignore_path):
    if gitignore_path.exists():
        with open(gitignore_path, 'r') as f:
            return PathSpec.from_lines(GitWildMatchPattern, f)
    return PathSpec([])

def should_ignore(path, gitignore_spec):
    return gitignore_spec.match_file(str(path))

def get_files(directory, extensions, gitignore_spec):
    files = []
    for root, dirs, filenames in os.walk(directory):
        dirs[:] = [d for d in dirs if not should_ignore(Path(root) / d, gitignore_spec)]
        
        for filename in filenames:
            file_path = Path(root) / filename
            relative_path = file_path.relative_to(directory)
            if not should_ignore(relative_path, gitignore_spec):
                if not extensions or any(filename.endswith(ext) for ext in extensions):
                    files.append(file_path)
    return files

def generate_directory_structure(base_path, files):
    tree = {}
    for file in files:
        parts = file.relative_to(base_path).parts
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

def analyze_repository(directory=".", extensions=None, output_file=None):
    if extensions == None:
        extensions = [".py", ".js", ".html", ".css"]
    
    base_path = Path(directory).resolve()
    gitignore_path = base_path / '.gitignore'
    gitignore_spec = parse_gitignore(gitignore_path)

    files = get_files(base_path, extensions, gitignore_spec)

    output = []
    output.append(f"# {base_path.name}\n")
    output.append("This file contains truncated repository contents for LLM consumption. It provides an overview of the code structure and contents in this repository or folder, with comments removed for brevity.\n")
    
    output.append("## Directory Structure\n")
    output.append("```")
    output.append(generate_directory_structure(base_path, files))
    output.append("```\n")
    
    for file in tqdm(files):
        relative_path = file.relative_to(base_path)
        output.append(f"## {relative_path}\n")
        try:
            with open(file, "r") as f:
                content = f.read()
                file_extension = file.suffix
                content = remove_comments(content, file_extension[1:])
                output.append(f"```{file_extension.lstrip('.')}")
                output.append(content)
                output.append("```\n")
        except UnicodeDecodeError:
            output.append("Binary file, contents not included\n")
    
    result = "\n".join(output)
    
    if output_file:
        with open(output_file, "w") as out:
            out.write(result)
        print(f"Directory contents written to {output_file}")
    
    return result

def main():
    parser = argparse.ArgumentParser(
        description="Generate a single markdown file from a directory's contents, respecting .gitignore and ignoring specific files."
    )
    parser.add_argument(
        "directory",
        nargs="?",
        default=".",
        help="Directory to process (default: current directory)",
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

    directory = Path(args.directory).resolve()
    if args.output:
        output_file = Path(args.output) if os.path.isabs(args.output) else directory / args.output
    else:
        output_file = directory / ".robots.md"
    
    analyze_repository(directory, args.extensions, output_file)

if __name__ == "__main__":
    main()
