import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useConfig } from '../contexts/ConfigContext';
import { useApiClients } from '../contexts/LLMProvider';
import { useAgents } from '../contexts/AgentContext';

function Prompt({ referenceCodePrompt }) {
  const [prompt, setPrompt] = useState('');
  const { config } = useConfig();
  const { query } = useApiClients();
  const { agents } = useAgents();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const userMessage = {
      role: 'user',
      content: prompt + (referenceCodePrompt ? '\n\nReference Code:\n' + referenceCodePrompt : '')
    };

    const aiAgents = agents.filter(agent => agent.type === 'ai');

    for (const agent of aiAgents) {
      const systemMessage = agent.systemPrompt 
        ? { role: 'system', content: agent.systemPrompt }
        : { role: 'system', content: 'You are a helpful assistant.' };

      const messages = [systemMessage, userMessage];

      try {
        let responseContent = '';
        for await (const chunk of query(agent.model, messages)) {
          responseContent += chunk;
          // You might want to update the agent's output in real-time here
          // This would require modifying your AgentContext to include a method for updating agent output
        }
        // Update the agent's output in the AgentContext
        // This would require adding a new method to your AgentContext, e.g.:
        // updateAgentOutput(agent.id, responseContent);
      } catch (error) {
        console.error(`Error querying ${agent.name}:`, error);
        // Handle the error appropriately
      }
    }

    setPrompt('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      {referenceCodePrompt && (
        <Form.Group className="mb-3">
          <Form.Label>Reference Code Prompt</Form.Label>
          <Form.Control
            as="textarea"
            value={referenceCodePrompt}
            readOnly
            rows={5}
          />
        </Form.Group>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Your Prompt</Form.Label>
        <Form.Control
          as="textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={3}
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Send
      </Button>
    </Form>
  );
}

export default Prompt;