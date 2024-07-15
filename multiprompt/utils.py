from .imports import *

def make_ascii_section(title, content, level=1):
    level_indicator = '#' * level
    formatted_title = title
    header = f"""{level_indicator} {formatted_title}"""
    return f"\n{header}\n\n{content}\n\n"


def convert_prompt_messages_to_str(openai_messages):
    l = []
    for msg in openai_messages:
        role, content = msg["role"], msg["content"]
        o = f"<{role.upper()}>{content}</{role.upper()}>"
        l.append(o)
    out = "\n\n".join(l)
    return out



def iter_async_generator(async_generator_func, *args, **kwargs):
    q = queue.Queue()

    def run_async_gen():
        async def async_generator():
            async for item in async_generator_func(*args, **kwargs):
                q.put(item)
            q.put(StopIteration)

        asyncio.run(async_generator())

    thread = threading.Thread(target=run_async_gen)
    thread.start()

    while True:
        item = q.get()
        if item is StopIteration:
            break
        yield item

    thread.join()

from pathlib import Path

def generate_directory_structure(attachment_paths):
    # Find the common root
    common_root = Path(os.path.commonpath(attachment_paths))
    
    # Create the tree structure
    tree = {}
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
