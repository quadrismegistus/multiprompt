from . import *


class Prompt:
    def __init__(
        self,
        user_prompt: Union[str, List[Message]] = DEFAULT_USER_PROMPT,
        attachments: List[str] = None,
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        example_prompts: List[Tuple[str, str]] = None,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMP,
        verbose: bool = DEFAULT_AGENT_VERBOSE,
        stash: Optional["BaseHashStash"] = None,
        **kwargs,
    ):
        # model attrs
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.verbose = verbose
        self.stash = None if stash is False else (STASH if stash is None else stash)

        # prompt attrs
        if not isinstance(user_prompt,MessageList):
            self.messages = MessageList.from_prompt(
                user_prompt=user_prompt,
                attachments=attachments,
                system_prompt=system_prompt,
                example_prompts=example_prompts,
            )


    @property
    def user_prompt(self):
        return self.messages.get_message_content('user')

    @property
    def system_prompt(self):
        return self.messages.get_message_content('system')

    @property
    def example_prompts(self):
        return self.messages.get_message_content('example')
    
    @property
    def attachments(self):
        return [attachment for msg in self.messages for attachment in msg.get('attachments',[])]

    @property
    def assistant_prompt(self):
        return self.messages.get_message_content('assistant')

    def to_dict(self):
        return {
            'user_prompt': self.user_prompt,
            'attachments': self.attachments,
            'system_prompt': self.system_prompt,
            'example_prompts': self.example_prompts,
            'model': self.model,
            'max_tokens': self.max_tokens,
            'temperature': self.temperature,
            'verbose': self.verbose,
        }
    
    def __eq__(self, other):
        return self.to_dict() == other.to_dict()

    @classmethod
    def from_dict(cls, d):
        return cls(**d)

    def __reduce__(self):
        return (self.__class__.from_dict, (self.to_dict(),))

    @cached_property
    def messages(self):
        return MessageList.from_prompt(
            user_prompt=self.user_prompt,
            attachments=self.attachments,
            system_prompt=self.system_prompt,
            example_prompts=self.example_prompts,
        )

    @property
    def params(self):
        return dict(
            **self.messages.to_dict(),
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            verbose=self.verbose,
        )

    @property
    def llm(self):
        return LLM(model=self.model)

    @cached_property
    def key(self, without={"verbose"}):
        return serialize({k: v for k, v in self.to_dict().items() if k not in without})

    @cached_property
    def db(self):
        return STASH

    async def generate_async(self, _force=False, **kwargs):
        if _force or not self.is_stashed:
            l = []
            async for token in self.llm.generate_async(**self.params, **kwargs):
                yield token
                l.append(token)
            if self.stash is not None:
                lt = tuple(l)
                self.stash.set(self.key, lt)
        else:
            for token in self.db.get(self.key):
                yield token

    @property
    def is_stashed(self):
        return self.stash is not None and self.key in self.stash

    def generate(self, _force=False, sep="", **kwargs):
        if _force or not self.is_stashed:
            l = run_async(self.generate_async, _force=True, **kwargs)
        else:
            l = self.db.get(self.key)
        return self.format_response(l, sep=sep)

    @property
    def response(self):
        return self.generate()
    
    @property
    def response_repr(self):
        return self.generate()
    
    @property
    def response_d(self):
        res=self.response
        return {'response':res} if not isinstance(res,dict) else res
    
    @property
    def result_d(self):
        return {**self.to_dict(), **self.response_d}

    @property
    def responses(self):
        return [self.format_response(r) for r in self.stash.get_all(self.key,[])]

    def format_response(self, l, sep=""):
        return sep.join(l) if sep is not None else l

    @property
    def new_response(self):
        return self.generate(_force=True)

    @property
    def response_set(self):
        return set(self.responses)

    @property
    def response_iter(self):
        yield from self.generate(sep=None)

    def copy(self):
        return self.__class__.from_dict(self.to_dict())

    def new(self, user_prompt: Union[str, MessageList] = None, **kwargs):
        if user_prompt or kwargs:
            data = {**self.to_dict()}
            if user_prompt:
                data['user_prompt'] = user_prompt
            data.update(kwargs)
            new = Prompt(**data)
            return new
        else:
            return self