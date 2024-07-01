// src/redux/actions.js

export const updateReferenceCodePrompt = (prompt) => ({
    type: 'UPDATE_REFERENCE_CODE_PROMPT',
    payload: prompt
  });
  

export const updateUserPrompt = (prompt) => ({ // New Action for userPrompt
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