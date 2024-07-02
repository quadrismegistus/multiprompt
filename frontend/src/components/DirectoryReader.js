import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Row, Col, Container, Button, Badge, Alert, ButtonGroup } from 'react-bootstrap';

const DirectoryReader = forwardRef(({ onMarkdownGenerated, disabled }, ref) => {
  const [error, setError] = useState(null);
  const [pathHandle, setPathHandle] = useState(null);
  const [selectedPath, setSelectedPath] = useState('');

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

  const handleFileContent = async (file, path = '') => {
    if (!file) {
      console.error('File is null or undefined');
      return { processed: false, content: '', lines: 0 };
    }

    console.log('FILE', file, path);
    const extension = file.name.split('.').pop().toLowerCase();
    if (['py', 'html', 'js', 'css'].includes(extension)) {
      const contents = await file.text();
      const fileLines = contents.split('\n').length;
      const fileContent = `## ${path}${file.name}\n\n\`\`\`${extension}\n${contents}\n\`\`\`\n\n`;
      return { processed: true, content: fileContent, lines: fileLines };
    }
    return { processed: false, content: '', lines: 0 };
  };

  const readDirectoryContents = async (dirHandle, path = '', currentStructure = {}) => {
    let totalFiles = 0;
    let totalLines = 0;
    let fileContents = '';

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          const { processed, content, lines } = await handleFileContent(file, path);
          if (processed) {
            currentStructure[entry.name] = null;
            totalFiles++;
            totalLines += lines;
            fileContents += content;
          }
        } catch (error) {
          console.error('Error processing file:', error);
        }
      } else if (entry.kind === 'directory') {
        currentStructure[entry.name] = {};
        const result = await readDirectoryContents(entry, `${path}${entry.name}/`, currentStructure[entry.name]);
        totalFiles += result.files;
        totalLines += result.lines;
        fileContents += result.contents;
        
        if (Object.keys(currentStructure[entry.name]).length === 0) {
          delete currentStructure[entry.name];
        }
      }
    }
    return { structure: currentStructure, files: totalFiles, lines: totalLines, contents: fileContents };
  };

  const readFileOrDirectory = useCallback(async () => {
    try {
      setError(null);
      let files = 0;
      let lines = 0;
      let structure = {};
      let fileContents = '';

      if (!pathHandle) {
        if (!('showDirectoryPicker' in window) && !('showOpenFilePicker' in window)) {
          throw new Error('File System Access API is not supported in this browser.');
        }

        if ('showDirectoryPicker' in window) {
          const directoryHandle = await window.showDirectoryPicker();
          setPathHandle(directoryHandle);
          setSelectedPath(directoryHandle.name);
          const result = await readDirectoryContents(directoryHandle);
          structure = result.structure;
          files = result.files;
          lines = result.lines;
          fileContents = result.contents;
        } else {
          const fileHandles = await window.showOpenFilePicker({ multiple: true });
          setPathHandle(fileHandles);
          setSelectedPath(fileHandles.length === 1 ? fileHandles[0].name : `${fileHandles.length} files selected`);
          for (const fileHandle of fileHandles) {
            const file = await fileHandle.getFile();
            const result = await handleFileContent(file);
            if (result.processed) {
              files++;
              lines += result.lines;
              fileContents += result.content;
            }
          }
        }
      } else {
        if (pathHandle.kind === 'directory') {
          const result = await readDirectoryContents(pathHandle);
          structure = result.structure;
          files = result.files;
          lines = result.lines;
          fileContents = result.contents;
        } else if (Array.isArray(pathHandle)) {
          for (const fileHandle of pathHandle) {
            const file = await fileHandle.getFile();
            const result = await handleFileContent(file);
            if (result.processed) {
              files++;
              lines += result.lines;
              fileContents += result.content;
            }
          }
        }
      }

      const tree = Object.keys(structure).length > 0 ? `Directory structure:\n\`\`\`\n${generateTree(structure)}\`\`\`\n\n` : '';
      const newMarkdown = `# ${pathHandle && pathHandle.name ? pathHandle.name : 'Selected files'}\n\nTotal files: ${files}\nTotal lines: ${lines}\n\n${tree}${fileContents}`;
      
      onMarkdownGenerated(newMarkdown.trim());
      return newMarkdown.trim();
    } catch (err) {
      setError(err.message);
      setSelectedPath('No file or folder selected');
      return null;
    }
  }, [pathHandle, onMarkdownGenerated]);

  useImperativeHandle(ref, () => ({
    readFileOrDirectory
  }));

  return (
    <Container fluid className="p-0">
      {/* <Row>
        <Col> */}
        <ButtonGroup>
          <Button
            variant="primary"
            onClick={readFileOrDirectory}
            disabled={disabled}
            className="w-100"
          >
            Share files
            <Badge bg="light" text="dark" pill className="ms-2">
              {selectedPath}
            </Badge>
          </Button>
          
        
        {/* </Col> */}
        {/* <Col xs="auto"> */}
          <Button
            variant="outline-secondary"
            onClick={readFileOrDirectory}
            disabled={disabled}
          >
            <RefreshCcw size={20} />
          </Button>
        </ButtonGroup>
          {/* </Col> */}
      {/* </Row> */}
      {error && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}
    </Container>
  );
});

export default DirectoryReader;