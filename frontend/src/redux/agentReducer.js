import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MODEL } from "../constants";


const initialState = {
  agents: [
    {
      id: uuidv4(),
      name: "Analyst",
      type: "ai",
      model: DEFAULT_MODEL,
      systemPrompt: "With reference to any provided code, analyze the user's query and outline the problem described.",
      output: "",
      sourceType: "user" // Add default sourceType
    },
    {
      id: uuidv4(),
      name: "Engineer",
      type: "ai",
      model: DEFAULT_MODEL,
      systemPrompt: "With reference to any provided code, implement the user's query.",
      output: "",
      sourceType: "left" // Add default sourceType
    }
  ],
};

const agentReducer = (state = initialState, action) => {
  switch(action.type) {
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id ? { ...agent, ...action.payload.updates } : agent
        )
      };
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'ADD_AGENT':
      return { ...state, agents: [...state.agents, action.payload] };
    case 'REMOVE_AGENT':
      return { ...state, agents: state.agents.filter(agent => agent.id !== action.payload) };
    case 'CLEAR_AGENT_CACHE':
      return initialState;
    default:
      return state;
  }
};

export default agentReducer;
