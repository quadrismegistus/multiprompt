export const updateReferenceCodePrompt = (prompt) => ({
  type: 'UPDATE_REFERENCE_CODE_PROMPT',
  payload: prompt
});

export const updateUserPrompt = (prompt) => ({
  type: 'UPDATE_USER_PROMPT',
  payload: prompt
});

export const updateAgent = (id, updates) => ({
  type: 'UPDATE_AGENT',
  payload: { id, updates }
});

export const addConversationHistory = (conversation) => ({
  type: 'ADD_CONVERSATION_HISTORY',
  payload: conversation
});

export const getConversationHistory = () => ({
  type: 'GET_CONVERSATION_HISTORY'
});

export const saveAgent = (agent) => ({
  type: 'SAVE_AGENT',
  payload: agent,
});

export const loadAgents = () => ({
  type: 'LOAD_AGENTS',
});

export const saveConfiguration = (configuration) => ({
  type: 'SAVE_CONFIGURATION',
  payload: configuration
});

export const loadConfiguration = (configuration) => ({
  type: 'LOAD_CONFIGURATION',
  payload: configuration
});

export const saveAgentConfiguration = (name, configuration) => ({
  type: 'SAVE_AGENT_CONFIGURATION',
  payload: { name, configuration }
});

export const loadAgentConfiguration = (agentId, name) => ({
  type: 'LOAD_AGENT_CONFIGURATION',
  payload: { agentId, name }
});


export const moveAgentLeft = (agentId) => ({
  type: 'MOVE_AGENT',
  payload: { id: agentId, direction: 'left' }
});

export const moveAgentRight = (agentId) => ({
  type: 'MOVE_AGENT',
  payload: { id: agentId, direction: 'right' }
});

export const moveAgentTo = (agentId, newPosition) => ({
  type: 'MOVE_AGENT_TO',
  payload: { id: agentId, newPosition }
});


export const updateConfig = (config) => ({
  type: 'UPDATE_CONFIG',
  payload: config
});