from .imports import *
from .db import *
from .utils import *


def get_cache_db():
    return sqlitedict.SqliteDict(PATH_LLM_CACHE, autocommit=True)


class BaseLLM(ABC):
    api_key = None

    def __init__(self, model, api_key=None):
        self.model = model
        if api_key:
            self.api_key = api_key

    @abstractmethod
    async def generate_async(self, messages, max_tokens, temperature):
        pass

    async def generate(
        self,
        user_prompt_or_messages,
        reference_prompt="",
        system_prompt="",
        example_prompts=[],
        max_tokens=DEFAULT_MAX_TOKENS,
        temperature=DEFAULT_TEMP,
    ):
        messages = (
            user_prompt_or_messages
            if type(user_prompt_or_messages) in {list, tuple}
            else self.format_prompt(
                user_prompt=user_prompt_or_messages,
                reference_prompt=reference_prompt,
                system_prompt=system_prompt,
                example_prompts=example_prompts,
            )
        )
        async for token in self.generate_async(
            messages, max_tokens=max_tokens, temperature=temperature
        ):
            yield token

    @classmethod
    @abstractmethod
    def get_client(cls):
        pass

    @classmethod
    def format_prompt(
        cls,
        user_prompt,
        attachments=[],
        system_prompt="",
        example_prompts=[],
        **kwargs,
    ):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        for question, answer in example_prompts:
            messages.append({"role": "user", "content": question})
            messages.append({"role": "assistant", "content": answer})
        if attachments:
            appendix = cls.format_prompt_appendix(attachments)
            messages.append({"role": "user", "content": appendix})
        return messages
    
    @classmethod
    def format_prompt_appendix(cls, attachments):
        logger.info(pformat(attachments))
        directory_structure = generate_directory_structure(attachments)
        formatted_appendix = f"## Appendix for User Prompt\n\n### Directory Structure\n\n```\n{directory_structure}\n```\n\n"
        
        common_root = Path(os.path.commonpath(attachments))
        
        for file_path in attachments:
            relative_path = Path(file_path).relative_to(common_root)
            ext = relative_path.suffix.lstrip('.')
            try:
                with open(file_path, 'r') as file:
                    content = file.read()
                    formatted_appendix += f"\n\n#### {relative_path}\n\n```{ext}\n{content}\n```"
            except Exception as e:
                logger.error(f"Error reading file {file_path}: {str(e)}")
        
        return formatted_appendix.strip()


class AnthropicLLM(BaseLLM):
    api_key = ANTHROPIC_API_KEY

    @classmethod
    @cache
    def get_client(cls):
        import anthropic

        if not cls.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        return anthropic.AsyncAnthropic(api_key=cls.api_key)

    async def generate_async(
        self, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
    ):
        client = self.get_client()
        sys_prompt = "\n\n\n\n".join(
            d.get("content", "") for d in messages if d["role"] == "system"
        ).strip()
        messages = [d for d in messages if d["role"] != "system"]
        async with client.messages.stream(
            model=self.model,
            max_tokens=max_tokens,
            messages=messages,
            system=sys_prompt,
            temperature=temperature,
        ) as stream:
            async for text in stream.text_stream:
                yield text


class OpenAILLM(BaseLLM):
    api_key = OPENAI_API_KEY

    @classmethod
    @cache
    def get_client(cls):
        import openai

        if not cls.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        return openai.AsyncOpenAI(api_key=cls.api_key)

    async def generate_async(
        self, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
    ):
        client = self.get_client()
        stream = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content


class GeminiLLM(BaseLLM):
    api_key = GEMINI_API_KEY

    @classmethod
    @cache
    def get_client(cls):
        if not cls.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=cls.api_key)
        return genai

    async def generate_async(
        self, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
    ):
        gemini_client = self.get_client()
        gemini_model = gemini_client.GenerativeModel(model_name=self.model)
        response = gemini_model.generate_content(
            convert_prompt_messages_to_str(messages),
            generation_config=GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            ),
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
            stream=True,
        )
        for chunk in response:
            if chunk.parts:
                for part in chunk.parts:
                    if hasattr(part, "text"):
                        yield part.text
            await asyncio.sleep(0.05)

    @classmethod
    def format_prompt(cls, *args, **kwargs):
        return convert_prompt_messages_to_str(super().format_prompt(*args, **kwargs))


class LlamaLLM(BaseLLM):
    @classmethod
    @cache
    def get_client(cls):
        from ollama import AsyncClient

        return AsyncClient()

    async def generate_async(
        self, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
    ):
        client = self.get_client()
        response = await client.generate(
            model=self.model,
            prompt=messages,
            stream=True,
        )
        async for part in response:
            yield part["response"]

    @classmethod
    def format_prompt(cls, *args, **kwargs):
        return convert_prompt_messages_to_str(super().format_prompt(*args, **kwargs))


@cache
def LLM(model):
    if model.startswith("claude"):
        return AnthropicLLM(model)
    elif model.startswith("gpt"):
        return OpenAILLM(model)
    elif model.startswith("gemini"):
        return GeminiLLM(model)
    else:
        return LlamaLLM(model)


async def stream_llm_response(
    model=DEFAULT_MODEL,
    **kwargs,
):
    llm = LLM(model)
    async for response in llm.generate(**kwargs):
        yield response
