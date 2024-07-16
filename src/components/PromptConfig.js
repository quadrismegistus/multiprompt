import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Form, Row, Col, Button, Spinner, InputGroup } from 'react-bootstrap';
import { RefreshCw, Folder, Send } from 'lucide-react';
import CheckboxTree from 'react-checkbox-tree';
import { open as tauriOpen } from '@tauri-apps/api/dialog';
import useStore from '../store/useStore';
import { useSocket } from '../contexts/SocketContext';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useLLM } from "../contexts/LLMProvider";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const PromptConfig = () => {
  const {
    updateReferenceCodePrompt,
    setSelectedReferencePaths,
    rootReferencePath,
    setRootReferencePath,
    config,
    userPrompt,
    updateUserPrompt,
    referencePaths,
    setReferencePaths,
  } = useStore();

  const { socket, isConnected } = useSocket();

  const [nodes, setNodes] = useState([]);
  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const textareaRef = useRef(null);
  const { handleSendPrompt } = useLLM();
  const [isSending, setIsSending] = useState(false);
  const [gridApi, setGridApi] = useState(null);

  const columnDefs = useMemo(() => [
    { headerName: 'File', field: 'path_rel', sortable: true, filter: true },
    { 
      headerName: '# bytes', 
      field: 'filesize', 
      sortable: true, 
      filter: true, 
      valueFormatter: params => params.value ? params.value.toLocaleString() : 'N/A' 
    },
    { 
      headerName: '# tokens (est.)', 
      field: 'num_tokens', 
      sortable: true, 
      filter: true, 
      valueFormatter: params => params.value ? params.value.toLocaleString() : 'N/A',
      sort: 'desc',
      sortIndex: 0
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
    sortingOrder: ['desc', 'asc', null]
  }), []);

  const getTotalFileSize = useMemo(() => {
    const total = selectedFiles.reduce((total, file) => total + (file.filesize || 0), 0);
    return total.toLocaleString();
  }, [selectedFiles]);

  const getTotalTokens = useMemo(() => {
    const total = selectedFiles.reduce((total, file) => total + (file.num_tokens || 0), 0);
    return total.toLocaleString();
  }, [selectedFiles]);

  const getTotalFiles = useMemo(() => {
    return selectedFiles.length;
  }, [selectedFiles]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, []);

  const handleSend = useCallback(async () => {
    console.log("Sending prompt:", userPrompt);
    setIsSending(true);
    // setAccordionOpen(false);
    updateUserPrompt(''); 
    try {
      const result = await handleSendPrompt(userPrompt);
      console.log("Prompt sent successfully, result:", result);
    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setIsSending(false);
    }
  }, [handleSendPrompt, userPrompt, updateUserPrompt]);


  const buildFileTreeFromPaths = useCallback((paths) => {
    const tree = {};
    paths.forEach(({ path_rel, path_abs }) => {
      if (!path_rel || !path_abs) {
        console.error('Invalid path data:', { path_rel, path_abs });
        return;
      }
      const parts = path_rel.split('/');
      let current = tree;
      parts.forEach((part, index) => {
        if (!current[part]) {
          if (index === parts.length - 1) {
            // This is a file 
            current[part] = { value: path_rel, label: part };
          } else {
            // This is a directory
            current[part] = { value: parts.slice(0, index + 1).join('/'), label: part, children: {} };
          }
        }
        if (index < parts.length - 1) {
          current = current[part].children;
        }
      });
    });

    const buildNodes = (node) => {
      if (!node.children) return node; // This is a file
      const sortedChildren = Object.entries(node.children)
        .sort(([, a], [, b]) => {
          // Sort directories first, then alphabetically
          const aIsDir = !!a.children;
          const bIsDir = !!b.children;
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.label.localeCompare(b.label);
        })
        .map(([, child]) => buildNodes(child));

      return {
        ...node,
        children: sortedChildren
      };
    };

    return Object.values(tree).map(buildNodes).sort((a, b) => {
      // Sort top-level nodes (directories first, then alphabetically)
      const aIsDir = !!a.children;
      const bIsDir = !!b.children;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.label.localeCompare(b.label);
    });
  }, []);

  const fileTree = useMemo(() => buildFileTreeFromPaths(referencePaths), [referencePaths, buildFileTreeFromPaths]);

  useEffect(() => {
    setNodes(fileTree);
  }, [fileTree]);

  useEffect(() => {
    if (socket) {
      socket.on('new_reference_prompt_tree', (data) => {
        if (data && data.paths) {
          setReferencePaths(data.paths);
          updateSelectedFiles(data.paths, checked);
        } else {
          console.error('Invalid data received for new_reference_prompt_tree:', data);
        }
      });

      return () => {
        socket.off('new_reference_prompt_tree');
      };
    }
  }, [socket, setReferencePaths, checked]);

  const updateSelectedFiles = useCallback((paths, checkedPaths) => {
    const selected = paths.filter(path => checkedPaths.includes(path.path_rel));
    setSelectedFiles(selected);
  }, []);  

  const [hasReferencePaths, setHasReferencePaths] = useState(false);
 
  useEffect(() => {
    if (rootReferencePath && socket && isConnected && !hasReferencePaths) {
      socket.emit("build_reference_prompt_tree", { path: rootReferencePath });
      setHasReferencePaths(true);
    }
  }, [rootReferencePath, socket, isConnected, hasReferencePaths]);

  const handleSelectRootDirectory = async () => {
    try {
      const selectedPath = await tauriOpen({
        directory: true,
        multiple: false,
      });
      
      if (selectedPath) {
        setRootReferencePath(selectedPath);
        setHasReferencePaths(false); // Reset the flag when a new directory is selected
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const handleRefresh = () => {
    if (rootReferencePath && socket && isConnected) {
      socket.emit("build_reference_prompt_tree", { path: rootReferencePath });
      setHasReferencePaths(true);
    } else {
      console.error("Unable to refresh: No root path set or socket not connected");
    }
  };

  return (
    <Form.Group style={{clear:'both'}}>
        <Form.Control
            as="textarea"
            rows={10}
            value={userPrompt}
            onChange={(e) => updateUserPrompt(e.target.value)}
            placeholder="Enter your prompt here"
            className="w-100 promptarea"
        />

        <Button 
            variant="primary" 
            onClick={handleSend} 
            disabled={isSending || !userPrompt.trim()}
            className="px-4 py-2" 
            style={{float:'right'}}
        >
            {isSending ? (
                <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="visually-hidden">Sending...</span>
                </>
            ) : (
                <>Send <Send size={16} className="ms-2" /></>
            )}
        </Button>
      <div style={{clear:"both", marginBottom:10}} />
      <Form.Label>Attachments</Form.Label>
      <Row>
        <InputGroup>
            <Form.Control
              type="text"
              value={rootReferencePath}
              readOnly
              placeholder="Selected paths"
              className="readonly-input"
              onClick={handleSelectRootDirectory}
            />
            <Button variant="link" onClick={handleSelectRootDirectory}>
              <Folder />
            </Button>
            <Button
              style={{border:"none"}}
              variant="link"
              onClick={handleRefresh}
              disabled={checked.length === 0 && !config.githubUrl}
            >
              <RefreshCw />
            </Button>
          </InputGroup>
      </Row>
      {nodes.length > 0 && (
        <Row className="mb-3">
          <Col>
            <CheckboxTree
              nodes={nodes}
              checked={checked}
              expanded={expanded}
              onCheck={(checked) => {
                setChecked(checked);
                setSelectedReferencePaths(checked);
                updateSelectedFiles(referencePaths, checked);
              }}
              onExpand={setExpanded}
            />
          </Col>
        </Row>
      )}
      
      {selectedFiles.length > 0 && (
        <Row className="mb-3">
          <Col>
            <div className="ag-theme-alpine" style={{ height: '200px', width: '100%' }}>
              <AgGridReact
                columnDefs={columnDefs}
                rowData={selectedFiles}
                defaultColDef={defaultColDef}
                pagination={false}
                domLayout='normal'
                headerHeight={32}
                rowHeight={32}
                style={{height: "200px", width: "100%"}}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <strong>Total Files:</strong> {getTotalFiles}
              <strong style={{ marginLeft: '20px' }}>Total File Size:</strong> {getTotalFileSize} bytes
              <strong style={{ marginLeft: '20px' }}>Total Tokens:</strong> {getTotalTokens}
            </div>
          </Col>
        </Row>
      )}
    </Form.Group>
  );
};

export default PromptConfig;