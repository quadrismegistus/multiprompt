from . import *

class Message(UserDict):
    def __init__(self, role='user', content="", attachments=[], example=None,**kwargs):
        content = self.process_content(content, attachments=attachments)
        super().__init__(role=role, content=content)
        if example is not None:
            self['example'] = example
        if attachments:
            self['attachments'] = attachments

    def to_dict(self):
        return {k:v for k,v in {
            'role': self.role,
            'content': self.text,
            'example': self.is_example,
            'attachments': self.attachments
        }.items() if v is not None}
    
    @classmethod
    def from_dict(cls, d):
        return cls(**d)
    
    def __reduce__(self):
        return (self.__class__.from_dict, (self.to_dict(),))
    
    def __hash__(self):
        from hashstash import serialize
        return hash(serialize(self.to_dict()))

    @property
    def role(self):
        return self.get('role')
    
    @property
    def attachments(self):
        return self.get('attachments')
    
    @property
    def text(self):
        return self.get_text()
    
    @property
    def content(self):
        return self.get('content')
    
    @property
    def is_example(self):
        return self.get('example',False)
    
    def __str__(self):
        return f"[{self.role.upper()}]\n{self.content}"
    
    def __add__(self, other):
        if isinstance(other,dict): other = Message(**other)
        assert isinstance(other,Message)
        return Message(role=self.role, content=self.content + other.content)

    def get_text(self) -> str:
        if isinstance(self.content, str):
            return self.content
        elif isinstance(self.content, list):
            return ' '.join([item['text'] for item in self.content if item['type'] == 'text'])
        return ""

    def has_image(self) -> bool:
        if isinstance(self.content, list):
            return any(item['type'] == 'image_url' for item in self.content)
        return False

    def get_images(self) -> List[Dict[str, str]]:
        if isinstance(self.content, list):
            return [item['image_url'] for item in self.content if item['type'] == 'image_url']
        return []
    
    def get_attachments(self):
        return self.get('attachments',[])

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

        if attachments:
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
        msg = Message(role=role, content=content, **kwargs)
        if role=='system':
            if len(self) and role == self[0].role:
                self[0]+=msg
            else:
                self.insert(0,msg)
        else:
            if len(self) and role == self[-1].role:
                self[-1]+=msg
            else:
                self.append(msg)

    def add_system_message(self, content: Union[str, List[dict]], **kwargs):
        self.add_message("system", content, **kwargs)

    def add_example_messages(self, example_prompts):
        for question, answer in (example_prompts if example_prompts else []):
            self.add_user_message(question, example=True)
            self.add_assistant_message(answer, example=True)

    def add_user_message(self, content: Union[str, List[dict]], **kwargs):
        self.add_message("user", content, **kwargs)

    def add_assistant_message(self, content: Union[str, List[dict]], **kwargs):
        self.add_message("assistant", content, **kwargs)

    def add_agent_message(self, agent, content: Union[str, List[dict]], **kwargs):
        # if isinstance(content,str): content=f'>>> Response from {agent.name}:\n\n{content}'
        self.add_assistant_message(content, **agent.to_dict(), **kwargs)

    def get_last_message(self) -> Message:
        return self[-1] if self else None
    
    def get_last_user_message(self) -> Message:
        l=self.get_user_messages()
        return l[-1] if l else None

    def get_messages_by_role(self, role: str) -> List[Message]:
        return [msg for msg in self if msg["role"] == role]
    
    def get_user_messages(self):
        return self.get_messages_by_role('user')
    
    def get_message_content(self, role=None, sep='\n\n'):
        if role == 'example':
            return [(x.get_text(), y.get_text()) for x,y in self.get_example_message_tuples()]
        else:
            return self.get_text(role=role, sep=sep)
    
    def get_messages(self, role=None):
        eg_msgs = self.get_example_messages()
        if role=='example':
            return eg_msgs
        else:
            eg_msg_set = set(eg_msgs)
            return [msg for msg in self if (not role or (msg.role==role and msg not in eg_msg_set))]
    

    def get_example_messages(self):
        return [
            msg 
            for msg in self
            if msg.is_example
        ]
    
    def get_example_message_tuples(self):
        eg_msgs = self.get_example_messages()
        return list(zip(eg_msgs[::2], eg_msgs[1::2]))

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
    
    def get_text(self, role:str=None, sep='\n') -> str:
        return sep.join(
            msg.get_text()
            for msg in self.get_messages(role)
        )
    
    @classmethod
    def from_prompt(
        cls,
        user_prompt: Union[str, List[Message]] = None,
        attachments: List[str] = None,
        system_prompt: str = None,
        example_prompts: List[Tuple[str, str]] = None,
    ):
        messages = cls()
        if system_prompt:
            messages.add_system_message(system_prompt)
        if example_prompts:
            messages.add_example_messages(example_prompts)
        if user_prompt:
            messages.add_user_message(
                user_prompt,
                attachments=attachments,
            )
        return messages

    def to_dict(self):
        return {'messages': self.to_list()}
    
    def to_list(self):
        return [msg.to_dict() for msg in self]
    
    @classmethod
    def from_list(cls, l):
        return cls([Message.from_dict(msg) for msg in l])
    
    def from_dict(cls, d):
        return cls(**d.get('messages',{}))
    
    def __reduce__(self):
        return (self.__class__.from_dict, (self.to_dict(),))