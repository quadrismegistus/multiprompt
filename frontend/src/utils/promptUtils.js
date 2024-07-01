// src/utils/promptUtils.js

export const formatPromptMessages = (promptText, referenceCodePrompt, prevOutput, sourceType) => {
  let formattedPrompt = promptText;

  if (referenceCodePrompt) {
    formattedPrompt += `\n\nReference Code:\n${referenceCodePrompt}`;
  }

  if (sourceType === 'left' && prevOutput) {
    formattedPrompt += `\n\nPrevious AI Response:\n${prevOutput}`;
  }

  return formattedPrompt;
};