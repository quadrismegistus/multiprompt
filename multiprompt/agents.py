from . import *


class AgentModel:
    name: str = None
    position: int = 1
    model: str = DEFAULT_MODEL
    user_prompt: Optional[str] = DEFAULT_USER_PROMPT
    system_prompt: Optional[str] = DEFAULT_SYSTEM_PROMPT
    max_tokens: int = DEFAULT_MAX_TOKENS
    temperature: float = DEFAULT_TEMP
    verbose: bool = DEFAULT_AGENT_VERBOSE
    stash: "BaseHashStash" = None
    output_format = None
    index_by: List[str] = [
        "position",
        "agent",
        "system_prompt",
        "attachments",
        "example_prompts",
        "user_prompt",
        "max_tokens",
        "temperature",
        "model",
        "run",
    ]
    bad_cols = {"verbose", "prompt"}

    def __init__(
        self,
        name: str = None,
        position: int = None,
        prompt: Prompt = None,
        model: str = None,
        user_prompt: Optional[str] = None,
        system_prompt: Optional[str] = None,
        output_format: Optional[str] = None,
        max_tokens: int = None,
        temperature: float = None,
        verbose: bool = None,
        stash: "BaseHashStash" = None,
        **kwargs,
    ):
        self.name = name or self.name or self.__class__.__name__
        self.position = position or self.position
        self.stash = (stash or self.stash or STASH).sub(self.name)
        self.output_format = output_format or self.output_format
        self.user_prompt = user_prompt or self.user_prompt
        self.model = model or self.model
        self.system_prompt = system_prompt or self.system_prompt
        self.max_tokens = max_tokens or self.max_tokens
        self.temperature = temperature or self.temperature
        self.verbose = verbose or self.verbose
        self._agent_prompt = prompt or Prompt(
            model=self.model,
            user_prompt=self.user_prompt,
            system_prompt=self.system_prompt,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            verbose=self.verbose,
            stash=self.stash,
            **kwargs,
        )
        self._prompt = self._agent_prompt
        self._prompts = self.stash.get_all(self.key, default=[])

    @property
    def prompts(self):
        return self.stash.get_all(self.key, default=[])

    @property
    def messages(self):
        return self._prompt.messages

    @cached_property
    def key(self):
        return self.name

    def prompt(
        self, user_prompt: Union[str, MessageList] = None, prompt=None, **kwargs
    ):
        new_prompt = (
            self._agent_prompt.new(user_prompt=user_prompt, **kwargs)
            if prompt is None
            else prompt
        )
        for prompt in self._prompts:
            if new_prompt == prompt:
                return prompt

        self._prompt = new_prompt
        self.stash.set(self.key, new_prompt)
        self._prompts.append(new_prompt)
        return self._prompt

    def _generate(self, user_prompt: Union[str, MessageList], prompt=None, sep="", _force=False, **kwargs):
        prompt = self.prompt(
            user_prompt=user_prompt,
            prompt=prompt,
            **kwargs,
        )
        return prompt.generate(
            sep=sep,
            _force=_force,
        )

    def generate_many_iter(self, user_prompts: List[Union[str, MessageList]], **kwargs):
        return (self.generate(user_prompt, **kwargs) for user_prompt in tqdm(user_prompts))
    
    def generate_many(self, user_prompts: List[Union[str, MessageList]], **kwargs):
        return list(self.generate_many_iter(user_prompts, **kwargs))

    def generate(
        self,
        user_prompt=None,
        prompt=None,
        sep="",
        _force=False,
        postprocess=False,
        repr=False,
        **prompt_kwargs,
    ):
        response = self._generate(user_prompt, prompt=prompt, sep=sep, _force=_force, **prompt_kwargs)
        if postprocess or repr:
            response = self.postprocess_output(response)
        if repr:
            response = self.represent_output(response)
        return response
    
    async def generate_async(
        self,
        user_prompt=None,
        prompt=None,
        sep="",
        _force=False,
        postprocess=False,
        repr=False,
        verbose=False,
        **prompt_kwargs,
    ):
        prompt = self.prompt(
            user_prompt=user_prompt,
            prompt=prompt,
            **prompt_kwargs,
        )
        async for token in prompt.generate_async(
            sep=sep,
            _force=_force,
        ):
            if verbose:
                print(token, end="", flush=True, file=sys.stderr)
            yield token
            
    
    

    def to_dict(self) -> AgentConfig:
        return {
            "agent": self.name,
            "position": self.position,
            "prompt": self._prompt.to_dict(),
        }
    
    def __hash__(self):
        return hash(serialize(self.to_dict()))

    @property
    def response(self):
        return self._prompt.generate()
    
    @property
    def response_forced(self):
        return self._prompt.generate(_force=True)
    
    @property
    def result(self):
        return self.postprocess_output(self.response)
    
    @property
    def result_forced(self):
        return self.postprocess_output(self.response_forced)
    
    @property
    def new_result(self):
        return self.postprocess_output(self.generate(_force=True))

    @property
    def result_d(self):
        res = self.result
        return {
            k: v
            for k, v in {
                "agent": self.name,
                "position": self.position,
                **self._prompt.to_dict(),
                **({"response": res} if not isinstance(res, dict) else res),
            }.items()
            if (v or isinstance(v, (int, float, bool))) and k not in self.bad_cols
        }

    @property
    def results(self):
        l = []
        for prompt in self.prompts:
            run=0
            for response in prompt.responses:
                result_d = get_response_d(self.postprocess_output(response))
                run+=1
                d = {
                    "agent": self.name,
                    "position": self.position,
                    "run": run,
                    **prompt.to_dict(),
                    **result_d,
                }
                l.append({k: v for k, v in d.items() if k not in self.bad_cols and (isinstance(v,(int,float,bool)) or v)})
        return l

    @property
    def results_df(self):
        odf = pd.DataFrame(self.results)
        return odf.set_index(
            [x for x in self.index_by if x in odf.columns]
        ).sort_index()

    @property
    def response_repr(self):
        return self._prompt.generate(postprocess=True, repr=True)

    def represent_output(self, postprocessed_output: dict):
        return json.dumps(postprocessed_output, indent=4)

    def new(self, name: str = None, position: int = 0, **prompt_kwargs):
        prompt = self._prompt.new(**prompt_kwargs)
        inpd = {
            "name": name or self.name,
            "position": position or self.position,
            "prompt": prompt.to_dict(),
        }
        new = self.__class__.from_dict(inpd)
        return self if new == self else new

    def __eq__(self, other):
        return self.to_dict() == other.to_dict()

    @property
    def responses(self):
        return [
            {
                "agent": self.name,
                "position": self.position,
                "prompt": prompt.to_dict(),
                "response": self.postprocess_output(response),
            }
            for prompt in self.prompts
            for response in prompt.responses
        ]

    @property
    def responses_ld(self, without={"verbose"}):
        ld = []
        for data in self.responses:
            d2 = {
                "agent": self.name,
                "position": self.position,
            }
            d2.update(data.get("prompt", {}))

            response = data.get("response")
            if isinstance(response, dict):
                d2.update(response)
            else:
                d2["response"] = response
            for k in without:
                d2.pop(k, None)
            ld.append(d2)
        return ld

    @property
    def responses_df(self):
        return pd.DataFrame(self.responses_ld)

    @property
    def responses_df(self):
        odf = pd.DataFrame(self.responses_ld)
        iby = [x for x in self.index_by if x in odf.columns]
        return odf.set_index(iby).sort_index()

    @classmethod
    def from_dict(cls, data: AgentConfig) -> "AgentModel":
        data["name"] = data.pop("agent", data.get("name"))
        if 'prompt' in data:
            data["prompt"] = Prompt.from_dict(data["prompt"])
        return cls(**data)

    def __reduce__(self):
        return (self.__class__.from_dict, (self.to_dict(),))

    def preprocess_messages(self, messages: MessageList) -> MessageList:
        return messages

    def postprocess_output(self, output: str, user_prompt: Union[str, MessageList] = None, **kwargs):
        if self.output_format:
            output_func = globals().get(f'dirty_json_loads_{self.output_format}')
            if output_func:
                return output_func(output)
        return output

    def assemble_ld(self):
        self_d = self.to_dict()
        ld = []
        for (args, kwargs), result_d in self.stash.items_l(with_metadata=True):
            d = {
                **self_d,
                **({"user_prompt": args[1]} if len(args) > 1 else {}),
                **kwargs,
                **result_d,
            }
            formatted_value = self.format_output(d.pop("_value"))
            postproc_value = self.postprocess_output(formatted_value)
            if isinstance(postproc_value, dict):
                d.update(postproc_value)
            else:
                d["_value"] = postproc_value
            ld.append({k: v for k, v in d.items() if v is not None})
        return ld

    def assemble_df(self):
        import pandas as pd

        ld = self.assemble_ld()
        df = pd.DataFrame(ld)
        _indices = [i for i, x in enumerate(df.columns) if x[0] == "_"]
        if _indices:
            index_by = list(df.columns)[: _indices[-1] + 1]
            df = df.set_index(index_by).sort_index()
        return df

    @property
    def ld(self):
        return self.assemble_ld()

    @property
    def df(self):
        return self.assemble_df()


class AlgorithmicAgent(AgentModel):
    def __init__(
        self,
        name: str = None,
        algorithm_func: Callable[[MessageList], str] = None,
        stash: "BaseHashStash" = None,
        **kwargs,
    ):
        self.name = name if name else self.__class__.__name__
        self.algorithm_func = algorithm_func
        self.position = kwargs.get("position", 1)
        self.stash = (stash or self.stash or STASH).sub(self.name)
    def to_dict(self) -> AgentConfig:
        return {
            "agent": self.name,
            "position": self.position,
            "algorithm_func": stuff(self.algorithm_func),
        }
    
    @classmethod
    def from_dict(cls, data: AgentConfig) -> "AlgorithmicAgent":
        data["algorithm_func"] = unstuff(data["algorithm_func"])
        return cls(**data)

    def preprocess_messages(self, messages: MessageList) -> MessageList:
        return messages

    def run(self, messages: MessageList):
        if hasattr(self, "algorithm_func") and self.algorithm_func:
            return self.algorithm_func(messages)
        
    def _generate(self, user_prompt: Union[str, MessageList], _force=False, **kwargs):
        txt = user_prompt.get_last_message_txt() if isinstance(user_prompt, MessageList) else user_prompt
        if not _force and user_prompt in self.stash:
            return self.stash.get(user_prompt)
        
        res = self.run(txt)
        self.stash.set(user_prompt, res)
        return res
        
        

    async def generate_async(
        self,
        user_prompt: Union[str, MessageList],
        system_prompt: str = "",
        verbose: bool = DEFAULT_AGENT_VERBOSE,
        _force: bool = False,
        **prompt_kwargs,
    ) -> AsyncGenerator[str, None]:
        messages = BaseLLM.format_messages(user_prompt, system_prompt)
        messages = self.preprocess_messages(messages)

        result = self.run(messages)

        for token in result:
            if verbose:
                print(token, end="", flush=True, file=sys.stderr)
            yield token

    async def _run_algorithm(self, messages: MessageList) -> str:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self.algorithm_func, messages)
        return result


def Agent(name: str, **kwargs) -> AgentModel:
    if isinstance(name, AgentModel):
        return name
    if kwargs.get("algorithm_func"):
        return AlgorithmicAgent(name=name, **kwargs)
    if name in get_agents_json():
        kwargs = {k: v for k, v in get_agents_json()[name].items() if k != "name"}

    return AgentModel(name=name, **kwargs)


@cache
def get_agents_json() -> List[Dict[str, Any]]:
    o = {}
    with open(PATH_AGENTS_JSON) as f:
        for d in json.load(f):
            o[d["name"]] = d
    return o


def parse_agents_list(
    agents: List[
        Union[
            str,
            Dict[str, Any],
            AgentModel,
            List[Union[str, Dict[str, Any], AgentModel]],
        ]
    ]
) -> List[AgentModel]:
    out = []
    for i, agent in enumerate(agents):
        if isinstance(agent, list):
            for j, agent2 in enumerate(agent):
                if isinstance(agent2, AgentModel):
                    # if agent2.position == 1:
                    agent2.position = i + 1
                    out.append(agent2)
                else:
                    if isinstance(agent2, str):
                        agent2 = {"name": agent2}
                    if "position" not in agent2:
                        agent2["position"] = i + 1
                    out.append(Agent(**agent2))
        else:
            if isinstance(agent, AgentModel):
                # if agent.position == 1:
                agent = deepcopy(agent)
                agent.position = i + 1
                out.append(agent)
            else:
                if isinstance(agent, str):
                    agent = {"name": agent}
                if "position" not in agent:
                    agent["position"] = i + 1
                out.append(Agent(**agent))
    return out
