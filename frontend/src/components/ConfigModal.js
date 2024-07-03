import React from 'react';
import { Modal, Button, Form, Col, Container,Row } from 'react-bootstrap';
import useStore from '../store/useStore';
import './ConfigModal.css'

function ConfigModal({ show, onHide }) {
  const { config, updateConfig } = useStore(state => ({
    config: state.config,
    updateConfig: state.updateConfig
  }));

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    updateConfig({ [name]: value });
  };

  return (
    <Modal show={show} onHide={onHide} className='config-modal'>
      <Modal.Header closeButton>
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
        <Container>
        <Row>
          <Col>
          <Form.Group>
            <Form.Label>System Message Preface</Form.Label>
            <div><textarea
              // type="text"
              name="systemMessagePreface"
              value={config.systemMessagePreface || ''}
              onChange={handleConfigChange}
              placeholder="Enter System Message Preface"
              className='w-100'
            /></div>
          </Form.Group>
          </Col>
          </Row>
          
          
        <Row>
            
            <Col className='w-50'>
            <Form.Group className="mb-3">
            <Form.Label>OpenAI API Key</Form.Label>
            <Form.Control
              type="password"
              name="openaiApiKey"
              value={config.openaiApiKey || ''}
              onChange={handleConfigChange}
              placeholder="Enter OpenAI API Key"
            />
            </Form.Group>
            </Col>
            <Col className='w-50'>
            <Form.Group>
            <Form.Label>Claude API Key</Form.Label>
            <Form.Control
              type="password"
              name="claudeApiKey"
              value={config.claudeApiKey || ''}
              onChange={handleConfigChange}
              placeholder="Enter Claude API Key"
            />
            </Form.Group>
            </Col>

            </Row>
            
            </Container>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfigModal;