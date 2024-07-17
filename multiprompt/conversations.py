from .imports import *
from .agents import *
from .llms import *
from .utils import *

conversations = {}


class ConversationRound:
    def __init__(
        self,
        conversation: "Conversation",
        *prompt_args,
        **prompt_kwargs,
    ):
        self.agents = conversation.agents
        self.conversation = conversation
        self.conversation_id = conversation.id
        self.agents = conversation.agents
        self.responses: Dict[str, str] = defaultdict(str)
        self.prompt_args = prompt_args
        self.prompt_kwargs = prompt_kwargs

    @property
    def i(self):
        return self.conversation.rounds.index(self)

    @property
    def num(self):
        return self.i + 1

    @property
    def previous(self):
        return self.conversation.rounds[: self.i]

    @property
    def agents_in_position(self):
        posd = defaultdict(list)
        for agent in self.agents:
            posd[agent.position].append(agent)
        return [agents for pos, agents in sorted(posd.items())]

    @property
    def prompt(self):
        messages = BaseLLM.format_prompt(*self.prompt_args, **self.prompt_kwargs)
        return messages

    @property
    def userprompt_content(self):
        for msg in self.prompt:
            if msg.get('role')=='user':
                return msg.get('content',[])
        return []
            
    @property
    def userprompt_text_content(self):
        for msg in self.prompt:
            if msg.get('role')=='user':
                return [
                    d.get('text')
                    for d in msg.get('content',[])
                    if d.get('text')
                ]
        return []
    
    @property
    def prompt_str(self):
        content = self.userprompt_content
        content = [d.get('text','') for d in content if d.get('text')]
        return content[0] if content else None

    @property
    def messages(self):
        l = [msg for round in self.previous for msg in round.messages]
        l.extend(self.prompt)
        responses=[]
        for agent in sorted(self.responses, key=lambda a: a.position):
            content = make_ascii_section(
                f"Response to User by \"{agent.name}\" AI",
                self.responses[agent],
                2,
            )
            responses.append(content)
        if responses:
            # l.append({"role": "assistant", "content": '\n\n\n\n'.join(responses).strip()})
            l.append({"role": "user", "content": BaseLLM.process_content(responses)})
            # usr_msgs = [d for d in l if d['role']=='user']
            # if usr_msgs:
            #     last_usr_msg = usr_msgs[-1]
            #     last_usr_msg['content'].extend(
            #         BaseLLM.process_content(responses)
            #     )
            
                # logger.info(pformat(last_usr_msg))
        return l

    async def run_async(self):
        # yield dict(
        #     round=self.num,
        #     position=0,
        #     agent='User',
        #     token_num=0,
        #     token=self.prompt_str,
        #     conversation=self.conversation_id,
        # )
        token_num=0
        for cstr in self.userprompt_text_content:
            token_num+=1
            yield dict(
                round=self.num,
                position=0,
                agent='User',
                token_num=token_num,
                token=cstr,
                conversation=self.conversation_id,
            )

        for agents in self.agents_in_position:
            prompt_now = self.messages
            agent_tasks = [self.run_agent_async(agent, prompt_now) for agent in agents]

            async def merge_generators(generators):
                while generators:
                    for gen in generators.copy():
                        try:
                            yield await gen.__anext__()
                        except StopAsyncIteration:
                            generators.remove(gen)

            async for token_data in merge_generators(agent_tasks):
                yield token_data

            # prompt_content = "\n\n\n".join(
            #     make_ascii_section(
            #         f"Response from {agent.name}", self.responses[agent], 2
            #     )
            #     for agent in agents
            # ).strip()
            # prompt_now[0]["content"] += "\n\n\n" + prompt_content
            # logger.info(prompt_now)

    async def run_agent_async(self, agent, prompt_now):
        llm = LLM(agent.model)
        self.responses[agent] = ""
        token_num = 0
        async for token in llm.generate_async(
            prompt_now, temperature=agent.temperature
        ):
            self.responses[agent] += token
            token_num += 1
            yield dict(
                round=self.num,
                position=agent.position,
                agent=agent.name,
                token_num=token_num,
                token=token,
                conversation=self.conversation_id,
            )

    def run_iter(self):
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're likely in an IPython/Jupyter environment
            return self._run_in_notebook()
        else:
            # We're in a regular Python environment
            return loop.run_until_complete(self._run_sync())

    @cache
    def run(self, return_df=True, by_token=False):
        l = list(self.run_iter())
        if not return_df:
            return l
        odf = pd.DataFrame(l)
        if by_token:
            odf = odf.set_index(["conversation", "round", "position", "agent", "token_num"])
        else:
            odf = detokenize_convo_df(odf)
        return odf.sort_index()

    def _run_in_notebook(self):
        async def async_generator():
            async for item in self.run_async():
                yield item

        import nest_asyncio

        nest_asyncio.apply()

        for item in asyncio.get_event_loop().run_until_complete(
            self._collect(async_generator())
        ):
            yield item

    async def _run_sync(self):
        async for item in self.run_async():
            yield item

    @staticmethod
    async def _collect(async_generator):
        result = []
        async for item in async_generator:
            result.append(item)
        return result


class ConversationModel:
    def __init__(self, id=None, agents=None):
        self.id = id or str(uuid.uuid4())
        self.rounds = []
        self.agents = parse_agents_list(agents)

    def add_round(self, *prompt_args, **prompt_kwargs):
        round = ConversationRound(self, *prompt_args, **prompt_kwargs)
        self.rounds.append(round)
        return round

    def run(self, return_df=True, by_token=False):
        if not return_df:
            return [
                res for round in self.rounds for res in round.run(return_df=return_df, by_token=by_token)
            ]
        else:
            o = [round.run(return_df=return_df, by_token=by_token) for round in self.rounds]
            return pd.concat(o) if len(o) else pd.DataFrame()
    
    # @property
    # def messages(self):
    #     return self.rounds[-1].messages if self.rounds else []


def Conversation(id=None, agents=None):
    if id in conversations:
        return conversations[id]
    else:
        convo = ConversationModel(id=id, agents=agents)
        conversations[convo.id] = convo
        return convo


def parse_agents_list(agents):
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


def detokenize_convo_df(df):
    gby=['conversation','round','position','agent']
    o=[]
    for g,gdf in sorted(df.groupby(gby)):
        d=dict(zip(gby,g))
        sep=('' if g['agent']!='User' else '\n\n\n')
        d['text']=sep.join(gdf.token).strip()
        o.append(d)
    return pd.DataFrame(o).set_index(gby).sort_index()