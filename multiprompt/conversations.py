from .imports import *
from .agents import *
from .llms import *
from .utils import *
from .messages import Message, MessageList

conversations: Dict[str, 'ConversationModel'] = {}

class ConversationRound:
    def __init__(
        self,
        conversation: 'ConversationModel',
        user_prompt: str = DEFAULT_USER_PROMPT,
    ):
        self.conversation = conversation
        self.conversation_id = conversation.id
        self.agents = conversation.agents
        self.responses: Dict[Agent, str] = defaultdict(str)
        self.user_prompt = user_prompt

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

    # # @property
    # # def prompt(self) -> Message:
    # #     return Message(role='user', content=self.user_prompt)

    

    @property
    def messages(self) -> MessageList:
        messages = MessageList([msg for round in self.previous for msg in round.messages])
        if self.user_prompt: 
            messages.add_user_message(self.user_prompt)
        
        # responses?
        # responses = []
        # for agent,response in sorted(self.responses.items(), key=lambda ar: ar[0].position):
        #     responses.append(response)
        # if responses:
        #     messages.add_user_message("\n\n\n\n".join(responses))
        for agent,response in sorted(self.responses.items(), key=lambda ar: ar[0].position):
            messages.add_agent_message(agent, response)

        return messages

    async def run_async(self) -> AsyncGenerator[Dict[str, Any], None]:
        token_num = 0
        for user_msg in self.messages.get_user_messages():
            token_num += 1
            yield dict(
                round=self.num,
                position=0,
                agent='User',
                token_num=token_num,
                token=user_msg.text,
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

    async def run_agent_async(self, agent: Agent, prompt_now: MessageList) -> AsyncGenerator[Dict[str, Any], None]:
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

    def add_round(self, user_prompt = DEFAULT_USER_PROMPT) -> ConversationRound:
        round = ConversationRound(user_prompt=user_prompt, conversation=self)
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