import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_MODEL } from "../constants";
import _ from 'lodash';

//console.log('Loading agentReducer.js');

const SYSTEM_PROMPT_ANALYST = "With reference to any provided code, analyze the user's query, outline the problem described, and suggest efficient and elegant solutions. Do NOT return the full contents of files; return only lines and functions changed.";

const SYSTEM_PROMPT_IMPLEMENTER = "With reference to any provided code, implement the suggestions by the previous AI, returning:\n\n* For files minimally changed, return the +/- diff syntax\n* For files substantially changed, return the full revised contents, incorporating the AI output and the original repository contents.";

//console.log('System prompts defined:', { SYSTEM_PROMPT_ANALYST, SYSTEM_PROMPT_IMPLEMENTER });

const initialAgents = [
  {
    id: uuidv4(),
    name: "Analyst",
    type: "ai",
    model: DEFAULT_MODEL,
    systemPrompt: SYSTEM_PROMPT_ANALYST,
    output: "",
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
    temperature: 0.5,
    position: 2
  }
];

//console.log('Initial agents created:', initialAgents);

const initialSavedConfigurations = {
  "Analyst": {
    name: "Analyst",
    model: DEFAULT_MODEL,
    systemPrompt: SYSTEM_PROMPT_ANALYST,
    temperature: 0.7
  },
  "Implementer": {
    name: "Implementer",
    model: 'gpt-3.5-turbo',
    systemPrompt: SYSTEM_PROMPT_IMPLEMENTER,
    temperature: 0.5
  }
};

//console.log('Initial saved configurations:', initialSavedConfigurations);

const initialState = {
  agents: initialAgents,
  savedAgentConfigurations: initialSavedConfigurations
};

//console.log('Initial state created:', initialState);

// Updated helper function to normalize positions
// const normalizePositions = (agents) => {
//   //console.log('Normalizing positions for agents:', agents);
//   const normalizedAgents = agents
//     .sort((a, b) => a.position - b.position)
//     .map((agent, index) => ({ ...agent, position: index + 1 }));
//   //console.log('Normalized agents:', normalizedAgents);
//   return normalizedAgents;
// };


function normalizePositions(agents) {
  // Extract the positions from the agents and sort them
  let positions = agents.map(agent => agent.position);
  positions.sort((a, b) => a - b);

  // Create a mapping from position to dense rank
  let rankMap = new Map();
  let rank = 1;
  
  for (let i = 0; i < positions.length; i++) {
      if (!rankMap.has(positions[i])) {
          rankMap.set(positions[i], rank);
          rank++;
      }
  }

  // Update the agents with their dense ranks
  agents.forEach(agent => {
      agent.position = rankMap.get(agent.position);
  });

  return agents;
}


const moveAgentTo = (state, agentId, newPosition) => {
  if(newPosition>0) {
    const agents = [...state.agents];
    const agentIndex = agents.findIndex(agent => agent.id === agentId);
    if (agentIndex === -1) return state;
    const agent = agents[agentIndex];
    agent.position = newPosition;

    return {
      ...state,
      agents: normalizePositions(agents)
    };
  } else {
    return state;
  }
};

const moveAgent = (state, agentId, direction) => {
  //console.log(`Moving agent ${agentId} ${direction}`);
  const agents = [...state.agents];
  const agentIndex = agents.findIndex((agent) => agent.id === agentId);
  if (agentIndex === -1) {
    //console.log(`Agent ${agentId} not found, returning current state`);
    return state;
  }

  const agent = agents[agentIndex];
  //console.log('Agent to move:', agent);
  agents.splice(agentIndex, 1);  // Remove the agent from its current position
  //console.log('Agents after removal:', agents);

  if (direction === 'left') {
    if (agent.position === 1) {
      //console.log('Moving first agent to the end');
      agents.push(agent);
    } else {
      //console.log('Moving agent one position earlier');
      agents.splice(agentIndex - 1, 0, agent);
    }
  } else {  // 'right'
    if (agent.position === agents.length + 1) {
      //console.log('Moving last agent to the beginning');
      agents.unshift(agent);
    } else {
      //console.log('Moving agent one position later');
      agents.splice(agentIndex + 1, 0, agent);
    }
  }

  //console.log('Agents after movement:', agents);

  // Normalize positions after the move
  const newState = {
    ...state,
    agents: normalizePositions(agents),
  };
  //console.log('New state after move:', newState);
  return newState;
};

const agentReducer = (state = initialState, action) => {
  //console.log('agentReducer called with action:', action);
  //console.log('Current state:', state);

  switch(action.type) {
    case 'UPDATE_AGENT':
      //console.log('Updating agent:', action.payload);
      const updatedState = {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id ? { ...agent, ...action.payload.updates } : agent
        )
      };
      //console.log('State after agent update:', updatedState);
      return updatedState;

    case 'SET_AGENTS':
      //console.log('Setting agents:', action.payload);
      const newState = { ...state, agents: normalizePositions(action.payload) };
      //console.log('State after setting agents:', newState);
      return newState;

    case 'MOVE_AGENT':
      //console.log('Moving agent:', action.payload);
      return moveAgent(state, action.payload.id, action.payload.direction);

    case 'ADD_AGENT':
      //console.log('Adding agent:', action.payload);
      const clickedAgentPosition = action.payload.position;
      const newAgentPosition = clickedAgentPosition + 1;
      //console.log('New agent position:', newAgentPosition);
      const newAgent = { ...action.payload, id: uuidv4(), position: newAgentPosition };
      //console.log('New agent:', newAgent);
      const updatedAgents = [...state.agents, newAgent].map(agent => {
        if (agent.position >= newAgentPosition && agent.id !== newAgent.id) {
          //console.log(`Incrementing position for agent ${agent.id}`);
          return { ...agent, position: agent.position + 1 };
        }
        return agent;
      });
      //console.log('Updated agents before normalization:', updatedAgents);
      const stateAfterAdd = {
        ...state,
        agents: normalizePositions(updatedAgents)
      };
      //console.log('State after adding agent:', stateAfterAdd);
      return stateAfterAdd;
    
    case 'REMOVE_AGENT':
      //console.log('Removing agent:', action.payload);
      const stateAfterRemove = {
        ...state,
        agents: normalizePositions(state.agents.filter(agent => agent.id !== action.payload))
      };
      //console.log('State after removing agent:', stateAfterRemove);
      return stateAfterRemove;

    case 'CLEAR_AGENT_CACHE':
      //console.log('Clearing agent cache');
      const clearedState = {
        ...initialState,
        savedAgentConfigurations: {
          ...initialSavedConfigurations,
          ...state.savedAgentConfigurations
        }
      };
      //console.log('State after clearing agent cache:', clearedState);
      return clearedState;

    case 'SAVE_AGENT_CONFIGURATION':
      //console.log('Saving agent configuration:', action.payload);
      const stateAfterSave = {
        ...state,
        savedAgentConfigurations: {
          ...state.savedAgentConfigurations,
          [action.payload.name]: action.payload.configuration
        }
      };
      //console.log('State after saving agent configuration:', stateAfterSave);
      return stateAfterSave;

    case 'LOAD_AGENT_CONFIGURATION':
      //console.log('Loading agent configuration:', action.payload);
      const agentConfigToLoad = state.savedAgentConfigurations[action.payload.name];
      if (agentConfigToLoad) {
        //console.log('Configuration found:', agentConfigToLoad);
        const stateAfterLoad = {
          ...state,
          agents: normalizePositions(
            state.agents.map(agent =>
              agent.id === action.payload.agentId ? { ...agent, ...agentConfigToLoad } : agent
            )
          )
        };
        //console.log('State after loading agent configuration:', stateAfterLoad);
        return stateAfterLoad;
      }
      //console.log('Configuration not found, returning current state');
      return state;

    case 'MOVE_AGENT_TO':
      return moveAgentTo(state, action.payload.id, action.payload.position);  

    default:
      //console.log('Unknown action type:', action.type);
      return state;
  }
};

//console.log('agentReducer defined');

export default agentReducer;