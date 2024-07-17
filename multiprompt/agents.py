from .imports import *
from .llms import LLM
from .utils import run_async


@cache
def get_agents_json():
    with open(PATH_AGENTS_JSON) as f:
        return json.load(f)


@cache
def Agent(name, **kwargs):
    if type(name) is AgentModel:
        return name
    already = [a for a in get_agents_json() if a.get("name") == name]
    if already:
        agent_d = {**already[0], **kwargs}
    else:
        agent_d = {"name": name, **kwargs}
    return AgentModel(**{k: v for k, v in agent_d.items() if v is not None})


class AgentModel:
    def __init__(
        self,
        name: str,
        position: int = 1,
        model: str = DEFAULT_MODEL,
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        temperature: float = DEFAULT_TEMP,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        **kwargs,
    ):
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.position = position
        self.max_tokens = max_tokens

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "position": self.position,
            "model": self.model,
            "system_prompt": self.system_prompt,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Agent":
        return cls(
            name=data["name"],
            model=data.get("model", DEFAULT_MODEL),
            system_prompt=data.get("system_prompt", DEFAULT_SYSTEM_PROMPT),
            temperature=data.get("temperature", DEFAULT_TEMP),
            max_tokens=data.get("max_tokens", DEFAULT_MAX_TOKENS),
        )

    @cached_property
    def llm(self):
        return LLM(self.model)

    async def generate_async(
        self,
        user_prompt_or_messages,
        system_prompt="",
        temperature=None,
        max_tokens=None,
        verbose=True,
        force=False,
        **prompt_kwargs,
    ):
        sysprompt = self.system_prompt if not system_prompt else self.system_prompt+"\n\n"+system_prompt
        async for token in self.llm.generate_async(
            user_prompt_or_messages,
            system_prompt=sysprompt,
            temperature=temperature or self.temperature,
            max_tokens=max_tokens or self.max_tokens,
            verbose=verbose,
            force=force,
            **prompt_kwargs,
        ):
            yield token

    def generate(self, *args, **kwargs):
        return self.format_output(run_async(self.generate_async, *args, **kwargs))

    def format_output(self, tokens):
        return self.llm.format_output(tokens)
