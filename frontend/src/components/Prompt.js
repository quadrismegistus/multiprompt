import React, { useState, useContext } from 'react';
import { ConfigContext } from '../contexts/ConfigContext';

function Prompt({ referenceCodePrompt }) {
  const [prompt, setPrompt] = useState('');
  const { config } = useContext(ConfigContext);

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = {
      prompt,
      referenceCodePrompt,
      checked_models: config.checkedModels,
      include_repo_analysis: config.includeRepoAnalysis,
      summary_model: config.summaryModel,
      summary_model_value: config.summaryModelValue
    };
    console.log('Prompt.handleSubmit message =',message);
    setPrompt('');
  };

  return (
    <form onSubmit={handleSubmit}>
      {referenceCodePrompt && (
        <div className="field">
          <label className="label">Reference Code Prompt</label>
          <div className="control">
            <textarea
              className="textarea"
              value={referenceCodePrompt}
              readOnly
              rows="5"
            />
          </div>
        </div>
      )}
      <div className="field">
        <label className="label">Your Prompt</label>
        <div className="control">
          <textarea
            className="textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
          />
        </div>
      </div>
      <div className="field">
        <div className="control">
          <button type="submit" className="button is-primary">Send</button>
        </div>
      </div>
    </form>
  );
}

export default Prompt;