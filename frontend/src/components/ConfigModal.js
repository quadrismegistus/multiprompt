
// src/components/ConfigModal.js
import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../contexts/ConfigContext';

function ConfigModal({ isOpen, onClose, agents }) {
  const { config, setConfig } = useContext(ConfigContext);
  const [workflowName, setWorkflowName] = useState('');
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    setWorkflows(savedWorkflows);
  }, []);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveWorkflow = () => {
    if (workflowName) {
      const newWorkflow = { name: workflowName, agents };
      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
      setWorkflowName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Configuration</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                name="includeRepoAnalysis"
                checked={config.includeRepoAnalysis}
                onChange={handleConfigChange}
              />
              {' '}Include Repository Analysis
            </label>
          </div>
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                name="summaryModel"
                checked={config.summaryModel}
                onChange={handleConfigChange}
              />
              {' '}Use Summary Model
            </label>
          </div>
          {config.summaryModel && (
            <div className="field">
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    name="summaryModelValue"
                    value={config.summaryModelValue}
                    onChange={handleConfigChange}
                  >
                    {/* Add options for summary models here */}
                  </select>
                </div>
              </div>
            </div>
          )}
          <h3 className="title is-5">Current Agent Flow</h3>
          <ul>
            {agents.map(agent => (
              <li key={agent.id}>{agent.name} - {agent.model}</li>
            ))}
          </ul>
          <h3 className="title is-5">Save Workflow</h3>
          <div className="field">
            <div className="control">
              <input
                className="input"
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>
          </div>
          <div className="field">
            <div className="control">
              <button className="button is-primary" onClick={handleSaveWorkflow}>Save Workflow</button>
            </div>
          </div>
          <h3 className="title is-5">Saved Workflows</h3>
          <ul>
            {workflows.map((workflow, index) => (
              <li key={index}>{workflow.name}</li>
            ))}
          </ul>
        </section>
        <footer className="modal-card-foot">
          <button className="button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}

export default ConfigModal;