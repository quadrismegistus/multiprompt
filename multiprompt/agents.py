from .imports import *

class Agent:
    def __init__(self, id: str, name: str, model: str = DEFAULT_MODEL, 
                 system_prompt: str = DEFAULT_SYSTEM_PROMPT, temperature: float = DEFAULT_TEMP):
        self.id = id
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.temperature = temperature

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model,
            "system_prompt": self.system_prompt,
            "temperature": self.temperature
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Agent':
        return cls(
            id=data['id'],
            name=data['name'],
            model=data.get('model', DEFAULT_MODEL),
            system_prompt=data.get('system_prompt', DEFAULT_SYSTEM_PROMPT),
            temperature=data.get('temperature', DEFAULT_TEMP)
        )
