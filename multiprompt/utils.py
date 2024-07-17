from .imports import *
from pathlib import Path
import asyncio
import nest_asyncio


def make_ascii_section(title, content, level=1):
    level_indicator = '#' * level
    formatted_title = title
    header = f"""{level_indicator} {formatted_title}"""
    return f"\n{header}\n\n{content}\n\n"



def get_common_root(attachment_paths):
    if not len(attachment_paths): return None
    if len(attachment_paths)==1: return os.path.dirname(attachment_paths[0])
    return Path(os.path.commonpath(attachment_paths))

def generate_directory_structure(attachment_paths):
    common_root = get_common_root(attachment_paths)
    if common_root is None: return ''
    
    # Create the tree structure
    tree = {}
    print(attachment_paths)
    for file_path in attachment_paths:
        relative_path = Path(file_path).relative_to(common_root)
        parts = relative_path.parts
        current = tree
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        current[parts[-1]] = None

    # Build the tree representation
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

def printm(markdown_str):
    try:
        from IPython.display import display, Markdown

        display(Markdown(markdown_str))
    except Exception:
        print(markdown_str)



async def collect_async_generator(async_generator):
    result = []
    async for item in async_generator:
        result.append(item)
    return result

def run_async_in_notebook(async_generator):
    nest_asyncio.apply()
    
    for item in asyncio.get_event_loop().run_until_complete(
        collect_async_generator(async_generator())
    ):
        yield item

def run_async_or_sync(async_func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    if loop.is_running():
        return run_async_in_notebook(lambda: async_func(*args, **kwargs))
    else:
        return loop.run_until_complete(async_func(*args, **kwargs))