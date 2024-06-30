import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../contexts/ConfigContext';

function ConfigModal({ isOpen, onClose }) {
  const { config, setConfig } = useContext(ConfigContext);
  const [localConfig, setLocalConfig] = useState({ ...config });
  const summaryModels = ['Model 1', 'Model 2']; // Add actual summary models

  useEffect(() => {
    setLocalConfig({ ...config });
  }, [config]);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalConfig({
      ...localConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveConfig = () => {
    setConfig(localConfig);
    onClose();
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
                checked={localConfig.includeRepoAnalysis}
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
                checked={localConfig.summaryModel}
                onChange={handleConfigChange}
              />
              {' '}Use Summary Model
            </label>
          </div>
          {localConfig.summaryModel && (
            <div className="field">
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    name="summaryModelValue"
                    value={localConfig.summaryModelValue}
                    onChange={handleConfigChange}
                  >
                    {summaryModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          <div className="field">
            <label className="label">OpenAI API Key</label>
            <div className="control">
              <input
                className="input"
                type="password"
                name="openaiApiKey"
                value={localConfig.openaiApiKey || ''}
                onChange={handleConfigChange}
                placeholder="Enter OpenAI API Key"
              />
            </div>
          </div>
          <div className="field">
            <label className="label">Claude API Key</label>
            <div className="control">
              <input
                className="input"
                type="password"
                name="claudeApiKey"
                value={localConfig.claudeApiKey || ''}
                onChange={handleConfigChange}
                placeholder="Enter Claude API Key"
              />
            </div>
          </div>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-primary" onClick={handleSaveConfig}>Save Config</button>
          <button className="button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}

export default ConfigModal;