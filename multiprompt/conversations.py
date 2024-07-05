from .imports import *

class ConversationRound:
    def __init__(self, user_prompt: str, reference_prompt: str, agents: List[Agent]):
        self.user_prompt = user_prompt
        self.reference_prompt = reference_prompt
        self.agents = agents
        self.agent_responses: Dict[str, str] = {}

    def add_agent_response(self, agent_id: str, response: str):
        self.agent_responses[agent_id] = response

    def get_combined_prompt(self) -> str:
        return f"{self.user_prompt}\n\nReference Code:\n{self.reference_prompt}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_prompt": self.user_prompt,
            "reference_prompt": self.reference_prompt,
            "agents": [agent.to_dict() for agent in self.agents],
            "agent_responses": self.agent_responses
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationRound':
        round = cls(
            user_prompt=data['user_prompt'],
            reference_prompt=data['reference_prompt'],
            agents=[Agent.from_dict(agent_data) for agent_data in data['agents']]
        )
        round.agent_responses = data['agent_responses']
        return round

class Conversation:
    def __init__(self, id: str = None):
        self.id = id or str(uuid.uuid4())
        self.rounds: List[ConversationRound] = []

    def add_round(self, round: ConversationRound):
        self.rounds.append(round)

    def get_latest_round(self) -> ConversationRound:
        if not self.rounds:
            raise ValueError("No rounds in the conversation")
        return self.rounds[-1]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "rounds": [round.to_dict() for round in self.rounds]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Conversation':
        conversation = cls(id=data['id'])
        conversation.rounds = [ConversationRound.from_dict(round_data) for round_data in data['rounds']]
        return conversation