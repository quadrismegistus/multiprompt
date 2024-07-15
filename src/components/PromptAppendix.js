import { React, useEffect, useState } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { RefreshCw, Github, Folder } from 'lucide-react';
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { open as tauriOpen } from '@tauri-apps/api/dialog';
import useStore from '../store/useStore';
import { useSocket } from '../contexts/SocketContext';
import '@fortawesome/fontawesome-free/css/all.min.css';

const PromptAppendix = () => {
  const {
    referenceCodePrompt,
    updateReferenceCodePrompt,
    config,
    updateConfig,
    selectedReferencePaths,
    setSelectedReferencePaths,
    rootReferencePath,
    setRootReferencePath
  } = useStore();

  const { socket, isConnected } = useSocket();

  const [nodes, setNodes] = useState([]);
  const [checked, setChecked] = useState([]);
  const [expanded, setExpanded] = useState([]);

  const handleReferenceCodePromptChange = (e) => {
    updateReferenceCodePrompt(e.target.value);
  };

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

  const handleDirectoryRead = async () => {
    try {
      const selectedPath = await tauriOpen({
        directory: true,
        multiple: false,
      });
      
      if (selectedPath) {
        setRootReferencePath(selectedPath);
        const data = { paths: [selectedPath] };
        console.log(data);
        if (socket && isConnected) {
          socket.emit("build_reference_prompt_tree", data);
        } else {
          console.error("Socket is not connected. Unable to send data.");
          // Optionally, you can show an error message to the user here
        }
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
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
      let currentPath = '';
      parts.forEach((part, index) => {
        currentPath += (index === 0 ? '' : '/') + part;
        if (!current[part]) {
          if (index === parts.length - 1) {
            // This is a file
            current[part] = { value: path_abs, label: part };
          } else {
            // This is a directory
            current[part] = { value: path_abs.split(path_rel)[0] + currentPath, label: part, children: {} };
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

  const handleRefresh = async () => {
    const data = {
      paths: [rootReferencePath],
      url: config.githubUrl
    };
    console.log('refreshing with data', data);
  
    if (!isConnected || !socket) {
      console.error("Socket is not connected");
      return;
    }
  
    return new Promise((resolve, reject) => {
      socket.emit("build_reference_prompt_tree", data);
    });
  };

  const handleGithubUrlChange = (e) => {
    const newUrl = e.target.value;
    updateConfig({ githubUrl: newUrl });
  };

  const handleCheck = (checked) => {
    console.log('Checked nodes:', checked);
    setChecked(checked);
  };

  const handleExpand = (expanded) => {
    console.log('Expanded nodes:', expanded);
    setExpanded(expanded);
  };

  return (
    <Form.Group style={{clear:'both'}}>
      <Form.Label>Prompt appendix</Form.Label>
      <Form.Control
        as="textarea"
        rows={5}
        value={referenceCodePrompt}
        onChange={handleReferenceCodePromptChange}
        placeholder="Enter code or documents to reference"
        className="mb-2 refpromptarea"
        style={{fontFamily: "monospace", fontSize: "0.9em"}}
      />
      <Row>
        <Col md={12}>
          <Button variant="primary" onClick={handleDirectoryRead}>
            <Folder /> Select Directory
          </Button>
        </Col>
      </Row>
      {nodes.length > 0 && (
        <Row className="mt-3">
          <Col md={12}>
            <CheckboxTree
              nodes={nodes}
              checked={checked}
              expanded={expanded}
              onCheck={handleCheck}
              onExpand={handleExpand}
              nativeCheckboxes={false}
              icons={{
                check: <span className="rct-icon rct-icon-check" />,
                uncheck: <span className="rct-icon rct-icon-uncheck" />,
                halfCheck: <span className="rct-icon rct-icon-half-check" />,
                expandClose: <span className="rct-icon rct-icon-expand-close" />,
                expandOpen: <span className="rct-icon rct-icon-expand-open" />,
                expandAll: <span className="rct-icon rct-icon-expand-all" />,
                collapseAll: <span className="rct-icon rct-icon-collapse-all" />,
                parentClose: <span className="rct-icon rct-icon-parent-close" />,
                parentOpen: <span className="rct-icon rct-icon-parent-open" />,
                leaf: <span className="rct-icon rct-icon-leaf" />,
              }}
            />
          </Col>
        </Row>
      )}
      <Row>
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              value={rootReferencePath}
              readOnly
              placeholder="Selected paths"
            />
            <Button
              style={{border:"none"}}
              variant="success"
              onClick={handleRefresh}
              disabled={checked.length === 0 && !config.githubUrl}
            >
              <RefreshCw />
            </Button>
          </InputGroup>
        </Col>
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Get from GitHub"
              value={config.githubUrl}
              onChange={handleGithubUrlChange}
            />
            <Button variant="dark" onClick={handleRefresh}>
              <Github />
            </Button>
          </InputGroup>
        </Col>
      </Row>
    </Form.Group>
  );
};

export default PromptAppendix;