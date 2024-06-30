
// src/components/UserColumn.js
import React from 'react';
import { useAgents } from '../contexts/AgentContext';
import Prompt from './Prompt';
import DirectoryReader from './DirectoryReader';

function UserColumn() {
  const { agents } = useAgents();
  const userAgent = agents.find(agent => agent.type === 'user');

  return (
    <div className="column">
      <div className="box">
        <h3 className="title is-4">{userAgent.name}</h3>
        <DirectoryReader />
        <Prompt />
      </div>
    </div>
  );
}

export default UserColumn;