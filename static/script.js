let models = {};
let defaultModels = [];
let modelOutputs = {};
let modelDict = {};
let activeWebSockets = null;
let summaryModelDropdown;
let defaultSummaryModel = '';

function setColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        console.log('going dark');
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
        console.log('going light');
    }
}




marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

function populateSummaryModelDropdown(defaultSummaryModel) {
    summaryModelDropdown = document.getElementById('summaryModelDropdown');
    if (!summaryModelDropdown) return;
    summaryModelDropdown.innerHTML = ''; // Clear existing options
    Object.values(models).flat().forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.name;
        if (model.value === defaultSummaryModel) {
            option.selected = true;
        }
        summaryModelDropdown.appendChild(option);
    });
}

function setupSummaryModelCheckbox() {
    const summaryModelCheckbox = document.getElementById('summaryModel');
    if (!summaryModelCheckbox || !summaryModelDropdown) return;
    const defaultSummaryModel = summaryModelDropdown.value;
    if (defaultSummaryModel) {
        summaryModelCheckbox.checked = true;
    }
}

function initializeApp() {
    setColorScheme(); // Add this line
    fetch('/models')
        .then(response => response.json())
        .then(data => {
            models = data.available;
            defaultModels = data.default;
            defaultSummaryModel = data.default_summary_model;
            const selectionDiv = document.getElementById('modelSelection');
            if (!selectionDiv) return;

            Object.keys(models).forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'model-category';
                categoryDiv.innerHTML = `<h4>${category}</h4>`;
                models[category].forEach(model => {
                    const checkbox = document.createElement('div');
                    checkbox.className = 'model-checkbox';
                    checkbox.innerHTML = `
                        <input type="checkbox" id="${model.value}" name="model" value="${model.value}" ${defaultModels.includes(model.value) ? 'checked' : ''}>
                        <label for="${model.value}">${model.name}</label>
                    `;
                    categoryDiv.appendChild(checkbox);
                    modelDict[model.value] = model.name;
                });
                selectionDiv.appendChild(categoryDiv);
            });

            populateSummaryModelDropdown(defaultSummaryModel);
            setupSummaryModelCheckbox();
            loadConfigFromLocalStorage();
            setupOutputColumns();
            setupEventListeners();
        })
        .catch(error => console.error('Error fetching models:', error));
}

function saveConfigToLocalStorage() {
    const config = {
        includeRepoAnalysis: document.getElementById("includeRepoAnalysis")?.checked,
        checkedModels: getCheckedModels(),
        summaryModel: document.getElementById("summaryModel")?.checked,
        summaryModelDropdown: summaryModelDropdown?.value
    };
    localStorage.setItem('config', JSON.stringify(config));
}

function loadConfigFromLocalStorage() {
    const configString = localStorage.getItem('config');
    if (!configString) return;
    
    try {
        const config = JSON.parse(configString);
        if (config) {
            const includeRepoAnalysis = document.getElementById("includeRepoAnalysis");
            const summaryModelCheckbox = document.getElementById("summaryModel");
            
            if (includeRepoAnalysis) includeRepoAnalysis.checked = config.includeRepoAnalysis;
            if (summaryModelCheckbox) summaryModelCheckbox.checked = config.summaryModel;
            if (summaryModelDropdown) summaryModelDropdown.value = config.summaryModelDropdown;

            document.querySelectorAll('input[name="model"]').forEach(checkbox => {
                checkbox.checked = config.checkedModels.includes(checkbox.value);
            });
        }
    } catch (error) {
        console.error('Error loading config from localStorage:', error);
    }
}

async function sendPrompt() {
    // const prompt = document.getElementById("prompt")?.value;
        const prompt = document.getElementById("prompt")?.innerText;
    const includeRepoAnalysis = document.getElementById("includeRepoAnalysis")?.checked;
    const checkedModels = getCheckedModels();
    const summaryModelCheckbox = document.getElementById("summaryModel");
    const summaryModel = summaryModelCheckbox?.checked ? summaryModelDropdown?.value : null;

    if (prompt && checkedModels.length > 0) {
        setupOutputColumns();
        const out_msg = JSON.stringify({
            prompt: prompt,
            includeRepoAnalysis: includeRepoAnalysis,
            checked_models: checkedModels,
            summary_model: summaryModel
        });
        console.log(out_msg);
        
        if (!activeWebSockets) {
            activeWebSockets = setupWebSocket();
        }
        
        if (activeWebSockets.readyState === WebSocket.OPEN) {
            activeWebSockets.send(out_msg);
        } else {
            activeWebSockets.onopen = () => {
                activeWebSockets.send(out_msg);
            };
        }
    } else {
        alert("Please enter a prompt and select at least one model.");
    }
}

function setupWebSocket() {
    const ws = new WebSocket(URI);
    ws.onopen = () => {
        console.log(`WebSocket connection established`);
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.error) {
            console.error(`Error for ${data.model}:`, data.error);
            return;
        }
        if (!modelOutputs[data.model]) {
            modelOutputs[data.model] = "";
        }
        if (data.text !== undefined) {
            modelOutputs[data.model] += data.text;
        }
        updateOutput(data.model);
        if (data.modelResultComplete) {
            console.log(`Model ${data.model} completed`);
        }
    };
    ws.onclose = () => {
        console.log(`WebSocket connection closed`);
        activeWebSockets = null;
    };
    return ws;
}

function setupOutputColumns() {
    const outputDiv = document.getElementById("output");
    if (!outputDiv) return;
    outputDiv.innerHTML = ''; 
    const checkedModels = getCheckedModels();
    const regularModels = checkedModels.filter(model => model !== 'summaryModel');
    const hasSummaryModel = checkedModels.includes('summaryModel');
    regularModels.forEach(model => {
        const column = document.createElement("div");
        column.className = "model-output";
        column.id = `output-${model}`;
        column.innerHTML = `<h3>${modelDict[model] || model}</h3><div class="markdown-content"></div>`;
        outputDiv.appendChild(column);
        modelOutputs[model] = "";
    });
    if (hasSummaryModel) {
        const summaryColumn = document.createElement("div");
        summaryColumn.className = "model-output";
        summaryColumn.id = `output-summaryModel`;
        summaryColumn.innerHTML = `<h3>Summary Model</h3><div class="markdown-content"></div>`;
        outputDiv.appendChild(summaryColumn);
        modelOutputs['summaryModel'] = "";
    }
}

function updateOutput(model) {
    const outputElement = document.getElementById(`output-${model}`);
    if (outputElement) {
        const markdownContent = outputElement.querySelector('.markdown-content');
        markdownContent.innerHTML = marked.parse(modelOutputs[model]);
        markdownContent.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.textContent = 'Copy';
            copyButton.setAttribute('data-clipboard-text', block.innerText);
            block.parentNode.style.position = 'relative'; // Ensure the parent is positioned
            block.parentNode.appendChild(copyButton);
        });
    }
}
function getCheckedModels() {
    return Array.from(document.querySelectorAll('input[name="model"]:checked')).map(cb => cb.value);
}

function toggleConfigModal() {
    const modal = document.getElementById("configModal");
    if (modal) {
        modal.style.display = modal.style.display === "block" ? "none" : "block";
    }
}

window.onclick = function(event) {
    const modal = document.getElementById("configModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault(); 
        sendPrompt(); 
    }
}

function setupEventListeners() {
    const promptTextarea = document.getElementById("prompt");
    if (promptTextarea) {
        promptTextarea.addEventListener('keydown', handleKeyDown);
    }

    const includeRepoAnalysis = document.getElementById("includeRepoAnalysis");
    const summaryModelCheckbox = document.getElementById("summaryModel");

    if (includeRepoAnalysis) {
        includeRepoAnalysis.addEventListener('change', saveConfigToLocalStorage);
    }
    if (summaryModelCheckbox) {
        summaryModelCheckbox.addEventListener('change', saveConfigToLocalStorage);
    }
    if (summaryModelDropdown) {
        summaryModelDropdown.addEventListener('change', saveConfigToLocalStorage);
    }

    document.querySelectorAll('input[name="model"]').forEach(checkbox => {
        checkbox.addEventListener('change', saveConfigToLocalStorage);
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setColorScheme);



function setupEditableContent() {
    const promptDiv = document.getElementById("prompt");
    if (!promptDiv) return;

    let timer;
    promptDiv.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const content = this.innerText;
            this.innerHTML = marked.parse(content);
            this.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }, 300);
    });

    promptDiv.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const br = document.createElement('br');
            range.deleteContents();
            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });
}
