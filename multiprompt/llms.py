from .imports import *
from .db import *
from .utils import *
from litellm import acompletion
from litellm.exceptions import BadRequestError
import sys
from abc import ABC, abstractmethod
from .messages import Message, MessageList


def get_cache_db():
    return sqlitedict.SqliteDict(PATH_LLM_CACHE, autocommit=True)


class BaseLLM(ABC):
    badprefixes = []
    api_key = None

    def __init__(self, model: str, api_key: Optional[str] = None):
        self.model = model
        if api_key:
            self.api_key = api_key

    @classmethod
    def format_messages(
        cls,
        user_prompt_or_messages: Union[str, MessageList],
        system_prompt: Optional[str] = None,
        **prompt_kwargs,
    ) -> MessageList:
        if isinstance(user_prompt_or_messages, MessageList):
            messages = user_prompt_or_messages
            if system_prompt:
                messages = MessageList([Message(role="system", content=system_prompt)]) + messages
        else:
            user_prompt = user_prompt_or_messages
            messages = cls.format_prompt(
                user_prompt=user_prompt, system_prompt=system_prompt, **prompt_kwargs
            )
        return messages

    @classmethod
    def format_output(cls, tokens: List[str]) -> str:
        txt = "".join(tokens).strip()
        for bp in cls.badprefixes:
            if txt.startswith(bp):
                txt = txt[len(bp) :].strip()
        return txt

    # @abstractmethod
    # async def generate_async(
    #     self,
    #     user_prompt_or_messages: Union[str, List[Message]],
    #     system_prompt: Optional[str] = None,
    #     max_tokens: int = DEFAULT_MAX_TOKENS,
    #     temperature: float = DEFAULT_TEMP,
    #     verbose: bool = True,
    #     force: bool = False,
    #     **prompt_kwargs
    # ) -> AsyncGenerator[str, None]:
    #     pass

    async def generate_async(
        self,
        user_prompt_or_messages: Union[str, List[Message]],
        system_prompt: Optional[str] = None,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMP,
        verbose: bool = True,
        force: bool = False,
        **prompt_kwargs,
    ) -> AsyncGenerator[str, None]:
        messages = self.format_messages(
            user_prompt_or_messages,
            system_prompt=system_prompt,
            **prompt_kwargs,
        )
        params = dict(
            model=self.model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        cachekey = generate_cache_key(params)
        with get_cache_db() as db:
            if force or cachekey not in db:
                try:
                    response = await acompletion(
                        **params,
                        api_key=self.api_key,
                        stream=True,
                    )
                    out = []
                    async for chunk in response:
                        token = chunk.choices[0].delta.content
                        if token:
                            yield token
                            out.append(token)
                            if verbose:
                                print(token, end="", flush=True, file=sys.stderr)
                    # Store in cache
                    db[cachekey] = out
                except Exception as e:
                    logger.error(f"Error in generate_async: {str(e)}")
                    raise
            else:
                # If response is in cache, yield tokens from the cached list
                for token in db[cachekey]:
                    yield token
                    if verbose:
                        print(token, end="", flush=True, file=sys.stderr)
                    await asyncio.sleep(random.random() / 100)

    def generate(self, *args, **kwargs) -> str:
        return self.format_output(run_async(self.generate_async, *args, **kwargs))

    @classmethod
    def format_prompt(
        cls,
        user_prompt: str,
        attachments: List[str] = [],
        system_prompt: str = "",
        example_prompts: List[Tuple[str, str]] = [],
        **kwargs,
    ) -> MessageList:
        messages = MessageList()
        if system_prompt:
            messages.add_system_message(system_prompt)
        for question, answer in example_prompts:
            messages.add_user_message(question)
            messages.add_assistant_message(answer)
        messages.add_user_message(user_prompt, attachments=attachments)
        return messages

    @classmethod
    def format_prompt_appendix(cls, attachments: List[str]) -> str:
        logger.info(pformat(attachments))
        directory_structure = generate_directory_structure(attachments)
        formatted_appendix = f"## Appendix for User Prompt\n\n### Directory Structure\n\n```\n{directory_structure}\n```\n\n"

        common_root = Path(os.path.commonpath(attachments))

        for file_path in attachments:
            relative_path = Path(file_path).relative_to(common_root)
            ext = relative_path.suffix.lstrip(".")
            try:
                with open(file_path, "r") as file:
                    content = file.read()
                    formatted_appendix += (
                        f"\n\n#### {relative_path}\n\n```{ext}\n{content}\n```"
                    )
            except Exception as e:
                logger.error(f"Error reading file {file_path}: {str(e)}")

        return formatted_appendix.strip()


class AnthropicLLM(BaseLLM):
    api_key = ANTHROPIC_API_KEY


class OpenAILLM(BaseLLM):
    api_key = OPENAI_API_KEY
    # Implement OpenAI-specific generate_async method


class GeminiLLM(BaseLLM):
    api_key = GEMINI_API_KEY
    # Implement Gemini-specific generate_async method


class LlamaLLM(BaseLLM):
    badprefixes = ["### System:"]
    # Implement Llama-specific generate_async method


@cache
def LLM(model: str) -> BaseLLM:
    if model.startswith("claude"):
        return AnthropicLLM(model)
    elif model.startswith("gpt"):
        return OpenAILLM(model)
    elif model.startswith("gemini"):
        return GeminiLLM(model)
    else:
        return LlamaLLM(model)