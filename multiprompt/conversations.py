from .imports import *
from .agents import *
from .llms import *
from .utils import *
from queue import Queue
from threading import Thread

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

    def run_agent(self, agent, prompt_now, q):
        llm = LLM(agent.model)
        for token in llm.generate(prompt_now, temperature=agent.temperature):
            result = dict(
                agent=agent.name,
                position=agent.position,
                token=token,
                conversation=self.conversation_id,
            )
            q.put(result)
        q.put(None)  # Signal the end of this agent's output

    def run(self, *prompt_args, **prompt_kwargs):
        prompt_now = BaseLLM.format_prompt(*prompt_args, **prompt_kwargs)
        for agents in self.agents_in_position:
            q = Queue()
            threads = []
            for agent in agents:
                thread = Thread(target=self.run_agent, args=(agent, prompt_now, q))
                thread.start()
                threads.append(thread)

            active_agents = len(agents)
            while active_agents > 0:
                result = q.get()
                if result is None:
                    active_agents -= 1
                else:
                    self.responses[result['agent']] += result['token']
                    yield result
            
            # Ensure all threads have finished before proceeding
            for thread in threads:
                thread.join()

            prompt_now.append({"role": "assistant", "content": "\n".join(self.responses[agent.name] for agent in agents)})

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



# from .imports import *
# from .agents import *
# from .llms import *
# from .utils import *

# conversations: Dict[str, "ConversationModel"] = {}

# class ConversationRound:
#     def __init__(self, agents: List[Dict], conversation_id=None):
#         self.agents = []
#         self.conversation_id = conversation_id
#         for i, agent in enumerate(agents):
#             if isinstance(agent, dict):
#                 if "position" not in agent:
#                     agent["position"] = i + 1
#                 self.agents.append(Agent(**agent))
#             elif isinstance(agent, str):
#                 self.agents.append(Agent(name=agent, position=i + 1))
#             else:
#                 raise ValueError(f"Invalid agent data: {agent}")
#         self.responses: Dict[str, str] = defaultdict(str)

#     @property
#     def agents_in_position(self):
#         posd = defaultdict(list)
#         for agent in self.agents:
#             posd[agent.position].append(agent)
#         return [agents for pos, agents in sorted(posd.items())]

#     def run_agent(self, agent, prompt_now):
#         llm = LLM(agent.model)
#         for token in llm.generate(prompt_now, temperature=agent.temperature):
#             yield dict(
#                 agent=agent.name,
#                 position=agent.position,
#                 token=token,
#                 conversation=self.conversation_id,
#             )

#     def run(self, *prompt_args, **prompt_kwargs):
#         prompt_now = BaseLLM.format_prompt(*prompt_args, **prompt_kwargs)
#         for agents in self.agents_in_position:
#             for agent in agents:
#                 for result in self.run_agent(agent, prompt_now):
#                     self.responses[agent.name] += result["token"]
#                     yield result
#                 prompt_now.append({"role": "assistant", "content": self.responses[agent.name]})


# class ConversationModel:
#     def __init__(self, id=None, agents=None):
#         self.id = id or str(uuid.uuid4())
#         self.rounds: List[ConversationRound] = []
#         self.agents = agents

#     def add_round(self, agents=None):
#         round = ConversationRound(
#             agents if agents else self.agents, conversation_id=self.id
#         )
#         self.rounds.append(round)
#         return round

# def Conversation(id=None, agents=None):
#     if id in conversations:
#         return conversations[id]
#     else:
#         convo = ConversationModel(id=id, agents=agents)
#         conversations[convo.id] = convo
#         return convo

# from .imports import *
# from .agents import *
# from .llms import *
# from .utils import *

# conversations: Dict[str, "ConversationModel"] = {}

# class ConversationRound:
#     def __init__(self, agents: List[Dict], conversation_id=None):
#         self.agents = []
#         self.conversation_id = conversation_id
#         for i, agent in enumerate(agents):
#             if isinstance(agent, list):
#                 for agent2 in agent:
#                     if isinstance(agent2, str):
#                         agent2 = {"name": agent2}
#                     if "position" not in agent2:
#                         agent2["position"] = i + 1
#                     self.agents.append(Agent(**agent2))
#             else:
#                 if isinstance(agent, str):
#                     agent = {"name": agent}
#                 if "position" not in agent:
#                     agent["position"] = i + 1
#                 self.agents.append(Agent(**agent))
#         self.responses: Dict[str, str] = defaultdict(str)

#     @property
#     def agents_in_position(self):
#         posd = defaultdict(list)
#         for agent in self.agents:
#             posd[agent.position].append(agent)
#         return [agents for pos, agents in sorted(posd.items())]

#     async def run_agent(self, agent, prompt_now):
#         llm = LLM(agent.model)
#         streamer = llm.stream(
#             prompt_now,
#             temperature=agent.temperature,
#         )
#         response = ""
#         async for token in streamer:
#             yield dict(
#                 agent=agent.name,
#                 position=agent.position,
#                 token=token,
#                 conversation=self.conversation_id
#             )
#             response += token
#         yield dict(
#             agent=agent.name,
#             position=agent.position,
#             token=None,
#             conversation=self.conversation_id,
#             final_response=response
#         )

#     async def run_async(self, *prompt_args, **prompt_kwargs):
#         prompt_now = BaseLLM.format_prompt(*prompt_args, **prompt_kwargs)
#         for agents in self.agents_in_position:
#             tasks = [self.run_agent(agent, prompt_now) for agent in agents]
#             async def process_task(task):
#                 final_response = None
#                 async for result in task:
#                     if result['token'] is not None:
#                         yield result
#                     else:
#                         final_response = result
#                 if final_response:
#                     yield final_response
#             results = await asyncio.gather(*[process_task(task) for task in tasks])
#             for result in results:
#                 async for item in result:
#                     if item['token'] is None:
#                         agent_name, response = item['agent'], item['final_response']
#                         self.responses[agent_name] += response
#                         prompt_now.append({'role': 'assistant', 'content': response})
#                     else:
#                         yield item

#     def run(self, *prompt_args, **prompt_kwargs):
#         return iter_async_generator(
#             self.run_async,
#             *prompt_args,
#             **prompt_kwargs
#         )


#     def to_dict(self) -> Dict[str, Any]:
#         return {
#             "agents": [agent.to_dict() for agent in self.agents],
#             "responses": dict(self.responses),
#             "conversation_id": self.conversation_id
#         }

#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]) -> "ConversationRound":
#         round = cls(
#             agents=[Agent.from_dict(agent_data) for agent_data in data["agents"]],
#             conversation_id=data["conversation_id"]
#         )
#         round.responses = defaultdict(str, data["responses"])
#         return round

# class ConversationModel:
#     def __init__(self, id=None, agents=None):
#         self.id = id or str(uuid.uuid4())
#         self.rounds: List[ConversationRound] = []
#         self.agents = agents

#     def add_round(self, agents=None):
#         round = ConversationRound(agents if agents else self.agents, conversation_id=self.id)
#         self.rounds.append(round)
#         return round

#     def to_dict(self) -> Dict[str, Any]:
#         return {
#             "id": self.id,
#             "rounds": [round.to_dict() for round in self.rounds],
#             "agents": [agent.to_dict() for agent in self.agents] if self.agents else None
#         }

#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]) -> "ConversationModel":
#         conversation = cls(id=data["id"], agents=[Agent.from_dict(agent) for agent in data["agents"]] if data.get("agents") else None)
#         conversation.rounds = [ConversationRound.from_dict(round_data) for round_data in data["rounds"]]
#         return conversation

# def Conversation(id=None, agents=None):
#     if id in conversations:
#         return conversations[id]
#     else:
#         convo = ConversationModel(id=id, agents=agents)
#         conversations[convo.id] = convo
#         return convo
