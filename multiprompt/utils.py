from .imports import *

def make_ascii_section(title, content, level=1):
    horizontal_line = '-' * 60
    level_indicator = '#' * level
    formatted_title = title.upper() if level == 1 else title
    
    # Fixed left padding
    left_padding = 2
    title_length = len(level_indicator) + 1 + len(formatted_title)
    right_padding = 60 - title_length - left_padding
    
    # Create the header box
    header_box = f"""
+{horizontal_line}+
|{' ' * left_padding}{level_indicator} {formatted_title}{' ' * right_padding}|
+{horizontal_line}+
""".strip()
    
    # Combine header box with content
    return f"\n{header_box}\n\n{content}\n\n"


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
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        
        async def async_generator():
            async for item in async_generator_func(*args, **kwargs):
                q.put(item)
            q.put(StopIteration)

        try:
            new_loop.run_until_complete(async_generator())
        finally:
            new_loop.close()

    # Start the async code in a separate thread
    thread = threading.Thread(target=run_async_gen)
    thread.start()

    # Yield values from the queue
    while True:
        item = q.get()
        if item is StopIteration:
            break
        yield item

    thread.join()