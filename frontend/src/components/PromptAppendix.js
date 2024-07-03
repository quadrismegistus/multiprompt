import React from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { RefreshCw, Github, Folder } from 'lucide-react';
import { useDirectoryReader } from '../contexts/DirectoryReaderContext';
import useStore from '../store/useStore';

const PromptAppendix = () => {
  const {
    referenceCodePrompt,
    githubUrl,
    updateReferenceCodePrompt,
    updateConfig,
    updateGithubUrl
  } = useStore(state => ({
    referenceCodePrompt: state.config.referenceCodePrompt,
    githubUrl: state.config.githubUrl,
    updateReferenceCodePrompt: state.updateReferenceCodePrompt,
    updateConfig: state.updateConfig,
    updateGithubUrl: state.updateGithubUrl
  }));

  const { selectedPath, error, readFileOrDirectory, handleRefreshFiles, fetchRepoContent, hasSelectedFiles } = useDirectoryReader();

  const handleReferenceCodePromptChange = (e) => {
    updateReferenceCodePrompt(e.target.value);
  };

  const handleUseFileInputToggle = (useFile) => {
    updateConfig({ useFileInput: useFile });
  };

  const handleDirectoryRead = async () => {
    const content = await readFileOrDirectory();
    if (content) {
      updateReferenceCodePrompt(content);
    }
  };

  const handleRefresh = async () => {
    const content = await handleRefreshFiles();
    if (content) {
      updateReferenceCodePrompt(content);
    }
  };

  const handleGithubSubmit = async () => {
    try {
      const content = await fetchRepoContent(githubUrl);
      updateReferenceCodePrompt(content);
    } catch (error) {
      console.error('Error fetching GitHub repo content:', error);
      // Handle error appropriately
    }
  };

  const handleGithubUrlChange = (e) => {
    const newUrl = e.target.value;
    updateGithubUrl(newUrl);
  };

  return (
    <Form.Group>
      <Form.Control
        as="textarea"
        rows={5}
        value={referenceCodePrompt}
        onChange={handleReferenceCodePromptChange}
        placeholder="Enter reference code prompt here..."
        className="mb-2"
        style={{fontFamily: "monospace", fontSize: "0.9em"}}
      />
      <Row>
        <Col md={6}>
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
              onChange={handleGithubUrlChange}
            />
            <Button variant="dark" onClick={handleGithubSubmit}>
              <Github />
            </Button>
          </InputGroup>
        </Col>
      </Row>
      {error && (<div>{error}</div>)}
    </Form.Group>
  );
};

export default PromptAppendix;