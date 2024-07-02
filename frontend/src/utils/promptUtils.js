// src/utils/promptUtils.js

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


export  const makeAsciiSection = (title, content, level = 1) => {
  const horizontalLine = '-'.repeat(60);
  const levelIndicator = '#'.repeat(level);
  const formattedTitle = level === 1 ? title.toUpperCase() : title;
  
  // Calculate padding for centering the title
  const titleLength = levelIndicator.length + 1 + formattedTitle.length;
  const leftPadding = Math.floor((58 - titleLength) / 2);
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

