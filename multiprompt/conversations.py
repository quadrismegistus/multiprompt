from .imports import *
from .agents import *
from .llms import *
from .utils import *

conversations: Dict[str, "Conversation"] = {}


class ConversationRound:
    def __init__(self, agents: List[Dict], conversation_id=None):
        self.agents = []
        self.conversation_id = conversation_id
        for i, agent in enumerate(agents):
            if type(agent) is list:
                for agent2 in agent:
                    if type(agent2) is str:
                        agent2 = {"name": agent2}
                    if not "position" in agent2:
                        agent2["position"] = i + 1

                    self.agents.append(Agent(**agent2))
            else:
                if type(agent) is str:
                    agent = {"name": agent}
                if not "position" in agent:
                    agent["position"] = i + 1

                self.agents.append(Agent(**agent))
        self.responses: Dict[str, str] = defaultdict(str)

    @property
    def agents_in_position(self):
        posd = defaultdict(list)
        for agent in self.agents:
            posd[agent.position].append(agent)
        return [agents for pos, agents in sorted(posd.items())]

    async def run_agent(self, agent, prompt_now):
        llm = LLM(agent.model)
        streamer = llm.stream(
            prompt_now,
            temperature=agent.temperature,
        )
        response = ""
        async for token in streamer:
            yield dict(
                agent=agent.name,
                position=agent.position,
                token=token,
                conversation=self.conversation_id
            )
            response += token
        return agent.name, response

    async def run_async(self, *prompt_args, **prompt_kwargs):
        prompt_now = BaseLLM.format_prompt(*prompt_args, **prompt_kwargs)
        for agents in self.agents_in_position:
            # Run agents in the same position concurrently
            tasks = [self.run_agent(agent, prompt_now) for agent in agents]
            results = await asyncio.gather(*[asyncio.create_task(self.stream_results(task)) for task in tasks])
            
            # Process results
            for agent_name, response in results:
                self.responses[agent_name] += response
                prompt_now.append({'role': 'assistant', 'content': response})

    async def stream_results(self, coro):
        async for result in coro:
            if isinstance(result, dict):  # This is a token yield
                yield result
            else:  # This is the final (agent_name, response) tuple
                return result
    
    def run(self, *prompt_args, **prompt_kwargs):
        yield from iter_async_generator(
            self.run_async,
            *prompt_args,
            **prompt_kwargs
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agents": [agent.to_dict() for agent in self.agents],
            "responses": self.responses,
            **self.prompt_kwargs,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationRound":
        round = cls(
            user_prompt=data["user_prompt"],
            reference_prompt=data["reference_prompt"],
            agents=[Agent.from_dict(agent_data) for agent_data in data["agents"]],
        )
        round.agent_responses = data["agent_responses"]
        return round


class ConversationModel:
    def __init__(self, agents=None):
        self.id = str(uuid.uuid4())
        self.rounds: List[ConversationRound] = []
        self.agents = agents

    def add_round(self, agents=None):
        round = ConversationRound(agents if agents else self.agents)
        self.rounds.append(round)
        return round

    def to_dict(self) -> Dict[str, Any]:
        return {"id": self.id, "rounds": [round.to_dict() for round in self.rounds]}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Conversation":
        conversation = cls(id=data["id"])
        conversation.rounds = [
            ConversationRound.from_dict(round_data) for round_data in data["rounds"]
        ]
        return conversation


def Conversation(id=None, agents=None):
    if id in conversations:
        return conversations[id]
    else:
        convo = Conversation(agents=agents)
        conversations[convo.id] = convo
        return convo