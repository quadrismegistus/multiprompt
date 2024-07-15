// // src/contexts/DirectoryReaderContext.js
// import React, { createContext, useState, useContext, useCallback } from 'react';
// import { readTextFile, readDir } from '@tauri-apps/api/fs';
// import { useSocket } from './SocketContext';

// const DirectoryReaderContext = createContext();

// export const useDirectoryReader = () => {
//   const context = useContext(DirectoryReaderContext);
//   if (!context) {
//     throw new Error('useDirectoryReader must be used within a DirectoryReaderProvider');
//   }
//   return context;
// };

// export const DirectoryReaderProvider = ({ children }) => {
//   const [selectedPath, setSelectedPath] = useState('');
//   const [error, setError] = useState(null);
//   const { socket } = useSocket();

//   const readFileOrDirectory = useCallback(async () => {
//     try {
//       const selected = await open({
//         directory: true,
//         multiple: true,
//       });
//       console.log(selected);

//       if (selected) {
//         setSelectedPath(selected);
//         return selected;
//       }
//     } catch (err) {
//       setError('Failed to select directory');
//       console.error(err);
//     }
//     return null;
//   }, []);

//   const handleRefreshFiles = useCallback(async () => {
//     if (!selectedPath) {
//       setError('No directory selected');
//       return null;
//     }

//     try {
//       const entries = await readDir(selectedPath, { recursive: true });
//       let content = '';

//       for (const entry of entries) {
//         if (entry.children) continue; // Skip directories

//         const fileExt = entry.name.split('.').pop().toLowerCase();
//         if (['py', 'js', 'html', 'css'].includes(fileExt)) {
//           const fileContent = await readTextFile(entry.path);
//           content += `## ${entry.path}\n\n\`\`\`${fileExt}\n${fileContent}\n\`\`\`\n\n`;
//         }
//       }

//       return content;
//     } catch (err) {
//       setError('Failed to read directory contents');
//       console.error(err);
//       return null;
//     }
//   }, [selectedPath]);

//   return (
//     <DirectoryReaderContext.Provider value={{ 
//       selectedPath, 
//       error, 
//       readFileOrDirectory, 
//       handleRefreshFiles,
//       hasSelectedFiles: !!selectedPath 
//     }}>
//       {children}
//     </DirectoryReaderContext.Provider>
//   );
// };