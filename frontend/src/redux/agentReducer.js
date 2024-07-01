import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MODEL } from "../constants";

const SYSTEM_PROMPT_ANALYST = "With reference to any provided code, analyze the user's query, outline the problem described, and suggest efficient and elegant solutions. Do NOT return the full contents of files; return only lines and functions changed.";

const SYSTEM_PROMPT_IMPLEMENTER = "With reference to any provided code, implement the suggestions by the previous AI, returning:\n\n* For files minimally changed, return the +/- diff syntax\n* For files substantially changed, return the full revised contents, incorporating the AI output and the original repository contents.";

const initialAgents = [
  {
    id: uuidv4(),
    name: "Analyst",
    type: "ai",
    model: DEFAULT_MODEL,
    systemPrompt: SYSTEM_PROMPT_ANALYST,
    output: "",
    sourceType: "user",
    temperature: 0.7,
    position: 1
  },
  {
    id: uuidv4(),
    name: "Implementer",
    type: "ai",
    model: 'gpt-3.5-turbo',
    systemPrompt: SYSTEM_PROMPT_IMPLEMENTER,
    output: "",
    sourceType: "left",
    temperature: 0.5,
    position: 2
  }
];

const initialSavedConfigurations = {
  "Analyst": {
    name: "Analyst",
    model: DEFAULT_MODEL,
    systemPrompt: SYSTEM_PROMPT_ANALYST,
    sourceType: "user",
    temperature: 0.7
  },
  "Implementer": {
    name: "Implementer",
    model: 'gpt-3.5-turbo',
    systemPrompt: SYSTEM_PROMPT_IMPLEMENTER,
    sourceType: "left",
    temperature: 0.5
  }
};

const initialState = {
  agents: initialAgents,
  savedAgentConfigurations: initialSavedConfigurations
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
      
  // Add these new cases in the reducer
  case 'MOVE_AGENT_LEFT':
    return {
      ...state,
      agents: state.agents.map(agent => {
        if (agent.id === action.payload && agent.position > 1) {
          return { ...agent, position: agent.position - 1 };
        }
        if (agent.position === agent.position - 1) {
          return { ...agent, position: agent.position + 1 };
        }
        return agent;
      }).sort((a, b) => a.position - b.position)
    };
  case 'MOVE_AGENT_RIGHT':
    const maxPosition = Math.max(...state.agents.map(a => a.position));
    return {
      ...state,
      agents: state.agents.map(agent => {
        if (agent.id === action.payload && agent.position < maxPosition) {
          return { ...agent, position: agent.position + 1 };
        }
        if (agent.position === agent.position + 1) {
          return { ...agent, position: agent.position - 1 };
        }
        return agent;
      }).sort((a, b) => a.position - b.position)
    };
  
  case 'ADD_AGENT':
    const currentAgents = state.agents;
    const clickedAgentPosition = action.payload.position;
    const newPosition = clickedAgentPosition + 1;
    
    return {
      ...state,
      agents: [
        ...currentAgents.map(agent => 
          agent.position >= newPosition
            ? { ...agent, position: agent.position + 1 }
            : agent
        ),
        { ...action.payload, position: newPosition, id: uuidv4() }
      ].sort((a, b) => a.position - b.position)
    };  
  
  case 'REMOVE_AGENT':
    return { ...state, agents: state.agents.filter(agent => agent.id !== action.payload) };
  case 'CLEAR_AGENT_CACHE':
    return {
      ...initialState,
      savedAgentConfigurations: {
        ...initialSavedConfigurations,
        ...state.savedAgentConfigurations
      }
    };
  case 'SAVE_AGENT_CONFIGURATION':
    return {
      ...state,
      savedAgentConfigurations: {
        ...state.savedAgentConfigurations,
        [action.payload.name]: action.payload.configuration
      }
    };
  case 'LOAD_AGENT_CONFIGURATION':
    const agentConfigToLoad = state.savedAgentConfigurations[action.payload.name];
    if (agentConfigToLoad) {
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.agentId ? { ...agent, ...agentConfigToLoad } : agent
        )
      };
    }
    return state;
  default:
    return state;
  }
};

export default agentReducer;