UI.createModelColumns = function() {
    console.log('UI: Creating model columns...');
    const outputDiv = document.getElementById("output");
    if (!outputDiv) {
        console.warn('UI: Output div not found');
        return;
    }
    outputDiv.innerHTML = '';
    UI.modelOutputs = {};
    const checkedModels = UI.getCheckedModels();
    const summaryModelIndex = checkedModels.indexOf('summaryModel');
    if (summaryModelIndex > -1) {
        checkedModels.push(checkedModels.splice(summaryModelIndex, 1)[0]);
    }
    checkedModels.forEach((model) => {
        const column = document.createElement('div');
        column.id = `output-${model}`;
        column.className = 'model-output';
        column.innerHTML = `
            <h3>${Models.getModelDict()[model] || model}
                <div class="column-btn-container">
                    <button class="column-btn config-column-btn" onclick="UI.toggleColumnConfigModal(event)">⚙️</button>
                    <button class="column-btn add-column-btn" onclick="UI.addNewColumn(event)">+</button>
                    <button class="column-btn delete-column-btn" onclick="UI.deleteColumn(event)">×</button>
                </div>
            </h3>
            <div class="markdown-content"></div>
            <div class="system-prompt-bar">
                <div class="editable-div" contenteditable="true" data-placeholder="Enter system prompt for ${Models.getModelDict()[model] || model}"></div>
            </div>
        `;
        outputDiv.appendChild(column);
        UI.createColumnConfigModal(column, model);
        console.log(`UI: Column created for model ${model}`);
    });
    console.log('UI: Model columns creation complete');
};

UI.createColumnConfigModal = function(column, model) {
    const modalTemplate = document.getElementById('columnConfigModalTemplate');
    const modalClone = modalTemplate.content.cloneNode(true);
    const modal = modalClone.querySelector('.column-config-modal');
    modal.id = `configModal-${model}`;
    const modelDropdown = modal.querySelector('.column-model-dropdown');
    Models.populateColumnModelDropdown(modelDropdown);
    modelDropdown.value = model;
    column.appendChild(modal);
    UI.populateAgentDropdown(modal.querySelector('.agent-dropdown'));
    modal.addEventListener('click', (event) => event.stopPropagation());
};

UI.toggleColumnConfigModal = function(event) {
    event.stopPropagation(); 
    const column = event.target.closest('.model-output');
    const modal = column.querySelector('.column-config-modal');
    if (modal) {
        modal.style.display = modal.style.display === "block" ? "none" : "block";
    }
};

UI.saveColumnConfig = function(event) {
    const column = event.target.closest('.model-output');
    const modal = column.querySelector('.column-config-modal');
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
    column.dataset.model = modelDropdown.value;
    column.dataset.systemPrompt = systemPromptTextarea.value;
    column.dataset.temperature = temperatureInput.value;
    const columnTitle = column.querySelector('h3');
    const modelName = Models.getModelDict()[modelDropdown.value] || modelDropdown.value;
    columnTitle.childNodes[0].nodeValue = modelName; 
    const systemPromptDiv = column.querySelector('.editable-div');
    systemPromptDiv.textContent = systemPromptTextarea.value;
    UI.toggleColumnConfigModal(event);
};

UI.addNewColumn = function(event) {
    console.log('UI: Adding new column...');
    const outputDiv = document.getElementById("output");
    const newColumnId = `custom-column-${Date.now()}`;
    const newColumn = document.createElement('div');
    newColumn.id = `output-${newColumnId}`;
    newColumn.className = 'model-output';
    newColumn.innerHTML = `
        <h3>Custom Column
            <div class="column-btn-container">
                <button class="column-btn config-column-btn" onclick="UI.toggleColumnConfigModal(event)">⚙️</button>
                <button class="column-btn add-column-btn" onclick="UI.addNewColumn(event)">+</button>
                <button class="column-btn delete-column-btn" onclick="UI.deleteColumn(event)">×</button>
            </div>
        </h3>
        <div class="markdown-content"></div>
        <div class="system-prompt-bar">
            <div class="editable-div" contenteditable="true" data-placeholder="Enter system prompt for custom column"></div>
        </div>
    `;
    const clickedButton = event.target;
    const clickedColumn = clickedButton.closest('.model-output');
    outputDiv.insertBefore(newColumn, clickedColumn.nextSibling);
    UI.createColumnConfigModal(newColumn, newColumnId);
    console.log('UI: New column added');
};

UI.deleteColumn = function(event) {
    console.log('UI: Deleting column...');
    const column = event.target.closest('.model-output');
    if (column) {
        column.remove();
        console.log('UI: Column deleted');
    } else {
        console.warn('UI: Column not found for deletion');
    }
};

window.toggleColumnConfigModal = UI.toggleColumnConfigModal;
window.saveColumnConfig = UI.saveColumnConfig;
window.addNewColumn = UI.addNewColumn;
window.deleteColumn = UI.deleteColumn;

console.log('Column: Column management system loaded');
