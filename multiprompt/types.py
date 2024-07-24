from typing import TypedDict, List, Union, Callable, Any


class AgentConfig(TypedDict):
    name: str
    position: int
    model: str
    system_prompt: str
    temperature: float
    max_tokens: int