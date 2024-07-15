import { React, useEffect } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { RefreshCw, Github, Folder } from 'lucide-react';
import useStore from '../store/useStore';
import { useSocket } from '../contexts/SocketContext';
import { open as taruiOpen } from '@tauri-apps/api/dialog';

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
        multiple: true,
      });
      
      if (selected) {
        setSelectedReferencePaths(Array.isArray(selected) ? selected : [selected]);
        await handleRefresh();
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const handleRefresh = async () => {
    const data = {
      paths: selectedReferencePaths,
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
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              value={selectedReferencePaths.join(', ')}
              readOnly
              placeholder="Selected paths"
            />
            <Button
              variant="primary"
              onClick={handleDirectoryRead}
            >
              <Folder />
            </Button>
            <Button
              style={{border:"none"}}
              variant="success"
              onClick={handleRefresh}
              disabled={selectedReferencePaths.length === 0 && !config.githubUrl}
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