from . import *


class BaseLLM(ABC):
    badprefixes = []
    api_key = None

    def __init__(self, model: str, api_key: Optional[str] = None):
        self.model = model
        if api_key:
            self.api_key = api_key

    async def generate_async(
        self,
        messages: 'MessageList',
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMP,
        verbose: bool = DEFAULT_AGENT_VERBOSE,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        try:
            response = await acompletion(
                model=self.model,
                messages = messages,
                max_tokens = max_tokens,
                temperature = temperature,
                api_key=self.api_key,
                stream=True,
            )
            async for chunk in response:
                token = chunk.choices[0].delta.content
                if token:
                    yield token
                    if verbose:
                        print(token, end="", flush=True, file=sys.stderr)
        except Exception as e:
            logger.error(f"Error in generate_async: {str(e)}")
            raise

    

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
    

