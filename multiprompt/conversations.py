from .imports import *
from .agents import *
from .llms import *
from .utils import *
from .types import Message, AgentConfig

conversations: Dict[str, 'ConversationModel'] = {}

class ConversationRound:
    def __init__(
        self,
        conversation: 'ConversationModel',
        *prompt_args,
        **prompt_kwargs,
    ):
        self.conversation = conversation
        self.conversation_id = conversation.id
        self.agents = conversation.agents
        self.responses: Dict[Agent, str] = defaultdict(str)
        self.prompt_args = prompt_args
        self.prompt_kwargs = prompt_kwargs

    @property
    def i(self) -> int:
        return self.conversation.rounds.index(self)

    @property
    def num(self) -> int:
        return self.i + 1

    @property
    def previous(self) -> List['ConversationRound']:
        return self.conversation.rounds[: self.i]

    @property
    def agents_in_position(self) -> List[List[Agent]]:
        posd = defaultdict(list)
        for agent in self.agents:
            posd[agent.position].append(agent)
        return [agents for pos, agents in sorted(posd.items())]

    @property
    def prompt(self) -> List[Message]:
        return BaseLLM.format_messages(*self.prompt_args, **self.prompt_kwargs)

    @property
    def userprompt_content(self) -> List[dict]:
        for msg in self.prompt:
            if msg.get('role') == 'user':
                return msg.get('content', [])
        return []

    @property
    def userprompt_text_content(self) -> List[str]:
        return [
            d.get('text')
            for d in self.userprompt_content
            if d.get('text')
        ]

    @property
    def prompt_str(self) -> Optional[str]:
        content = self.userprompt_text_content
        return content[0] if content else None

    @property
    def messages(self) -> List[Message]:
        messages = [msg for round in self.previous for msg in round.messages]
        messages.extend(self.prompt)
        responses = []
        for agent in sorted(self.responses, key=lambda a: a.position):
            content = make_ascii_section(
                f'Response to User by "{agent.name}" AI',
                self.responses[agent],
                2,
            )
            responses.append(content)
        if responses:
            messages.append({"role": "user", "content": BaseLLM.process_content(responses)})
        return messages

    async def run_async(self) -> AsyncGenerator[Dict[str, Any], None]:
        token_num = 0
        for cstr in self.userprompt_text_content:
            token_num += 1
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

    async def run_agent_async(self, agent: Agent, prompt_now: List[Message]) -> AsyncGenerator[Dict[str, Any], None]:
        self.responses[agent] = ""
        token_num = 0
        async for token in agent.generate_async(prompt_now):
            token_num += 1
            self.responses[agent] += token
            yield dict(
                round=self.num,
                position=agent.position,
                agent=agent.name,
                token_num=token_num,
                token=token,
                conversation=self.conversation_id,
            )

    def run_iter(self) -> Iterator[Dict[str, Any]]:
        return run_async(self.run_async)

    @cache
    def run(self, return_df: bool = True, by_token: bool = False) -> Union[List[Dict[str, Any]], pd.DataFrame]:
        l = list(self.run_iter())
        if not return_df:
            return l
        odf = pd.DataFrame(l)
        if by_token:
            odf = odf.set_index(["conversation", "round", "position", "agent", "token_num"])
        else:
            odf = detokenize_convo_df(odf)
        return odf.sort_index()

class ConversationModel:
    def __init__(self, id: Optional[str] = None, agents: Optional[List[Union[str, Dict[str, Any], List[Union[str, Dict[str, Any]]]]]] = None):
        self.id = id or str(uuid.uuid4())
        self.rounds: List[ConversationRound] = []
        self.agents = parse_agents_list(agents or [])

    def add_round(self, *prompt_args, **prompt_kwargs) -> ConversationRound:
        round = ConversationRound(self, *prompt_args, **prompt_kwargs)
        self.rounds.append(round)
        return round

    def run(self, return_df: bool = True, by_token: bool = False) -> Union[List[Dict[str, Any]], pd.DataFrame]:
        if not return_df:
            return [
                res for round in self.rounds for res in round.run(return_df=return_df, by_token=by_token)
            ]
        else:
            o = [round.run(return_df=return_df, by_token=by_token) for round in self.rounds]
            return pd.concat(o) if len(o) else pd.DataFrame()

def Conversation(id: Optional[str] = None, agents: Optional[List[Union[str, Dict[str, Any], List[Union[str, Dict[str, Any]]]]]] = None) -> ConversationModel:
    if id in conversations:
        return conversations[id]
    else:
        convo = ConversationModel(id=id, agents=agents)
        conversations[convo.id] = convo
        return convo

def detokenize_convo_df(df: pd.DataFrame) -> pd.DataFrame:
    gby = ['conversation', 'round', 'position', 'agent']
    o = []
    for g, gdf in sorted(df.groupby(gby)):
        d = dict(zip(gby, g))
        sep = ('' if d['agent'] != 'User' else '\n\n\n')
        d['text'] = sep.join(gdf.token).strip()
        o.append(d)
    return pd.DataFrame(o).set_index(gby).sort_index()