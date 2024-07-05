import { entity, persistence } from 'simpler-state';
import { remoteStorage } from '../utils/remoteStorage';
import {
  DEFAULT_MODEL,
  DEFAULT_AGENT,
  DEFAULT_SYSTEM_MESSAGE_PREFACE,
  initialAgentTypes,
  initialAgents,
} from "../constants";
import { normalizePositions } from "../utils/agentUtils";
import { getCostPerToken } from "../utils/promptUtils";

const createRemotePersistence = (key) => persistence(key, {
  storage: remoteStorage,
  serializeFn: JSON.stringify,
  deserializeFn: JSON.parse
});

export const agents = entity(initialAgents, [createRemotePersistence('agents')]);
export const userPrompt = entity("", [createRemotePersistence('userPrompt')]);
export const referenceCodePrompt = entity("", [createRemotePersistence('referenceCodePrompt')]);
export const activeModal = entity(null);
export const isDarkMode = entity(false, [createRemotePersistence('isDarkMode')]);
export const totalCost = entity(0, [createRemotePersistence('totalCost')]);
export const totalTokens = entity(0, [createRemotePersistence('totalTokens')]);
export const totalTokensByAgent = entity({}, [createRemotePersistence('totalTokensByAgent')]);

export const config = entity({
  openaiApiKey: "",
  claudeApiKey: "",
  savedGlobalConfigurations: {},
  conversationHistory: [],
  githubUrl: "",
  systemMessagePreface: DEFAULT_SYSTEM_MESSAGE_PREFACE,
}, [createRemotePersistence('config')]);

export const savedAgentConfigurations = entity(initialAgentTypes, [createRemotePersistence('savedAgentConfigurations')]);

export const currentConversation = entity([], [createRemotePersistence('currentConversation')]);


// Actions
export const updateUserPrompt = (prompt) => {
  userPrompt.set(prompt);
};

export const updateReferenceCodePrompt = (prompt) => {
  referenceCodePrompt.set(prompt);
};

export const setActiveModal = (modalType) => {
  activeModal.set(modalType);
};

export const toggleTheme = () => {
  isDarkMode.set(value => !value);
};

export const updateAgent = (id, updates) => {
  agents.set(currentAgents => 
    currentAgents.map(agent => 
      agent.id === id ? { ...agent, ...updates } : agent
    )
  );
};

export const resetAgentProgress = (id) => {
  agents.set(currentAgents => 
    currentAgents.map(agent => 
      agent.id === id ? { ...agent, progress: 0, progressTokens: 0, output: "" } : agent
    )
  );
};

export const addAgent = (clickedAgentPosition) => {
  agents.set(currentAgents => normalizePositions([...currentAgents, DEFAULT_AGENT]));
};

export const addAgentToken = (agentId, token) => {
  agents.set(currentAgents => {
    const agent = currentAgents.find(a => a.id === agentId);
    if (!agent) return currentAgents;

    agent.output += token;
    agent.totalTokens += 1;
    agent.progressTokens += 1;

    totalTokens.set(value => value + 1);
    totalTokensByAgent.set(current => ({
      ...current,
      [agentId]: (current[agentId] || 0) + 1
    }));

    const costPerToken = getCostPerToken(agent.model);
    totalCost.set(value => value + costPerToken);

    return currentAgents.map(a => 
      a.id === agentId ? { ...a, output: agent.output, totalTokens: agent.totalTokens, progressTokens: agent.progressTokens } : a
    );
  });
};

export const removeAgent = (id) => {
  agents.set(currentAgents => normalizePositions(currentAgents.filter(agent => agent.id !== id)));
};

export const moveAgentTo = (id, newPosition) => {
  if (newPosition > 0) {
    agents.set(currentAgents => {
      const agentIndex = currentAgents.findIndex(agent => agent.id === id);
      if (agentIndex === -1) return currentAgents;

      const updatedAgents = [...currentAgents];
      updatedAgents[agentIndex] = { ...updatedAgents[agentIndex], position: newPosition };
      return normalizePositions(updatedAgents);
    });
  }
};

export const updateConfig = (updates) => {
  config.set(current => ({ ...current, ...updates }));
};

export const clearAgentCache = () => {
  agents.set(initialAgents);
  currentConversation.set([]);
};

export const saveAgentConfiguration = (name, configuration) => {
  savedAgentConfigurations.set(current => ({
    ...current,
    [name]: configuration,
  }));
};

export const loadAgentConfiguration = (agentId, name) => {
  agents.set(currentAgents => 
    normalizePositions(
      currentAgents.map(agent => 
        agent.id === agentId
          ? { ...agent, ...savedAgentConfigurations.get()[name] }
          : agent
      )
    )
  );
};

export const addConversationHistory = (conversation) => {
  config.set(current => ({
    ...current,
    conversationHistory: [...current.conversationHistory, conversation],
  }));
};

export const showModal = (modalType) => {
  activeModal.set(modalType);
};

export const hideModal = () => {
  activeModal.set(null);
};

export const addUserMessageToCurrentConversation = (userPrompt) => {
  currentConversation.set(current => [
    ...current,
    { content: userPrompt, isUser: true, sender: "User" },
  ]);
};

export const addAgentResponse = (agentId, response) => {
  currentConversation.set(current => {
    const agent = agents.get().find(agent => agent.id === agentId);
    return [
      ...current,
      {
        content: response,
        isUser: false,
        sender: agent.name,
        agentId: agent.id,
        agentName: agent.name,
        agentModel: agent.model,
        agentPosition: agent.position,
        agentSystemPrompt: agent.systemPrompt,
        agentTemperature: agent.temperature,
      },
    ];
  });
};



export const loadConfiguration = (configName) => {
  const savedConfigs = config.get().savedGlobalConfigurations;
  if (savedConfigs && savedConfigs[configName]) {
    const loadedConfig = savedConfigs[configName];
    
    // Update agents
    agents.set(loadedConfig.agents || []);
    
    // Update other relevant parts of the state
    updateConfig({
      systemMessagePreface: loadedConfig.systemMessagePreface || '',
      // Add other fields as necessary
    });
    
    // You might want to update other entities here as well
  } else {
    console.error(`Configuration "${configName}" not found`);
  }
};