const UI = {
    modelOutputs: {},
    agents: {},
    workflows: {}, 
    setupUI() {
        console.log('UI: Setting up user interface...');
        this.setupEventListeners();
        this.setupSystemPrompts();
        this.createModelColumns();
        this.loadAgentsFromLocalStorage();
        try {
            this.loadWorkflowsFromLocalStorage();
        } catch (error) {
            console.warn('UI: Error loading workflows. This feature may not be available.', error);
        }
        console.log('UI: User interface setup complete');
    },
    setupEventListeners() {
        console.log('UI: Setting up event listeners...');
        document.getElementById("summaryModel")?.addEventListener('change', this.handleConfigChange);
        document.getElementById("summaryModelDropdown")?.addEventListener('change', this.handleConfigChange);
        document.getElementById("workflowDropdown")?.addEventListener('change', this.handleWorkflowChange);
        document.getElementById("saveWorkflowBtn")?.addEventListener('click', this.saveWorkflow.bind(this));
        document.querySelectorAll('input[name="model"]').forEach(checkbox => {
            checkbox.addEventListener('change', this.handleConfigChange);
        });
        document.getElementById("prompt")?.addEventListener('input', this.savePromptToLocalStorage);
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        console.log('UI: Event listeners setup complete');
    },
    handleConfigChange() {
        console.log('UI: Handling configuration change...');
        const newConfig = {
            includeRepoAnalysis: document.getElementById("includeRepoAnalysis").checked,
            summaryModel: document.getElementById("summaryModel").checked,
            summaryModelValue: document.getElementById("summaryModelDropdown").value,
            checkedModels: UI.getCheckedModels()
        };
        Config.updateConfig(newConfig);
        console.log('UI: Configuration updated', newConfig);
    },
    getCheckedModels() {
        const checkedModels = Array.from(document.querySelectorAll('input[name="model"]:checked')).map(cb => cb.value);
        console.log('UI: Retrieved checked models', checkedModels);
        return checkedModels;
    },
    handleOutsideClick(event) {
        const modals = document.querySelectorAll('.column-config-modal');
        modals.forEach(modal => {
            if (modal.style.display === "block" && !modal.contains(event.target) && !event.target.closest('.config-column-btn')) {
                modal.style.display = "none";
            }
        });
    },
    toggleConfigModal() {
        console.log('UI: Toggling config modal');
        const modal = document.getElementById("configModal");
        if (modal) {
            modal.style.display = modal.style.display === "block" ? "none" : "block";
            console.log(`UI: Config modal ${modal.style.display === "block" ? "shown" : "hidden"}`);
        } else {
            console.warn('UI: Config modal element not found');
        }
    },
    updateOutput(data) {
        if (!this.modelOutputs[data.model]) {
            this.modelOutputs[data.model] = "";
        }
        if (data.text !== undefined) {
            this.modelOutputs[data.model] += data.text;
        }
        const outputElement = document.getElementById(`output-${data.model}`);
        if (outputElement) {
            const markdownContent = outputElement.querySelector('.markdown-content');
            markdownContent.innerHTML = marked.parse(this.modelOutputs[data.model]);
            markdownContent.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
                this.addCopyButton(block);
            });
        } else {
            console.warn(`UI: Output element not found for model ${data.model}`);
        }
    },
    addCopyButton(block) {
        console.log('UI: Adding copy button to code block');
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.textContent = 'Copy';
        copyButton.setAttribute('data-clipboard-text', block.innerText);
        block.parentNode.style.position = 'relative';
        block.parentNode.appendChild(copyButton);
    },
    getSystemPrompts() {
        console.log('UI: Getting system prompts...');
        const checkedModels = this.getCheckedModels();
        const systemPrompts = {};
        checkedModels.forEach(model => {
            const escapedModel = CSS.escape(model);
            const systemPromptElement = document.querySelector(`#output-${escapedModel} .editable-div`);
            if (systemPromptElement) {
                systemPrompts[model] = systemPromptElement.innerText.trim();
            } else {
                console.warn(`UI: System prompt element not found for model ${model}`);
            }
        });
        console.log('UI: Retrieved system prompts', systemPrompts);
        return systemPrompts;
    },
    saveSystemPromptsToLocalStorage() {
        console.log('UI: Saving system prompts to localStorage...');
        const systemPrompts = this.getSystemPrompts();
        localStorage.setItem('systemPrompts', JSON.stringify(systemPrompts));
        console.log('UI: System prompts saved to localStorage', systemPrompts);
    },
    loadSystemPromptsFromLocalStorage() {
        console.log('UI: Loading system prompts from localStorage...');
        const savedSystemPrompts = localStorage.getItem('systemPrompts');
        if (savedSystemPrompts) {
            const systemPrompts = JSON.parse(savedSystemPrompts);
            Object.entries(systemPrompts).forEach(([model, prompt]) => {
                const escapedModel = CSS.escape(model);
                const systemPromptElement = document.querySelector(`#output-${escapedModel} .editable-div`);
                if (systemPromptElement) {
                    systemPromptElement.innerText = prompt;
                }
            });
            console.log('UI: System prompts loaded from localStorage', systemPrompts);
        } else {
            console.log('UI: No saved system prompts found in localStorage');
        }
    },
    savePromptToLocalStorage() {
        const prompt = document.getElementById("prompt")?.innerText;
        localStorage.setItem('prompt', prompt);
    },
    setupSystemPrompts() {
        console.log('UI: Setting up system prompts...');
        const checkedModels = this.getCheckedModels();
        const outputDiv = document.getElementById("output");
        if (!outputDiv) {
            console.warn('UI: Output div not found');
            return;
        }
        checkedModels.forEach(model => {
            const column = document.getElementById(`output-${model}`);
            if (!column) {
                console.warn(`UI: Column not found for model ${model}`);
                return;
            }
            const systemPromptDiv = document.createElement('div');
            systemPromptDiv.className = 'system-prompt';
            systemPromptDiv.innerHTML = `
                <div class="content">
                    <div class="editable-content" contenteditable="true" placeholder="Enter system prompt for ${Models.getModelDict()[model] || model}"></div>
                </div>
            `;
            column.insertBefore(systemPromptDiv, column.firstChild);
            console.log(`UI: System prompt added for model ${model}`);
        });
        console.log('UI: System prompts setup complete');
    },
};

window.toggleConfigModal = UI.toggleConfigModal;
window.handleConfigChange = UI.handleConfigChange;
window.savePromptToLocalStorage = UI.savePromptToLocalStorage;
window.handleOutsideClick = UI.handleOutsideClick;
window.getCheckedModels = UI.getCheckedModels;
window.updateOutput = UI.updateOutput;
window.addCopyButton = UI.addCopyButton;
window.getSystemPrompts = UI.getSystemPrompts;
window.saveSystemPromptsToLocalStorage = UI.saveSystemPromptsToLocalStorage;
window.loadSystemPromptsFromLocalStorage = UI.loadSystemPromptsFromLocalStorage;
window.setupSystemPrompts = UI.setupSystemPrompts;

console.log('UI: User interface management system loaded');


// const UI = {
//     modelOutputs: {},
//     agents: {},
//     workflows: {}, // New object to store workflows
//     setupUI() {
//         console.log('UI: Setting up user interface...');
//         this.setupEventListeners();
//         this.setupSystemPrompts();
//         this.createModelColumns();
//         this.loadAgentsFromLocalStorage();
        
//         // Wrap workflow-related setup in a try-catch block
//         try {
//             this.loadWorkflowsFromLocalStorage();
//         } catch (error) {
//             console.warn('UI: Error loading workflows. This feature may not be available.', error);
//         }
        
//         console.log('UI: User interface setup complete');
//     },
//     handleWorkflowChange(event) {
//         const workflowName = event.target.value;
//         const workflowNameInput = document.getElementById('workflowNameInput');
//         const agentsListContainer = document.getElementById('agentsListContainer');
//         const newWorkflowFields = document.getElementById('newWorkflowFields');
//         const currentAgentsList = document.getElementById('currentAgentsList');
//         if (workflowName === 'new') {
//             workflowNameInput.style.display = 'block';
//             newWorkflowFields.style.display = 'block';
//             agentsListContainer.innerHTML = '';
//             currentAgentsList.innerHTML = '';
//             const columns = document.querySelectorAll('.model-output');
//             columns.forEach(column => {
//                 const model = column.dataset.model;
//                 const agentName = column.querySelector('h3').textContent.trim();
//                 const li = document.createElement('li');
//                 li.textContent = `${agentName} (${model})`;
//                 currentAgentsList.appendChild(li);
//                 const agentLi = document.createElement('li');
//                 agentLi.textContent = `${agentName} (${model})`;
//                 agentsListContainer.appendChild(agentLi);
//             });
//         } else {
//             workflowNameInput.style.display = 'none';
//             newWorkflowFields.style.display = 'none';
//             this.populateAgentsList(workflowName);
//         }
//     },    
    
    
//     populateAgentsList(workflowName) {
//         const agentsListContainer = document.getElementById('agentsListContainer');
//         agentsListContainer.innerHTML = '';
//         if (this.workflows[workflowName]) {
//             this.workflows[workflowName].agents.forEach(agentName => {
//                 const li = document.createElement('li');
//                 li.textContent = agentName;
//                 agentsListContainer.appendChild(li);
//             });
//         }
//     },
//     saveWorkflow() {
//         const workflowDropdown = document.getElementById('workflowDropdown');
//         const workflowNameInput = document.getElementById('workflowName');
//         const workflowName = workflowDropdown.value === 'new' ? workflowNameInput.value : workflowDropdown.value;
//         if (!workflowName) {
//             alert('Please enter a name for the workflow.');
//             return;
//         }
//         const agentsInColumns = Object.keys(this.agents);
//         this.workflows[workflowName] = {
//             agents: agentsInColumns
//         };
//         this.saveWorkflowsToLocalStorage();
//         this.populateWorkflowDropdown();
//         alert('Workflow saved successfully.');
//     },    
//     populateWorkflowDropdown() {
//         console.log('UI: Populating workflow dropdown...');
//         const workflowDropdown = document.getElementById('workflowDropdown');
//         if (!workflowDropdown) {
//             console.warn('UI: Workflow dropdown element not found. Skipping population.');
//             return;
//         }
//         workflowDropdown.innerHTML = '<option value="new">New Workflow</option>';
//         Object.keys(this.workflows).forEach(workflowName => {
//             const option = document.createElement('option');
//             option.value = workflowName;
//             option.textContent = workflowName;
//             workflowDropdown.appendChild(option);
//         });
//         console.log('UI: Workflow dropdown populated');
//     },

//     loadWorkflowsFromLocalStorage() {
//         console.log('UI: Loading workflows from localStorage...');
//         const savedWorkflows = localStorage.getItem('workflows');
//         if (savedWorkflows) {
//             this.workflows = JSON.parse(savedWorkflows);
//             console.log('UI: Workflows loaded from localStorage', this.workflows);
//         } else {
//             console.log('UI: No saved workflows found in localStorage');
//         }
//         this.populateWorkflowDropdown();
//     },

//     saveWorkflowsToLocalStorage() {
//         console.log('UI: Saving workflows to localStorage...', this.workflows);
//         localStorage.setItem('workflows', JSON.stringify(this.workflows));
//         console.log('UI: Workflows saved to localStorage');
//     },
//     toggleConfigModal() {
//         console.log('UI: Toggling config modal');
//         const modal = document.getElementById("configModal");
//         if (modal) {
//             modal.style.display = modal.style.display === "block" ? "none" : "block";
//             console.log(`UI: Config modal ${modal.style.display === "block" ? "shown" : "hidden"}`);
//         } else {
//             console.warn('UI: Config modal element not found');
//         }
//     },
//     createModelColumns() {
//         console.log('UI: Creating model columns...');
//         const outputDiv = document.getElementById("output");
//         if (!outputDiv) {
//             console.warn('UI: Output div not found');
//             return;
//         }
//         outputDiv.innerHTML = '';
//         this.modelOutputs = {};
//         const checkedModels = this.getCheckedModels();
//         const summaryModelIndex = checkedModels.indexOf('summaryModel');
//         if (summaryModelIndex > -1) {
//             checkedModels.push(checkedModels.splice(summaryModelIndex, 1)[0]);
//         }
//         checkedModels.forEach((model) => {
//             const column = document.createElement('div');
//             column.id = `output-${model}`;
//             column.className = 'model-output';
//             column.innerHTML = `
//                 <h3>${Models.getModelDict()[model] || model}
//                     <div class="column-btn-container">
//                         <button class="column-btn config-column-btn" onclick="UI.toggleColumnConfigModal(event)">⚙️</button>
//                         <button class="column-btn add-column-btn" onclick="UI.addNewColumn(event)">+</button>
//                         <button class="column-btn delete-column-btn" onclick="UI.deleteColumn(event)">×</button>
//                     </div>
//                 </h3>
//                 <div class="markdown-content"></div>
//                 <div class="system-prompt-bar">
//                     <div class="editable-div" contenteditable="true" data-placeholder="Enter system prompt for ${Models.getModelDict()[model] || model}"></div>
//                 </div>
//             `;
//             outputDiv.appendChild(column);
//             this.createColumnConfigModal(column, model);
//             console.log(`UI: Column created for model ${model}`);
//         });
//         console.log('UI: Model columns creation complete');
//     },
//     createColumnConfigModal(column, model) {
//         const modalTemplate = document.getElementById('columnConfigModalTemplate');
//         const modalClone = modalTemplate.content.cloneNode(true);
//         const modal = modalClone.querySelector('.column-config-modal');
//         modal.id = `configModal-${model}`;
//         const modelDropdown = modal.querySelector('.column-model-dropdown');
//         Models.populateColumnModelDropdown(modelDropdown);
//         modelDropdown.value = model;
//         column.appendChild(modal);
//         this.populateAgentDropdown(modal.querySelector('.agent-dropdown'));
        
//         // Add this event listener to prevent clicks inside the modal from closing it
//         modal.addEventListener('click', (event) => event.stopPropagation());
//     },
    
//     toggleColumnConfigModal(event) {
//         event.stopPropagation(); // Add this line
//         const column = event.target.closest('.model-output');
//         const modal = column.querySelector('.column-config-modal');
//         if (modal) {
//             modal.style.display = modal.style.display === "block" ? "none" : "block";
//         }
//     },
//     saveColumnConfig(event) {
//         const column = event.target.closest('.model-output');
//         const modal = column.querySelector('.column-config-modal');
//         const agentDropdown = modal.querySelector('.agent-dropdown');
//         const agentNameInput = modal.querySelector('.agent-name');
//         const modelDropdown = modal.querySelector('.column-model-dropdown');
//         const systemPromptTextarea = modal.querySelector('.column-system-prompt');
//         const temperatureInput = modal.querySelector('.column-temperature');
//         const agentName = agentDropdown.value === 'new' ? agentNameInput.value : agentDropdown.value;
//         if (!agentName) {
//             alert('Please enter a name for the agent.');
//             return;
//         }
//         this.agents[agentName] = {
//             model: modelDropdown.value,
//             systemPrompt: systemPromptTextarea.value,
//             temperature: parseFloat(temperatureInput.value)
//         };
//         this.saveAgentsToLocalStorage();
//         this.populateAgentDropdown(agentDropdown);
//         agentDropdown.value = agentName;
//         column.dataset.model = modelDropdown.value;
//         column.dataset.systemPrompt = systemPromptTextarea.value;
//         column.dataset.temperature = temperatureInput.value;
//         const columnTitle = column.querySelector('h3');
//         const modelName = Models.getModelDict()[modelDropdown.value] || modelDropdown.value;
//         columnTitle.childNodes[0].nodeValue = modelName; 
//         const systemPromptDiv = column.querySelector('.editable-div');
//         systemPromptDiv.textContent = systemPromptTextarea.value;
//         this.toggleColumnConfigModal(event);
//     },    
//     addNewColumn(event) {
//         console.log('UI: Adding new column...');
//         const outputDiv = document.getElementById("output");
//         const newColumnId = `custom-column-${Date.now()}`;
//         const newColumn = document.createElement('div');
//         newColumn.id = `output-${newColumnId}`;
//         newColumn.className = 'model-output';
//         newColumn.innerHTML = `
//             <h3>Custom Column
//                 <div class="column-btn-container">
//                     <button class="column-btn config-column-btn" onclick="UI.toggleColumnConfigModal(event)">⚙️</button>
//                     <button class="column-btn add-column-btn" onclick="UI.addNewColumn(event)">+</button>
//                     <button class="column-btn delete-column-btn" onclick="UI.deleteColumn(event)">×</button>
//                 </div>
//             </h3>
//             <div class="markdown-content"></div>
//             <div class="system-prompt-bar">
//                 <div class="editable-div" contenteditable="true" data-placeholder="Enter system prompt for custom column"></div>
//             </div>
//         `;
//         const clickedButton = event.target;
//         const clickedColumn = clickedButton.closest('.model-output');
//         outputDiv.insertBefore(newColumn, clickedColumn.nextSibling);
//         this.createColumnConfigModal(newColumn, newColumnId);
//         console.log('UI: New column added');
//     },
//     deleteColumn(event) {
//         console.log('UI: Deleting column...');
//         const column = event.target.closest('.model-output');
//         if (column) {
//             column.remove();
//             console.log('UI: Column deleted');
//         } else {
//             console.warn('UI: Column not found for deletion');
//         }
//     },
//     updateOutput(data) {
//         if (!this.modelOutputs[data.model]) {
//             this.modelOutputs[data.model] = "";
//         }
//         if (data.text !== undefined) {
//             this.modelOutputs[data.model] += data.text;
//         }
//         const outputElement = document.getElementById(`output-${data.model}`);
//         if (outputElement) {
//             const markdownContent = outputElement.querySelector('.markdown-content');
//             markdownContent.innerHTML = marked.parse(this.modelOutputs[data.model]);
//             markdownContent.querySelectorAll('pre code').forEach((block) => {
//                 hljs.highlightBlock(block);
//                 this.addCopyButton(block);
//             });
//         } else {
//             console.warn(`UI: Output element not found for model ${data.model}`);
//         }
//     },
//     setupEventListeners() {
//         console.log('UI: Setting up event listeners...');
//         document.getElementById("summaryModel")?.addEventListener('change', this.handleConfigChange);
//         document.getElementById("summaryModelDropdown")?.addEventListener('change', this.handleConfigChange);
//         document.getElementById("workflowDropdown")?.addEventListener('change', this.handleWorkflowChange);
//         document.getElementById("saveWorkflowBtn")?.addEventListener('click', this.saveWorkflow.bind(this));
//         document.querySelectorAll('input[name="model"]').forEach(checkbox => {
//             checkbox.addEventListener('change', this.handleConfigChange);
//         });
//         document.getElementById("prompt")?.addEventListener('input', this.savePromptToLocalStorage);
//         document.addEventListener('click', this.handleOutsideClick.bind(this));
//         console.log('UI: Event listeners setup complete');
//     },
    
//     savePromptToLocalStorage() {
//         const prompt = document.getElementById("prompt")?.innerText;
//         localStorage.setItem('prompt', prompt);
//     },
//     setupSystemPrompts() {
//         console.log('UI: Setting up system prompts...');
//         const checkedModels = this.getCheckedModels();
//         const outputDiv = document.getElementById("output");
//         if (!outputDiv) {
//             console.warn('UI: Output div not found');
//             return;
//         }
//         checkedModels.forEach(model => {
//             const column = document.getElementById(`output-${model}`);
//             if (!column) {
//                 console.warn(`UI: Column not found for model ${model}`);
//                 return;
//             }
//             const systemPromptDiv = document.createElement('div');
//             systemPromptDiv.className = 'system-prompt';
//             systemPromptDiv.innerHTML = `
//                 <div class="content">
//                     <div class="editable-content" contenteditable="true" placeholder="Enter system prompt for ${Models.getModelDict()[model] || model}"></div>
//                 </div>
//             `;
//             column.insertBefore(systemPromptDiv, column.firstChild);
//             console.log(`UI: System prompt added for model ${model}`);
//         });
//         console.log('UI: System prompts setup complete');
//     },
//     handleEnterKey(e) {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             console.log('UI: Enter key pressed, inserting line break');
//             e.preventDefault();
//             const selection = window.getSelection();
//             const range = selection.getRangeAt(0);
//             const br = document.createElement('br');
//             range.deleteContents();
//             range.insertNode(br);
//             range.setStartAfter(br);
//             range.setEndAfter(br);
//             range.collapse(false);
//             selection.removeAllRanges();
//             selection.addRange(range);
//         }
//     },
//     handleConfigChange() {
//         console.log('UI: Handling configuration change...');
//         const newConfig = {
//             includeRepoAnalysis: document.getElementById("includeRepoAnalysis").checked,
//             summaryModel: document.getElementById("summaryModel").checked,
//             summaryModelValue: document.getElementById("summaryModelDropdown").value,
//             checkedModels: UI.getCheckedModels()
//         };
//         Config.updateConfig(newConfig);
//         console.log('UI: Configuration updated', newConfig);
//     },
//     getCheckedModels() {
//         const checkedModels = Array.from(document.querySelectorAll('input[name="model"]:checked')).map(cb => cb.value);
//         console.log('UI: Retrieved checked models', checkedModels);
//         return checkedModels;
//     },
//     addCopyButton(block) {
//         console.log('UI: Adding copy button to code block');
//         const copyButton = document.createElement('button');
//         copyButton.className = 'copy-btn';
//         copyButton.textContent = 'Copy';
//         copyButton.setAttribute('data-clipboard-text', block.innerText);
//         block.parentNode.style.position = 'relative';
//         block.parentNode.appendChild(copyButton);
//     },
//     getSystemPrompts() {
//         console.log('UI: Getting system prompts...');
//         const checkedModels = this.getCheckedModels();
//         const systemPrompts = {};
//         checkedModels.forEach(model => {
//             const escapedModel = CSS.escape(model);
//             const systemPromptElement = document.querySelector(`#output-${escapedModel} .editable-div`);
//             if (systemPromptElement) {
//                 systemPrompts[model] = systemPromptElement.innerText.trim();
//             } else {
//                 console.warn(`UI: System prompt element not found for model ${model}`);
//             }
//         });
//         console.log('UI: Retrieved system prompts', systemPrompts);
//         return systemPrompts;
//     },
//     saveSystemPromptsToLocalStorage() {
//         console.log('UI: Saving system prompts to localStorage...');
//         const systemPrompts = this.getSystemPrompts();
//         localStorage.setItem('systemPrompts', JSON.stringify(systemPrompts));
//         console.log('UI: System prompts saved to localStorage', systemPrompts);
//     },
//     loadSystemPromptsFromLocalStorage() {
//         console.log('UI: Loading system prompts from localStorage...');
//         const savedSystemPrompts = localStorage.getItem('systemPrompts');
//         if (savedSystemPrompts) {
//             const systemPrompts = JSON.parse(savedSystemPrompts);
//             Object.entries(systemPrompts).forEach(([model, prompt]) => {
//                 const escapedModel = CSS.escape(model);
//                 const systemPromptElement = document.querySelector(`#output-${escapedModel} .editable-div`);
//                 if (systemPromptElement) {
//                     systemPromptElement.innerText = prompt;
//                 }
//             });
//             console.log('UI: System prompts loaded from localStorage', systemPrompts);
//         } else {
//             console.log('UI: No saved system prompts found in localStorage');
//         }
//     },
//     populateAgentDropdown(dropdown) {
//         console.log('UI: Populating agent dropdown...');
//         dropdown.innerHTML = '<option value="new">New Agent</option>';
//         Object.keys(this.agents).forEach(agentName => {
//             const option = document.createElement('option');
//             option.value = agentName;
//             option.textContent = agentName;
//             dropdown.appendChild(option);
//         });
//         console.log('UI: Agent dropdown populated');
//     },
//     handleAgentChange(event) {
//         const agentName = event.target.value;
//         const modal = event.target.closest('.column-config-modal');
//         const newAgentFields = modal.querySelector('.new-agent-fields');
//         const modelDropdown = modal.querySelector('.column-model-dropdown');
//         const systemPromptTextarea = modal.querySelector('.column-system-prompt');
//         const temperatureInput = modal.querySelector('.column-temperature');
//         if (agentName === 'new') {
//             newAgentFields.style.display = 'block';
//             modelDropdown.value = '';
//             systemPromptTextarea.value = '';
//             temperatureInput.value = '0.7';
//         } else {
//             newAgentFields.style.display = 'none';
//             const agent = this.agents[agentName];
//             modelDropdown.value = agent.model;
//             systemPromptTextarea.value = agent.systemPrompt;
//             temperatureInput.value = agent.temperature;
//         }
//     },
//     updateAgent(event) {
//         const modal = event.target.closest('.column-config-modal');
//         const agentDropdown = modal.querySelector('.agent-dropdown');
//         const agentNameInput = modal.querySelector('.agent-name');
//         const modelDropdown = modal.querySelector('.column-model-dropdown');
//         const systemPromptTextarea = modal.querySelector('.column-system-prompt');
//         const temperatureInput = modal.querySelector('.column-temperature');
//         const agentName = agentDropdown.value === 'new' ? agentNameInput.value : agentDropdown.value;
//         if (!agentName) {
//             alert('Please enter a name for the agent.');
//             return;
//         }
//         this.agents[agentName] = {
//             model: modelDropdown.value,
//             systemPrompt: systemPromptTextarea.value,
//             temperature: parseFloat(temperatureInput.value)
//         };
//         this.saveAgentsToLocalStorage();
//         this.populateAgentDropdown(agentDropdown);
//         agentDropdown.value = agentName;
//         alert('Agent updated successfully.');
//     },
//     loadAgentsFromLocalStorage() {
//         console.log('UI: Loading agents from localStorage...');
//         const savedAgents = localStorage.getItem('agents');
//         if (savedAgents) {
//             this.agents = JSON.parse(savedAgents);
//             console.log('UI: Agents loaded from localStorage', this.agents);
//         } else {
//             console.log('UI: No saved agents found in localStorage');
//         }
//     },
//     saveAgentsToLocalStorage() {
//         console.log('UI: Saving agents to localStorage...', this.agents);
//         localStorage.setItem('agents', JSON.stringify(this.agents));
//         console.log('UI: Agents saved to localStorage');
//     },

//     handleOutsideClick(event) {
//         const modals = document.querySelectorAll('.column-config-modal');
//         modals.forEach(modal => {
//             if (modal.style.display === "block" && !modal.contains(event.target) && !event.target.closest('.config-column-btn')) {
//                 modal.style.display = "none";
//             }
//         });
//     },
// };
// window.toggleConfigModal = UI.toggleConfigModal;
// window.toggleColumnConfigModal = UI.toggleColumnConfigModal;
// window.saveColumnConfig = UI.saveColumnConfig;
// window.updateAgent = UI.updateAgent;
// window.handleAgentChange = UI.handleAgentChange;
// window.handleWorkflowChange = UI.handleWorkflowChange.bind(UI);
// window.saveWorkflow = UI.saveWorkflow.bind(UI);
// console.log('UI: User interface management system loaded');