import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Row, Col, Button, Alert, InputGroup } from 'react-bootstrap';
import { RefreshCw, Github, Folder } from 'lucide-react';
import { updateReferenceCodePrompt, updateConfig } from '../redux/actions';
import { useDirectoryReader } from '../contexts/DirectoryReaderContext';

const PromptAppendix = () => {
  const dispatch = useDispatch();
  const referenceCodePrompt = useSelector(state => state.config.referenceCodePrompt);
  const useFileInput = useSelector(state => state.config.useFileInput);
  const { selectedPath, error, readFileOrDirectory, handleRefreshFiles, hasSelectedFiles } = useDirectoryReader();
  const [githubUrl, setGithubUrl] = useState('');

  const handleReferenceCodePromptChange = (e) => {
    dispatch(updateReferenceCodePrompt(e.target.value));
  };

  const handleUseFileInputToggle = (useFile) => {
    dispatch(updateConfig({ useFileInput: useFile }));
  };

  const handleDirectoryRead = async () => {
    const content = await readFileOrDirectory();
    if (content) {
      dispatch(updateReferenceCodePrompt(content));
    }
  };

  const handleRefresh = async () => {
    const content = await handleRefreshFiles();
    if (content) {
      dispatch(updateReferenceCodePrompt(content));
    }
  };

  const handleGithubSubmit = () => {
    // Implement GitHub repo fetching logic here
    console.log('Fetching GitHub repo:', githubUrl);
    // After fetching, update the referenceCodePrompt with the content
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Prompt appendix (reference code or docs to send to LLM)</Form.Label>
      <Form.Control
        as="textarea"
        rows={5}
        value={referenceCodePrompt}
        onChange={handleReferenceCodePromptChange}
        placeholder="Enter reference code prompt here..."
        className="mb-2"
      />
      <Row>
        <Col md={6} className="mb-2">
          <InputGroup>
            
            
            <Form.Control
              type="text"
              value={selectedPath}
              readOnly
              placeholder="No file selected"
              
            />

<Button
              variant="primary"
              onClick={() => {
                handleUseFileInputToggle(true);
                handleDirectoryRead();
              }}
            >
              <Folder />
            </Button>

            <Button
              style={{border:"none"}}
              variant="success"
              onClick={handleRefresh}
              disabled={!hasSelectedFiles}
            >
              <RefreshCw />
            </Button>
            
          </InputGroup>
        </Col>
        <Col md={6}>
          <InputGroup>
            
            <Form.Control
              type="text"
              placeholder="Enter GitHub URL"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            
            <Button variant="dark" onClick={handleGithubSubmit}>
            <Github />
            </Button>
          </InputGroup>
        </Col>
      </Row>
      {error && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}
    </Form.Group>
  );
};

export default PromptAppendix;