#!/usr/bin/env python3

import os
import argparse
import re
from pathlib import Path
from pathspec import PathSpec
from pathspec.patterns import GitWildMatchPattern

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
        # Remove directories ignored by .gitignore
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
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = None

    def build_tree(node, prefix=""):
        lines = []
        items = list(node.items())
        for i, (name, subtree) in enumerate(items):
            if i == len(items) - 1:
                lines.append(f"{prefix}└── {name}")
                if subtree is not None:
                    lines.extend(build_tree(subtree, prefix + "    "))
            else:
                lines.append(f"{prefix}├── {name}")
                if subtree is not None:
                    lines.extend(build_tree(subtree, prefix + "│   "))
        return lines

    return "\n".join(build_tree(tree))

def create_llm_file(base_path, output_file, files):
    with open(output_file, "w") as out:
        # Add top header with directory name
        out.write(f"# {base_path.name}\n\n")
        
        # Add explanation paragraph
        out.write("This file contains truncated repository contents for LLM consumption. It provides an overview of the code structure and contents in this repository or folder, with comments removed for brevity.\n\n")
        
        # Add directory structure
        out.write("## Directory Structure\n\n")
        out.write("```\n")
        out.write(generate_directory_structure(base_path, files))
        out.write("\n```\n\n")
        
        # Continue with file contents
        for file in files:
            relative_path = file.relative_to(base_path)
            out.write(f"## {relative_path}\n\n")
            try:
                with open(file, "r") as f:
                    content = f.read()
                    file_extension = file.suffix
                    out.write(f"```{file_extension.lstrip('.')}\n{content}\n```\n\n")
            except UnicodeDecodeError:
                out.write("Binary file, contents not included\n\n")
    print(f"Directory contents written to {output_file}")

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
        default=".robots.md",
        help="Output filename (default: .robots.md)",
    )
    args = parser.parse_args()

    base_path = Path(args.directory).resolve()
    gitignore_path = base_path / '.gitignore'
    gitignore_spec = parse_gitignore(gitignore_path)

    files = get_files(base_path, args.extensions, gitignore_spec)

    if os.path.isabs(args.output):
        output_file = Path(args.output)
    else:
        output_file = base_path / args.output

    create_llm_file(base_path, output_file, files)

def analyze_repository(directory=".", extensions=None):
    if extensions is None:
        extensions = [".py", ".js", ".html", ".css"]
    
    base_path = Path(directory).resolve()
    gitignore_path = base_path / '.gitignore'
    gitignore_spec = parse_gitignore(gitignore_path)

    files = get_files(base_path, extensions, gitignore_spec)

    output = []
    output.append(f"# Current contents of {base_path.name}\n")
    output.append("This file contains truncated repository contents for LLM consumption. It provides an overview of the code structure and contents in this repository or folder, with comments removed for brevity.\n")
    
    output.append("## Directory Structure\n")
    output.append("```")
    output.append(generate_directory_structure(base_path, files))
    output.append("```\n")
    
    for file in files:
        relative_path = file.relative_to(base_path)
        output.append(f"## {relative_path}\n")
        try:
            with open(file, "r") as f:
                content = f.read()
                file_extension = file.suffix
                content = remove_comments(content, file_extension)
                output.append(f"```{file_extension.lstrip('.')}")
                output.append(content)
                output.append("```\n")
        except UnicodeDecodeError:
            output.append("Binary file, contents not included\n")
    
    return "\n".join(output)

if __name__ == "__main__":
    main()