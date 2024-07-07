from .imports import *
from .agents import *
from .llms import *
from .utils import *

conversations = {}

class ConversationRound:
    def __init__(self, agents: List[Dict], conversation_id=None):
        self.agents = []
        self.conversation_id = conversation_id
        for i, agent in enumerate(agents):
            if isinstance(agent, list):
                for agent2 in agent:
                    if isinstance(agent2, str):
                        agent2 = {"name": agent2}
                    if "position" not in agent2:
                        agent2["position"] = i + 1
                    self.agents.append(Agent(**agent2))
            else:
                if isinstance(agent, str):
                    agent = {"name": agent}
                if "position" not in agent:
                    agent["position"] = i + 1
                self.agents.append(Agent(**agent))
        self.responses: Dict[str, str] = defaultdict(str)

    @property
    def agents_in_position(self):
        posd = defaultdict(list)
        for agent in self.agents:
            posd[agent.position].append(agent)
        return [agents for pos, agents in sorted(posd.items())]
    
    
    async def run_async(self, *prompt_args, **prompt_kwargs):
        prompt_now = BaseLLM.format_prompt(*prompt_args, **prompt_kwargs)
        for agents in self.agents_in_position:
            agent_tasks = [self.run_agent_async(agent, prompt_now) for agent in agents]
            
            async def merge_generators(generators):
                while generators:
                    for gen in generators.copy():  # Use a copy to avoid modifying the list while iterating
                        try:
                            yield await gen.__anext__()
                        except StopAsyncIteration:
                            generators.remove(gen)

            async for token_data in merge_generators(agent_tasks):
                yield token_data

            prompt_now.append({"role": "assistant", "content": "\n".join(self.responses[agent.name] for agent in agents)})

    async def run_agent_async(self, agent, prompt_now):
        llm = LLM(agent.model)
        self.responses[agent.name] = ""
        async for token in llm.generate_async(prompt_now, temperature=agent.temperature):
            self.responses[agent.name] += token
            yield dict(
                agent=agent.name,
                position=agent.position,
                token=token,
                conversation=self.conversation_id,
            )



class ConversationModel:
    def __init__(self, id=None, agents=None):
        self.id = id or str(uuid.uuid4())
        self.rounds = []
        self.agents = agents

    def add_round(self, agents=None):
        round = ConversationRound(agents if agents else self.agents, conversation_id=self.id)
        self.rounds.append(round)
        return round

def Conversation(id=None, agents=None):
    if id in conversations:
        return conversations[id]
    else:
        convo = ConversationModel(id=id, agents=agents)
        conversations[convo.id] = convo
        return convo