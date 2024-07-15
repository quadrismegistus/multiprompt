import { React, useEffect, useState } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { RefreshCw, Github, Folder } from 'lucide-react';
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { readDir, readTextFile } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';
import ignore from 'ignore';
import { open as taruiOpen } from '@tauri-apps/api/dialog';
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
    setSelectedReferencePaths
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

      return () => {
        socket.off('new_reference_prompt');
      };
    }
  }, [socket, updateReferenceCodePrompt]);

  const handleDirectoryRead = async () => {
    try {
      const selected = await taruiOpen({
        directory: true,
        multiple: false,
      });
      
      if (selected) {
        setSelectedReferencePaths([selected]);
        const fileTree = await buildFileTree(selected);
        setNodes(fileTree);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const getRelativePath = (rootPath, fullPath) => {
    // Ensure paths use forward slashes
    rootPath = rootPath.replace(/\\/g, '/');
    fullPath = fullPath.replace(/\\/g, '/');
    
    // Remove trailing slash from rootPath if present
    rootPath = rootPath.replace(/\/$/, '');
    
    if (fullPath.startsWith(rootPath)) {
      return fullPath.slice(rootPath.length).replace(/^\//, '');
    }
    return fullPath;
  };

  const buildFileTree = async (rootPath) => {
    const ig = ignore();
    
    // Read .gitignore if it exists
    try {
      const gitignorePath = await join(rootPath, '.gitignore');
      console.log('???',gitignorePath);
      const gitignoreContent = await readTextFile(gitignorePath);
      console.log(gitignoreContent);
      ig.add(gitignoreContent);
    } catch (error) {
      console.error(error);
      // .gitignore doesn't exist or couldn't be read, continue without it
    }

    const buildTree = async (currentPath) => {
      const entries = await readDir(currentPath);
      const filteredEntries = entries.filter(entry => {
        const relativePath = getRelativePath(rootPath, entry.path);
        if(!ig.ignores(relativePath) && entry.name[0] !== '.') {
          // console.log([relativePath, entry.path])
          return true;
        } else {
          return false;
        }
      });

      return Promise.all(filteredEntries.map(async entry => {
        if (entry.children) {
          const children = await buildTree(entry.path);
          return {
            value: entry.path,
            label: entry.name,
            children: children.length > 0 ? children : undefined,
          };
        } else {
          return {
            value: entry.path,
            label: entry.name,
          };
        }
      }));
    };

    return buildTree(rootPath);
  };

  const handleRefresh = async () => {
    const data = {
      paths: checked,
      url: config.githubUrl
    };
    console.log('refreshing with data', data);
  
    if (!isConnected || !socket) {
      console.error("Socket is not connected");
      return;
    }
  
    return new Promise((resolve, reject) => {
      socket.emit("build_reference_prompt", data);
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
              value={selectedReferencePaths.join(', ')}
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