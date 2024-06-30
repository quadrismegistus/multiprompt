import React, { useState, useContext } from 'react';
import { useApiClients } from '../contexts/LLMProvider';

const QueryComponent = () => {
  const { query } = useApiClients();
  const [model, setModel] = useState('gpt-3.5-turbo'); // Default model
  const [messages, setMessages] = useState([{ role: 'user', content: 'Hello, LLM!' }]);
  const [output, setOutput] = useState('');

  const handleQuery = async () => {
    const messageChunks = [];
    for await (const chunk of query(model, messages)) {
      messageChunks.push(chunk);
    }
    setOutput(messageChunks.join(''));
  };

  return (
    <div>
      <button onClick={handleQuery}>Query LLM</button>
      <div>
        <h3>Output</h3>
        <pre>{output}</pre>
      </div>
    </div>
  );
};

export default QueryComponent;
