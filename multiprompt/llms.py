from .imports import *
from .db import *
from .utils import *
from litellm import acompletion
from litellm.exceptions import BadRequestError


def get_cache_db():
    return sqlitedict.SqliteDict(PATH_LLM_CACHE, autocommit=True)


class BaseLLM(ABC):
    badprefixes = []
    api_key = None

    def __init__(self, model, api_key=None):
        self.model = model
        if api_key:
            self.api_key = api_key

    @classmethod
    def format_messages(self, user_prompt_or_messages, **prompt_kwargs):
        messages = (
            user_prompt_or_messages
            if type(user_prompt_or_messages) in {list, tuple}
            else self.format_prompt(
                user_prompt=user_prompt_or_messages, **prompt_kwargs
            )
        )
        return messages

    @classmethod
    def format_output(self, tokens):
        txt = "".join(tokens).strip()
        for bp in self.badprefixes:
            if txt.startswith(bp):
                txt = txt[len(bp) :].strip()
        return txt

    async def generate_async(
        self,
        user_prompt_or_messages,
        max_tokens=DEFAULT_MAX_TOKENS,
        temperature=DEFAULT_TEMP,
        **prompt_kwargs,
    ):
        messages = self.format_messages(user_prompt_or_messages, **prompt_kwargs)
        try:

            def acomplete(model):
                return acompletion(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    api_key=self.api_key,
                    stream=True,
                )

            # try:
            response = await acomplete(self.model)
            # except BadRequestError:
            # response = await acomplete('ollama/'+self.model)

            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"Error in generate_async: {str(e)}")
            raise

    def generate(self, *args, **kwargs):
        return self.format_output(run_async(self.generate_async, *args, **kwargs))

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
            messages.append({"role": "user", "content": cls.process_content(question)})
            messages.append({"role": "assistant", "content": answer})
        messages.append(
            {"role": "user", "content": cls.process_content(user_prompt, attachments)}
        )
        return messages

    @classmethod
    def process_content(cls, content, attachments=[]):
        processed_content = []
        if isinstance(content, str):
            processed_content.append({"type": "text", "text": content})
        elif isinstance(content, list):
            for item in content:
                if isinstance(item, str):
                    processed_content.append({"type": "text", "text": item})

        common_root = get_common_root(attachments)
        appendix_txt_file_count = 0
        for attachment in attachments:
            if cls.is_image(attachment):
                processed_content.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{cls.encode_image(attachment)}"
                        },
                    }
                )
            elif cls.is_video(attachment):
                # Handle video files as needed
                pass
            else:
                # For text files, read and add content separately
                with open(attachment, "r") as file:
                    file_content = file.read()
                    ext = os.path.splitext(attachment)[-1].lstrip(".")
                    processed_content.append(
                        {
                            "type": "text",
                            "text": f"## Appendix to user prompt{' (continued)' if appendix_txt_file_count else ''}\n\n### Contents of file: `{Path(attachment).relative_to(common_root)}`\n\n```{ext}\n{file_content}```",
                        }
                    )
                    appendix_txt_file_count += 1

        return processed_content

    @staticmethod
    def is_image(file_path):
        # Implement logic to check if the file is an image
        image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]
        return any(file_path.lower().endswith(ext) for ext in image_extensions)

    @staticmethod
    def is_video(file_path):
        # Implement logic to check if the file is a video
        video_extensions = [".mp4", ".avi", ".mov", ".wmv"]
        return any(file_path.lower().endswith(ext) for ext in video_extensions)

    @staticmethod
    def encode_image(image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    @classmethod
    def format_prompt_appendix(cls, attachments):
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


class AnthropicLLM(BaseLLM):
    api_key = ANTHROPIC_API_KEY


class OpenAILLM(BaseLLM):
    api_key = OPENAI_API_KEY


class GeminiLLM(BaseLLM):
    api_key = GEMINI_API_KEY


class LlamaLLM(BaseLLM):
    badprefixes = ["### System:"]

    def __init__(self, model, api_key=None):
        super().__init__(
            model="ollama/" + model if not model.startswith("ollama/") else model,
            api_key=api_key,
        )
