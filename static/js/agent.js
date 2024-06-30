// static/js/agent.js

UI.populateAgentDropdown = function(dropdown) {
    console.log('UI: Populating agent dropdown...');
    dropdown.innerHTML = '<option value="new">New Agent</option>';
    Object.keys(UI.agents).forEach(agentName => {
        const option = document.createElement('option');
        option.value = agentName;
        option.textContent = agentName;
        dropdown.appendChild(option);
    });
    console.log('UI: Agent dropdown populated');
};

UI.handleAgentChange = function(event) {
    const agentName = event.target.value;
    const modal = event.target.closest('.column-config-modal');
    const newAgentFields = modal.querySelector('.new-agent-fields');
    const modelDropdown = modal.querySelector('.column-model-dropdown');
    const systemPromptTextarea = modal.querySelector('.column-system-prompt');
    const temperatureInput = modal.querySelector('.column-temperature');
    if (agentName === 'new') {
        newAgentFields.style.display = 'block';
        modelDropdown.value = '';
        systemPromptTextarea.value = '';
        temperatureInput.value = '0.7';
    } else {
        newAgentFields.style.display = 'none';
        const agent = UI.agents[agentName];
        modelDropdown.value = agent.model;
        systemPromptTextarea.value = agent.systemPrompt;
        temperatureInput.value = agent.temperature;
    }
};

UI.updateAgent = function(event) {
    const modal = event.target.closest('.column-config-modal');
    const agentDropdown = modal.querySelector('.agent-dropdown');
    const agentNameInput = modal.querySelector('.agent-name');
    const modelDropdown = modal.querySelector('.column-model-dropdown');
    const systemPromptTextarea = modal.querySelector('.column-system-prompt');
    const temperatureInput = modal.querySelector('.column-temperature');
    const agentName = agentDropdown.value === 'new' ? agentNameInput.value : agentDropdown.value;
    
    if (!agentName) {
        alert('Please enter a name for the agent.');
        return;
    }
    
    UI.agents[agentName] = {
        model: modelDropdown.value,
        systemPrompt: systemPromptTextarea.value,
        temperature: parseFloat(temperatureInput.value)
    };
    
    UI.saveAgentsToLocalStorage();
    UI.populateAgentDropdown(agentDropdown);
    agentDropdown.value = agentName;
    alert('Agent updated successfully.');
};

UI.loadAgentsFromLocalStorage = function() {
    console.log('UI: Loading agents from localStorage...');
    const savedAgents = localStorage.getItem('agents');
    if (savedAgents) {
        UI.agents = JSON.parse(savedAgents);
        console.log('UI: Agents loaded from localStorage', UI.agents);
    } else {
        console.log('UI: No saved agents found in localStorage');
    }
};

UI.saveAgentsToLocalStorage = function() {
    console.log('UI: Saving agents to localStorage...', UI.agents);
    localStorage.setItem('agents', JSON.stringify(UI.agents));
    console.log('UI: Agents saved to localStorage');
};

UI.deleteAgent = function(agentName) {
    if (confirm(`Are you sure you want to delete the agent "${agentName}"?`)) {
        delete UI.agents[agentName];
        UI.saveAgentsToLocalStorage();
        UI.populateAgentDropdown(document.querySelector('.agent-dropdown'));
        alert('Agent deleted successfully.');
    }
};

// Expose functions to the global scope
window.handleAgentChange = UI.handleAgentChange;
window.updateAgent = UI.updateAgent;
window.deleteAgent = UI.deleteAgent;

console.log('Agent: Agent management system loaded');