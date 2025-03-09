from . import *
# from litellm import Router

# def get_model_list():
#     with open(PATH_MODELS_JSON, "r") as f:
#         model_list = json.load(f)
#     return [{
#         'model_name': model['name'],
#         'litellm_params': {
#             'model': model['model'],
#             'timeout': 300,
#             'stream_timeout': 300
#         }
#     } for model in model_list]

# model_list = get_model_list()

# router = Router(
#     model_list=model_list,
#     timeout=300,
#     routing_strategy="least-busy"
# )


class BaseLLM(ABC):
    badprefixes = []
    api_key = None

    def __init__(self, model: str, api_key: Optional[str] = None):
        self.model = model
        if api_key:
            self.api_key = api_key

    @staticmethod
    def format_messages(user_prompt: Union[str, 'MessageList'], system_prompt: str = "") -> 'MessageList':
        if isinstance(user_prompt, MessageList):
            return user_prompt
        messages = MessageList()
        if system_prompt:
            messages.add_system_message(system_prompt)
        messages.add_user_message(user_prompt)
        return messages

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
                timeout=300,
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
    

