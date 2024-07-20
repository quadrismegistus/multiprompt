from .imports import *
from .llms import LLM, BaseLLM
from .utils import run_async
from .types import AgentConfig
from .messages import MessageList
from abc import ABC, abstractmethod


class BaseAgent(ABC):
    @abstractmethod
    async def generate_async(
        self,
        user_prompt_or_messages: Union[str, MessageList],
        system_prompt: str = "",
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    def generate(self, *args, **kwargs) -> str:
        pass

    @abstractmethod
    def preprocess_messages(self, messages: MessageList) -> MessageList:
        pass


class AgentModel(BaseAgent):
    def __init__(
        self,
        name: str,
        llm: BaseLLM,
        position: int = 1,
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        temperature: float = DEFAULT_TEMP,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        **kwargs,
    ):
        self.name = name
        self.llm = llm
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.position = position
        self.max_tokens = max_tokens

    def to_dict(self) -> AgentConfig:
        return {
            "name": self.name,
            "position": self.position,
            "model": self.llm.model,
            "system_prompt": self.system_prompt,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

    @classmethod
    def from_dict(cls, data: AgentConfig) -> "AgentModel":
        llm = LLM(data.get("model", DEFAULT_MODEL))
        return cls(
            name=data["name"],
            llm=llm,
            system_prompt=data.get("system_prompt", DEFAULT_SYSTEM_PROMPT),
            temperature=data.get("temperature", DEFAULT_TEMP),
            max_tokens=data.get("max_tokens", DEFAULT_MAX_TOKENS),
        )

    def preprocess_messages(self, messages: MessageList) -> MessageList:
        return messages

    async def generate_async(
        self,
        user_prompt_or_messages: Union[str, MessageList],
        system_prompt: str = "",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        verbose: bool = True,
        force: bool = False,
        **prompt_kwargs,
    ) -> AsyncGenerator[str, None]:
        sysprompt = (
            self.system_prompt
            if not system_prompt
            else self.system_prompt + "\n\n" + system_prompt
        )
        async for token in self.llm.generate_async(
            self.preprocess_messages(user_prompt_or_messages),
            system_prompt=sysprompt,
            temperature=temperature or self.temperature,
            max_tokens=max_tokens or self.max_tokens,
            verbose=verbose,
            force=force,
            **prompt_kwargs,
        ):
            yield token

    def generate(self, *args, **kwargs) -> str:
        return self.llm.format_output(run_async(self.generate_async, *args, **kwargs))


class AlgorithmicAgent(AgentModel):
    def __init__(
        self, name: str, algorithm_func: Callable[[MessageList], str], **kwargs
    ):
        self.name = name
        self.algorithm_func = algorithm_func
        self.position = kwargs.get("position", 1)

    def preprocess_messages(self, messages: MessageList) -> MessageList:
        return messages

    async def generate_async(
        self,
        user_prompt_or_messages: Union[str, MessageList],
        system_prompt: str = "",
        verbose: bool = True,
        force: bool = False,
        **prompt_kwargs,
    ) -> AsyncGenerator[str, None]:
        messages = BaseLLM.format_messages(user_prompt_or_messages, system_prompt)
        messages = self.preprocess_messages(messages)

        result = await self._run_algorithm(messages)

        for token in result:
            if verbose:
                print(token, end="", flush=True, file=sys.stderr)
            yield token

    async def _run_algorithm(self, messages: MessageList) -> str:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self.algorithm_func, messages)
        return result

    def generate(self, *args, **kwargs) -> str:
        return "".join(run_async(self.generate_async, *args, **kwargs))


def Agent(name: str, **kwargs) -> BaseAgent:
    if isinstance(name, BaseAgent):
        return name
    if kwargs.get("algorithm_func"):
        return AlgorithmicAgent(name=name, **kwargs)
    llm = LLM(kwargs.get("model", DEFAULT_MODEL))
    return AgentModel(name=name, llm=llm, **kwargs)


@cache
def get_agents_json() -> List[Dict[str, Any]]:
    with open(PATH_AGENTS_JSON) as f:
        return json.load(f)


def parse_agents_list(
    agents: List[Union[str, Dict[str, Any], List[Union[str, Dict[str, Any]]]]]
) -> List[Agent]:
    out = []
    for i, agent in enumerate(agents):
        if isinstance(agent, list):
            for agent2 in agent:
                if isinstance(agent2, str):
                    agent2 = {"name": agent2}
                if "position" not in agent2:
                    agent2["position"] = i + 1
                out.append(Agent(**agent2))
        else:
            if isinstance(agent, str):
                agent = {"name": agent}
            if "position" not in agent:
                agent["position"] = i + 1
            out.append(Agent(**agent))
    return out
