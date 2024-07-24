from .imports import *
from .utils import *

class Message(UserDict):
    def __init__(self, role='user', content="", attachments=[], **kwargs):
        if not content:
            raise ValueError("Message must have content")
        content = self.process_content(content, attachments=attachments)
        super().__init__(role=role, content=content)
    
    def __str__(self):
        return f"[{self['role'].upper()}]\n{self['content']}"

    def get_text(self) -> str:
        if isinstance(self['content'], str):
            return self['content']
        elif isinstance(self['content'], list):
            return ' '.join([item['text'] for item in self['content'] if item['type'] == 'text'])
        return ""

    def has_image(self) -> bool:
        if isinstance(self['content'], list):
            return any(item['type'] == 'image_url' for item in self['content'])
        return False

    def get_images(self) -> List[Dict[str, str]]:
        if isinstance(self['content'], list):
            return [item['image_url'] for item in self['content'] if item['type'] == 'image_url']
        return []

    @staticmethod
    def process_content(content: Union[str, List[dict]], attachments: List[str] = []) -> List[dict]:
        processed_content = []
        if isinstance(content, str):
            processed_content.append({"type": "text", "text": content})
        elif isinstance(content, list):
            for item in content:
                if isinstance(item, str):
                    processed_content.append({"type": "text", "text": item})
                elif isinstance(item, dict):
                    processed_content.append(item)

        common_root = get_common_root(attachments)
        appendix_txt_file_count = 0
        for attachment in attachments:
            if Message.is_image(attachment):
                processed_content.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{Message.encode_image(attachment)}"
                        },
                    }
                )
            elif Message.is_video(attachment):
                # Handle video files as needed
                pass
            else:
                # For text files, read and add content separately
                with open(attachment, "r") as file:
                    file_content = file.read()
                    ext = os.path.splitext(attachment)[-1].lstrip(".")
                    processed_content.append(
                        {
                            "type": "text",
                            "text": f"## Appendix to user prompt{' (continued)' if appendix_txt_file_count else ''}\n\n### Contents of file: `{Path(attachment).relative_to(common_root)}`\n\n```{ext}\n{file_content}```",
                        }
                    )
                    appendix_txt_file_count += 1

        return processed_content

    @staticmethod
    def is_image(file_path: str) -> bool:
        image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]
        return any(file_path.lower().endswith(ext) for ext in image_extensions)

    @staticmethod
    def is_video(file_path: str) -> bool:
        video_extensions = [".mp4", ".avi", ".mov", ".wmv"]
        return any(file_path.lower().endswith(ext) for ext in video_extensions)

    @staticmethod
    def encode_image(image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

class MessageList(UserList):
    def __init__(self, data: List[Message] = None):
        super().__init__(data or [])

    def add_message(self, role: str, content: Union[str, List[dict]], **kwargs):
        self.append(Message(role=role, content=content, **kwargs))

    def add_system_message(self, content: Union[str, List[dict]], **kwargs):
        self.add_message("system", content, **kwargs)

    def add_user_message(self, content: Union[str, List[dict]], **kwargs):
        self.add_message("user", content, **kwargs)

    def add_assistant_message(self, content: Union[str, List[dict]], **kwargs):
        self.add_message("assistant", content, **kwargs)

    def get_last_message(self) -> Message:
        return self[-1] if self else None
    
    def get_last_user_message(self) -> Message:
        l=self.get_user_messages()
        return l[-1] if l else None

    def get_messages_by_role(self, role: str) -> List[Message]:
        return [msg for msg in self if msg["role"] == role]
    
    def get_user_messages(self):
        return self.get_messages_by_role('user')

    def clear_messages(self):
        self.clear()

    def to_dict_list(self) -> List[Dict[str, Union[str, List[dict]]]]:
        return list(self)

    def get_last_user_message_txt(self) -> str:
        """Extract the text content of the last user message."""
        msg = self.get_last_user_message()
        return msg.get_text() if msg else ""
    
    def get_last_message_txt(self) -> str:
        """Extract the text content of the last user message."""
        msg = self.get_last_message()
        return msg.get_text() if msg else ""

    def __str__(self):
        return "\n\n".join(str(msg) for msg in self)