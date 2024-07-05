import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Dropdown } from 'react-bootstrap';
import useStore from '../store/useStore';

const WorkflowModal = ({ show, onHide }) => {
  const { agents, saveWorkflow, loadWorkflow, savedWorkflows } = useStore(state => ({
    agents: state.agents,
    saveWorkflow: state.saveWorkflow,
    loadWorkflow: state.loadWorkflow,
    savedWorkflows: state.savedWorkflows,
  }));

  const [workflowName, setWorkflowName] = useState('');

  const handleSaveWorkflow = () => {
    const workflow = {
      name: workflowName,
      agents: agents.map(agent => ({ id: agent.id, position: agent.position })),
    };
    saveWorkflow(workflowName, workflow);
    onHide();
  };

  const handleLoadWorkflow = (name) => {
    const workflow = savedWorkflows[name];
    if (workflow) {
      loadWorkflow(workflow);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Save or Load Workflow</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Name</Form.Label>
            <Col sm={9}>
              <Form.Control
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={3}>Load Workflow</Form.Label>
            <Col sm={9}>
              <Dropdown>
                <Dropdown.Toggle variant="secondary" id="dropdown-load-workflow" className="w-100">
                  Select Workflow
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  {Object.keys(savedWorkflows).length > 0 ? (
                    Object.keys(savedWorkflows).map((name) => (
                      <Dropdown.Item
                        key={name}
                        onClick={() => handleLoadWorkflow(name)}
                      >
                        {name}
                      </Dropdown.Item>
                    ))
                  ) : (
                    <Dropdown.Item disabled>No saved workflows</Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSaveWorkflow} disabled={!workflowName.trim()}>
          Save Workflow
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WorkflowModal;
