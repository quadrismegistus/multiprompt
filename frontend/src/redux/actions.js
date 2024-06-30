// src/redux/actions.js

export const updateReferenceCodePrompt = (prompt) => ({
    type: 'UPDATE_REFERENCE_CODE_PROMPT',
    payload: prompt
  });
  

export const updateUserPrompt = (prompt) => ({ // New Action for userPrompt
  type: 'UPDATE_USER_PROMPT',
  payload: prompt
});