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
