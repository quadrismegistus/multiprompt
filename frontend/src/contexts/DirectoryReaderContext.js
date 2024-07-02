import React, { createContext, useState, useContext, useCallback } from 'react';

const DirectoryReaderContext = createContext();

export const useDirectoryReader = () => {
  const context = useContext(DirectoryReaderContext);
  if (!context) {
    throw new Error('useDirectoryReader must be used within a DirectoryReaderProvider');
  }
  return context;
};

export const DirectoryReaderProvider = ({ children }) => {
  const [selectedPath, setSelectedPath] = useState('');
  const [error, setError] = useState(null);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [fileHandles, setFileHandles] = useState([]);

  const readFileOrDirectory = useCallback(async () => {
    try {
      setError(null);
      let fileContents = '';

      if (!('showDirectoryPicker' in window) && !('showOpenFilePicker' in window)) {
        throw new Error('File System Access API is not supported in this browser.');
      }

      if ('showDirectoryPicker' in window) {
        const handle = await window.showDirectoryPicker();
        setDirectoryHandle(handle);
        setSelectedPath(handle.name);
        fileContents = await readDirectoryContents(handle);
      } else {
        const handles = await window.showOpenFilePicker({ multiple: true });
        setFileHandles(handles);
        setSelectedPath(handles.length === 1 ? handles[0].name : `${handles.length} files selected`);
        for (const fileHandle of handles) {
          const file = await fileHandle.getFile();
          const result = await handleFileContent(file);
          if (result.processed) {
            fileContents += result.content;
          }
        }
      }

      return fileContents.trim();
    } catch (err) {
      setError(err.message);
      setSelectedPath('No file or folder selected');
      return null;
    }
  }, []);

  const handleRefreshFiles = useCallback(async () => {
    try {
      setError(null);
      let fileContents = '';

      if (directoryHandle) {
        fileContents = await readDirectoryContents(directoryHandle);
      } else if (fileHandles.length > 0) {
        for (const fileHandle of fileHandles) {
          const file = await fileHandle.getFile();
          const result = await handleFileContent(file);
          if (result.processed) {
            fileContents += result.content;
          }
        }
      } else {
        throw new Error('No directory or files selected');
      }

      return fileContents.trim();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [directoryHandle, fileHandles]);

  const handleFileContent = async (file, path = '') => {
    if (!file) {
      console.error('File is null or undefined');
      return { processed: false, content: '', lines: 0 };
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (['py', 'html', 'js', 'css'].includes(extension)) {
      const contents = await file.text();
      const fileLines = contents.split('\n').length;
      const fileContent = `## ${path}${file.name}\n\n\`\`\`${extension}\n${contents}\n\`\`\`\n\n`;
      return { processed: true, content: fileContent, lines: fileLines };
    }
    return { processed: false, content: '', lines: 0 };
  };

  const readDirectoryContents = async (dirHandle, path = '') => {
    let fileContents = '';

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          const { processed, content } = await handleFileContent(file, path);
          if (processed) {
            fileContents += content;
          }
        } catch (error) {
          console.error('Error processing file:', error);
        }
      } else if (entry.kind === 'directory') {
        fileContents += await readDirectoryContents(entry, `${path}${entry.name}/`);
      }
    }

    return fileContents;
  };

  return (
    <DirectoryReaderContext.Provider value={{ 
      selectedPath, 
      error, 
      readFileOrDirectory, 
      handleRefreshFiles,
      hasSelectedFiles: !!directoryHandle || fileHandles.length > 0 
    }}>
      {children}
    </DirectoryReaderContext.Provider>
  );
};