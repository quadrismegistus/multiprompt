UI.handleWorkflowChange = function(event) {
    const workflowName = event.target.value;
    const workflowNameInput = document.getElementById('workflowNameInput');
    const agentsListContainer = document.getElementById('agentsListContainer');
    const newWorkflowFields = document.getElementById('newWorkflowFields');
    const currentAgentsList = document.getElementById('currentAgentsList');
    if (workflowName === 'new') {
        workflowNameInput.style.display = 'block';
        newWorkflowFields.style.display = 'block';
        agentsListContainer.innerHTML = '';
        currentAgentsList.innerHTML = '';
        const columns = document.querySelectorAll('.model-output');
        columns.forEach(column => {
            const model = column.dataset.model;
            const agentName = column.querySelector('h3').textContent.trim();
            const li = document.createElement('li');
            li.textContent = `${agentName} (${model})`;
            currentAgentsList.appendChild(li);
            const agentLi = document.createElement('li');
            agentLi.textContent = `${agentName} (${model})`;
            agentsListContainer.appendChild(agentLi);
        });
    } else {
        workflowNameInput.style.display = 'none';
        newWorkflowFields.style.display = 'none';
        UI.populateAgentsList(workflowName);
    }
};

UI.populateAgentsList = function(workflowName) {
    const agentsListContainer = document.getElementById('agentsListContainer');
    agentsListContainer.innerHTML = '';
    if (UI.workflows[workflowName]) {
        UI.workflows[workflowName].agents.forEach(agentName => {
            const li = document.createElement('li');
            li.textContent = agentName;
            agentsListContainer.appendChild(li);
        });
    }
};

UI.saveWorkflow = function() {
    const workflowDropdown = document.getElementById('workflowDropdown');
    const workflowNameInput = document.getElementById('workflowName');
    const workflowName = workflowDropdown.value === 'new' ? workflowNameInput.value : workflowDropdown.value;
    if (!workflowName) {
        alert('Please enter a name for the workflow.');
        return;
    }
    const agentsInColumns = Object.keys(UI.agents);
    UI.workflows[workflowName] = {
        agents: agentsInColumns
    };
    UI.saveWorkflowsToLocalStorage();
    UI.populateWorkflowDropdown();
    alert('Workflow saved successfully.');
};

UI.populateWorkflowDropdown = function() {
    console.log('UI: Populating workflow dropdown...');
    const workflowDropdown = document.getElementById('workflowDropdown');
    if (!workflowDropdown) {
        console.warn('UI: Workflow dropdown element not found. Skipping population.');
        return;
    }
    workflowDropdown.innerHTML = '<option value="new">New Workflow</option>';
    Object.keys(UI.workflows).forEach(workflowName => {
        const option = document.createElement('option');
        option.value = workflowName;
        option.textContent = workflowName;
        workflowDropdown.appendChild(option);
    });
    console.log('UI: Workflow dropdown populated');
};

UI.loadWorkflowsFromLocalStorage = function() {
    console.log('UI: Loading workflows from localStorage...');
    const savedWorkflows = localStorage.getItem('workflows');
    if (savedWorkflows) {
        UI.workflows = JSON.parse(savedWorkflows);
        console.log('UI: Workflows loaded from localStorage', UI.workflows);
    } else {
        console.log('UI: No saved workflows found in localStorage');
    }
    UI.populateWorkflowDropdown();
};

UI.saveWorkflowsToLocalStorage = function() {
    console.log('UI: Saving workflows to localStorage...', UI.workflows);
    localStorage.setItem('workflows', JSON.stringify(UI.workflows));
    console.log('UI: Workflows saved to localStorage');
};

window.handleWorkflowChange = UI.handleWorkflowChange.bind(UI);
window.saveWorkflow = UI.saveWorkflow.bind(UI);

console.log('Workflow: Workflow management system loaded');
