import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, ButtonGroup, InputGroup } from 'react-bootstrap';
import { RefreshCw, Folder } from 'lucide-react';
import CheckboxTree from 'react-checkbox-tree';
import { open as tauriOpen } from '@tauri-apps/api/dialog';
import useStore from '../store/useStore';
import { useSocket } from '../contexts/SocketContext';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const PromptAppendix = () => {
  const {
    referenceCodePrompt,
    updateReferenceCodePrompt,
    setSelectedReferencePaths,
    rootReferencePath,
    setRootReferencePath,
    config
  } = useStore();

  const { socket, isConnected } = useSocket();

  const [nodes, setNodes] = useState([]);
  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('new_reference_prompt', (data) => {
        updateReferenceCodePrompt(data.content);
      });

      socket.on('new_reference_prompt_tree', (data) => {
        if (data && data.paths) {
          const fileTree = buildFileTreeFromPaths(data.paths);
          setNodes(fileTree);
        } else {
          console.error('Invalid data received for new_reference_prompt_tree:', data);
        }
      });

      return () => {
        socket.off('new_reference_prompt');
        socket.off('new_reference_prompt_tree');
      };
    }
  }, [socket, updateReferenceCodePrompt]);

  useEffect(() => {
    if (rootReferencePath && socket && isConnected) {
      socket.emit("build_reference_prompt_tree", { paths: [rootReferencePath] });
    }
  }, [rootReferencePath, socket, isConnected]);

  const handleSelectRootDirectory = async () => {
    try {
      const selectedPath = await tauriOpen({
        directory: true,
        multiple: false,
      });
      
      if (selectedPath) {
        setRootReferencePath(selectedPath);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const handleRefresh = () => {
    if (rootReferencePath && socket && isConnected) {
      socket.emit("build_reference_prompt_tree", { paths: [rootReferencePath] });
    } else {
      console.error("Unable to refresh: No root path set or socket not connected");
    }
  };

  const buildFileTreeFromPaths = (paths) => {
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
  };

  return (
    <Form.Group style={{clear:'both'}}>
      <Form.Label>Attachments</Form.Label>
{/*       
      {rootReferencePath && <Row>
        <Col>
          Showing: {rootReferencePath}
        </Col>
      </Row>} */}
      <Row>
        {/* <Col>{rootReferencePath}</Col>
        <Col style={{textAlign:"right"}}>
          <ButtonGroup>
          <Button variant="primary" onClick={handleSelectRootDirectory}>
            <Folder />
          </Button>
          <Button
            variant="success"
            onClick={handleRefresh}
            disabled={!rootReferencePath}
          >
            <RefreshCw />
          </Button>
          </ButtonGroup>
        </Col> */}
        <InputGroup>
            <Form.Control
              type="text"
              value={rootReferencePath}
              readOnly
              placeholder="Selected paths"
              className="readonly-input"
              onClick={handleSelectRootDirectory}
            />
            <Button variant="primary" onClick={handleSelectRootDirectory}>
              <Folder />
            </Button>
            <Button
              style={{border:"none"}}
              variant="success"
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
              }}
              onExpand={setExpanded}
            />
          </Col>
        </Row>
      )}
      
    </Form.Group>
  );
};

export default PromptAppendix;