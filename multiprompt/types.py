from typing import TypedDict, List, Union, Callable, Any

class Message(TypedDict):
    role: str
    content: Union[str, List[dict]]

class AgentConfig(TypedDict):
    name: str
    position: int
    model: str
    system_prompt: str
    temperature: float
    max_tokens: int