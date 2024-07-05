import React from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { RefreshCw, Github, Folder } from 'lucide-react';
import { useDirectoryReader } from '../contexts/DirectoryReaderContext';
import { referenceCodePrompt, config, updateReferenceCodePrompt, updateConfig } from '../entities/main';

const PromptAppendix = () => {
  const currentReferenceCodePrompt = referenceCodePrompt.use();
  const currentConfig = config.use();

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
      const content = await fetchRepoContent(currentConfig.githubUrl);
      updateReferenceCodePrompt(content);
    } catch (error) {
      console.error('Error fetching GitHub repo content:', error);
    }
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
        value={currentReferenceCodePrompt}
        onChange={handleReferenceCodePromptChange}
        placeholder="Enter code or documents to reference"
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
              placeholder="Get from files"
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
              placeholder="Get from GitHub"
              value={currentConfig.githubUrl}
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