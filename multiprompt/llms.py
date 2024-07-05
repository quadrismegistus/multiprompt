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
    def stream(self, messages, max_tokens, temperature):
        pass

    def generate(
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
        return iter_async_generator(self.stream, messages, max_tokens=max_tokens, temperature=temperature)
        # return self.stream(messages, max_tokens=max_tokens, temperature=temperature)

    @classmethod
    @abstractmethod
    def get_client(cls):
        pass

    @classmethod
    def format_prompt(
        cls,
        user_prompt,
        reference_prompt="",
        system_prompt="",
        example_prompts=[],
        **kwargs,
    ):
        messages = []
        if reference_prompt:
            user_prompt += make_ascii_section(
                "User prompt appendix", reference_prompt, 2
            )
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        for question, answer in example_prompts:
            messages.append({"role": "user", "content": question})
            messages.append({"role": "assistant", "content": answer})
        messages.append({"role": "user", "content": user_prompt})
        return messages


class AnthropicLLM(BaseLLM):
    api_key = ANTHROPIC_API_KEY

    @classmethod
    @cache
    def get_client(cls):
        import anthropic

        if not cls.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        return anthropic.AsyncAnthropic(api_key=cls.api_key)

    async def stream(
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

    async def stream(
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

    async def stream(
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

    async def stream(
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
    streamer = llm.generate_async(**kwargs)
    async for response in streamer: 
        yield response
