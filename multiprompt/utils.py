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