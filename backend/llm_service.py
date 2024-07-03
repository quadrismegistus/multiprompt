from config import *
from repo2llm import *


@cache
def get_anthropic_client():
    import anthropic

    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
    return anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)


@cache
def get_openai_client():
    import openai

    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    return openai.AsyncOpenAI(api_key=OPENAI_API_KEY)


@cache
def get_gemini_client(model="gemini-pro"):
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    genai.configure(api_key=GEMINI_API_KEY)
    return genai


@cache
def get_ollama_client():
    from ollama import AsyncClient

    return AsyncClient()


def get_cache_db():
    return sqlitedict.SqliteDict(PATH_LLM_CACHE, autocommit=True)


def generate_cache_key(data):
    hasher = hashlib.sha256()

    # Sort the dictionary items to ensure consistent ordering
    sorted_items = sorted(data.items(), key=lambda x: x[0])

    for key, value in sorted_items:
        # Convert the key and value to a consistent string representation
        key_str = str(key).encode("utf-8")

        # Handle different types of values
        if isinstance(value, (dict, list)):
            value_str = json.dumps(value, sort_keys=True).encode("utf-8")
        else:
            value_str = str(value).encode("utf-8")

        # Update the hasher with both key and value
        hasher.update(key_str)
        hasher.update(value_str)

    return hasher.hexdigest()


def format_prompt(
    user_prompt,
    system_prompt="",
    example_prompts=[],
    incl_repo=DEFAULT_INCL_REPO,
    **kwargs,
):
    messages = []
    if incl_repo:
        repo_analysis = analyze_repository(extensions=[".py", ".html", ".css", ".js"])
        system_prompt += f"\n\n\n# SYSTEM PROMPT APPENDIX:\n\n## Reference material\n\n{repo_analysis}"
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for question, answer in example_prompts:
        messages.append({"role": "user", "content": question})
        messages.append({"role": "assistant", "content": answer})
    # if incl_repo:
    #     repo_analysis = analyze_repository(extensions=[".py", ".html", ".css", ".js"])
    #     user_prompt += f"\n\n\n{repo_analysis}"
    messages.append({"role": "user", "content": user_prompt})
    return messages


async def generate_anthropic(
    model, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
):
    client = get_anthropic_client()
    sys_prompt = "\n\n\n\n".join(
        d.get("content", "") for d in messages if d["role"] == "system"
    ).strip()
    messages = [d for d in messages if d["role"] != "system"]
    async with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        system=sys_prompt,
        temperature=temperature,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def generate_openai(
    model, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
):
    client = get_openai_client()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content


async def generate_gemini(
    model, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
):
    gemini_client = get_gemini_client(model)
    gemini_model = gemini_client.GenerativeModel(model_name=model)
    response = gemini_model.generate_content(
        convert_openai_to_gemini_str(messages),
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


async def generate_ollama(
    model, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP
):
    client = get_ollama_client()
    formatted_prompt = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])
    response = await client.generate(
        model=model,
        prompt=formatted_prompt,
        stream=True,
        num_predict=max_tokens,
        temperature=temperature,
    )
    async for part in response:
        yield part["response"]


def get_generator_func(model):
    if model.startswith("claude"):
        return generate_anthropic
    elif model.startswith("gpt"):
        return generate_openai
    elif model.startswith("gemini"):
        return generate_gemini
    else:
        return generate_ollama


async def generate(model, messages, max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP):
    params=dict(
        model=model, 
        messages=messages, 
        max_tokens=max_tokens,
        temperature=temperature
    )
    cache_key = generate_cache_key(params)
    logger.info(f"looking for {cache_key}")
    with get_cache_db() as cache_db:
        if cache_key in cache_db:
            logger.info(f"Cache hit for key: {cache_key}")
            cached_response = cache_db[cache_key]
            for chunk in cached_response:
                yield chunk
                await asyncio.sleep(random.uniform(0, 0.01))
        else:
            try:
                generator_func = get_generator_func(model)
                alltext = []
                async for text in generator_func(**params):
                    yield text
                    alltext.append(text)
                cache_db[cache_key] = alltext
            except Exception as e:
                logger.error(f"Error in generate function for model {model}: {e}")
                yield f"Error: {str(e)}"


async def stream_llm_response(model=DEFAULT_MODEL,  max_tokens=DEFAULT_MAX_TOKENS, temperature=DEFAULT_TEMP, **kwargs):
    messages = format_prompt(model=model, **kwargs)
    async for response in generate(model=model, messages=messages, max_tokens=max_tokens, temperature=temperature):
        yield response


def convert_openai_to_gemini(openai_messages):
    l = []
    for msg in openai_messages:
        new_msg = {}
        new_msg["role"] = "model" if msg["role"] == "assistant" else "user"
        new_msg["parts"] = [msg["content"]]
        l.append(new_msg)
    return l


def convert_openai_to_gemini_str(openai_messages):
    l = []
    for msg in openai_messages:
        role, content = msg["role"], msg["content"]
        o = f"<{role}>{content}</{role}>"
        l.append(o)
    out = "\n\n".join(l)
    print(out)
    return out
