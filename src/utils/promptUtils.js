// src/utils/promptUtils.js
import modelsData from '../data/models.json'; // Import model data

export const formatPromptMessages = (promptText, referenceCodePrompt, prevOutput) => {
  let formattedPrompt = promptText;

  if (referenceCodePrompt) {
    formattedPrompt += `\n\nReference Code:\n${referenceCodePrompt}`;
  }

  if (prevOutput) {
    formattedPrompt += `\n\nPrevious AI Response:\n${prevOutput}`;
  }

  return formattedPrompt;
};


export const makeAsciiSection = (title, content, level = 1) => {
  const horizontalLine = '-'.repeat(60);
  const levelIndicator = '#'.repeat(level);
  const formattedTitle = level === 1 ? title.toUpperCase() : title;
  
  // Fixed left padding
  const leftPadding = 2;
  const titleLength = levelIndicator.length + 1 + formattedTitle.length;
  const rightPadding = 60 - titleLength - leftPadding;
  
  // Create the header box
  const headerBox = `
+${horizontalLine}+
|${' '.repeat(leftPadding)}${levelIndicator} ${formattedTitle}${' '.repeat(rightPadding)}|
+${horizontalLine}+
`.trim();

  // Combine header box with content
  return `\n${headerBox}\n\n${content}\n\n`;
}
// Example usage:
// console.log(makeAsciiSection("Example Title", "This is some content.\nIt can span multiple lines.", 1));
// console.log(makeAsciiSection("Another Example", "More content here.\nWith another line.", 2));


export const extractTLDR = (text) => {
  const regex = /^(?:\s*)(?:\*\*|\*|_|__)?(?:TLDR|TL;DR|TL;DR|TL DR|tldr|tl;dr|tl;dr|tl dr|Tldr|Tl;dr|Summary)(?:\*\*|\*|_|__)?(?:\s*:?)(?:\s*)(.*)/m;
  const match = text.match(regex);
  if (match) {
    // Remove leading and trailing underscores, asterisks, and colons from the result
    return match[1].replace(/^[_*:]+|[_*:]+$/g, '').trim();
  }
  return null;
};

// export const extractTLDR = (text) => {
//   // Updated regex to handle both asterisks and underscores
//   const tldrRegex = /^(?:[*_]{0,2}(?:tl;?dr)[*_]{0,2}:?[ \t]*\n?)(.*?)(?:\n\n|$)/im;

//   // Try to match the regex
//   const match = text.match(tldrRegex);

//   if (match) {
//     // If there's a match, return the captured group (the actual TL;DR content)
//     // Remove any leading/trailing asterisks or underscores
//     return match[1].replace(/^[*_]+|[*_]+$/g, '').trim();
//   }

//   // If no match is found, return null
//   return null;
// }




// Function to get the cost per token for a model
export const getCostPerToken = (model) => {
  const modelData = modelsData.find(m => m.model === model);
  return modelData ? modelData.cost_per_1M_tokens / 1e6 : 0;
};