from .imports import *
from .llms import LLM
from .utils import run_async

@cache
def get_agents_json():
    with open(PATH_AGENTS_JSON) as f:
        return json.load(f)

@cache
def Agent(name, **kwargs):
    if type(name) is AgentModel: return name
    already = [a for a in get_agents_json() if a.get('name') == name]
    if already:
        agent_d = {**already[0], **kwargs}
    else:
        agent_d = {'name':name, **kwargs}
    return AgentModel(**{k:v for k,v in agent_d.items() if v is not None})
        

class AgentModel:
    def __init__(
        self,
        name: str,
        position: int = 1,
        model: str = DEFAULT_MODEL,
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        temperature: float = DEFAULT_TEMP,
        **kwargs
    ):
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.position = position

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "position":self.position,
            "model": self.model,
            "system_prompt": self.system_prompt,
            "temperature": self.temperature,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Agent":
        return cls(
            name=data["name"],
            model=data.get("model", DEFAULT_MODEL),
            system_prompt=data.get("system_prompt", DEFAULT_SYSTEM_PROMPT),
            temperature=data.get("temperature", DEFAULT_TEMP),
        )
    
    @cached_property
    def llm(self):
        return LLM(self.model)

    def format_prompt(self, user_prompt_or_messages, system_prompt=None, **prompt_kwargs):
        if not system_prompt: system_prompt=self.system_prompt
        if not system_prompt: system_prompt=DEFAULT_SYSTEM_PROMPT
        if user_prompt_or_messages and type(user_prompt_or_messages) in {list, tuple}:
            messages = user_prompt_or_messages
            if not len([d for d in messages if d['role']=='system']):
                messages.insert(0,{'role':'system', 'content':system_prompt})
        else:
            messages = self.llm.format_prompt(
                user_prompt_or_messages,
                system_prompt=system_prompt,
                **prompt_kwargs
            )
        return messages



    async def generate_async(self, user_prompt_or_messages, system_prompt=None, **prompt_kwargs):
        messages = self.format_prompt(
            user_prompt_or_messages,
            system_prompt=system_prompt,
            **prompt_kwargs
        )
        async for token in self.llm.generate_async(
            messages, 
            temperature=self.temperature,
        ):
            yield token

    def generate(self, prompt_now, temperature=None):
        return ''.join(run_async(self.generate_async, prompt_now, temperature=temperature))