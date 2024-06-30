import React, { useState } from 'react';

const DirectoryReader = ({ onMarkdownGenerated }) => {
  const [error, setError] = useState(null);

  const generateTree = (structure, prefix = '') => {
    if (!structure || typeof structure !== 'object') {
      return '';
    }
    let result = '';
    const entries = Object.entries(structure);
    entries.forEach(([name, value], index) => {
      const isLast = index === entries.length - 1;
      const newPrefix = prefix + (isLast ? '└── ' : '├── ');
      result += newPrefix + name + '\n';
      if (value && typeof value === 'object') {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        result += generateTree(value, childPrefix);
      }
    });
    return result;
  };

  const readFileOrDirectory = async () => {
    try {
      if (!('showDirectoryPicker' in window) && !('showOpenFilePicker' in window)) {
        throw new Error('File System Access API is not supported in this browser.');
      }

      let markdown = '';
      let files = 0;
      let lines = 0;
      let structure = {};

      const handleFileContent = async (file, path = '') => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (['py', 'html', 'js', 'css'].includes(extension)) {
          const contents = await file.text();
          const fileLines = contents.split('\n').length;
          files++;
          lines += fileLines;
          markdown += `## ${path}${file.name}\n\n\`\`\`${extension}\n${contents}\n\`\`\`\n\n`;
          return true;
        }
        return false;
      };

      const readDirectoryContents = async (dirHandle, path = '', currentStructure = structure) => {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const processed = await handleFileContent(file, path);
            if (processed) {
              currentStructure[entry.name] = null;
            }
          } else if (entry.kind === 'directory') {
            currentStructure[entry.name] = {};
            await readDirectoryContents(entry, `${path}${entry.name}/`, currentStructure[entry.name]);
            // Remove empty directories
            if (Object.keys(currentStructure[entry.name]).length === 0) {
              delete currentStructure[entry.name];
            }
          }
        }
      };

      let title = '';
      if ('showDirectoryPicker' in window) {
        const directoryHandle = await window.showDirectoryPicker();
        title = `contents of ${directoryHandle.name}`;
        await readDirectoryContents(directoryHandle);
      } else {
        const fileHandles = await window.showOpenFilePicker({ multiple: true });
        title = 'contents of selected files';
        for (const fileHandle of fileHandles) {
          const file = await fileHandle.getFile();
          await handleFileContent(file);
        }
      }

      const tree = Object.keys(structure).length > 0 ? `Directory structure:\n\`\`\`\n${generateTree(structure)}\`\`\`\n\n` : '';
      
      markdown = `# ${title}\n\n` +
                 `Total files: ${files}\n` +
                 `Total lines: ${lines}\n\n` +
                 tree +
                 markdown;

      onMarkdownGenerated(markdown.trim());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <button className="button is-info mb-3" onClick={readFileOrDirectory}>
        Read file or folder to reference code prompt
      </button>
      {error && <p className="has-text-danger">{error}</p>}
    </div>
  );
};

export default DirectoryReader;