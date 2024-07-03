async function initializeApp() {
    console.log('Main: Initializing application...');
    try {
        console.log('Main: Initializing configuration...');
        await Config.initializeConfig();
        console.log('Main: Configuration initialized successfully');

        console.log('Main: Initializing models...');
        await Models.initializeModels();
        console.log('Main: Models initialized successfully');

        console.log('Main: Setting up UI...');
        UI.setupUI();
        console.log('Main: UI setup complete');

        console.log('Main: Loading configuration from local storage...');
        Config.loadConfigFromLocalStorage();
        console.log('Main: Configuration loaded');

        console.log('Main: Setting up WebSocket...');
        WebSocketHandler.setupWebSocket();
        console.log('Main: WebSocket setup complete');

        console.log('Main: Application initialization complete');
    } catch (error) {
        console.error('Main: Error during application initialization', error);
    }
}function sendPrompt() {
    console.log('Main: Attempting to send prompt...');
    const prompt = document.getElementById("prompt")?.innerText;
    const checkedModels = UI.getCheckedModels();
    const config = Config.getConfig();
    console.log('Main: Prompt:', prompt);
    console.log('Main: Checked models:', checkedModels);
    console.log('Main: Current config:', config);

    if (!prompt) {
        console.error('Main: Prompt is empty');
        alert("Please enter a prompt before sending.");
        return;
    }

    if (checkedModels.length === 0) {
        console.error('Main: No models selected');
        alert("Please select at least one model before sending.");
        return;
    }

    localStorage.setItem('prompt', prompt);
    UI.saveSystemPromptsToLocalStorage();
    const systemPrompts = UI.getSystemPrompts();

    const columns = document.querySelectorAll('.model-output');
    const columnConfigs = {};
    columns.forEach(column => {
        const model = column.dataset.model;
        if (!model) {
            console.warn(`Main: Column missing model data attribute`, column);
            return;
        }
        columnConfigs[model] = {
            systemPrompt: column.dataset.systemPrompt || '',
            temperature: parseFloat(column.dataset.temperature) || 0.7
        };
    });

    const message = {
        prompt: prompt,
        checked_models: checkedModels,
        system_prompts: systemPrompts,
        column_configs: columnConfigs,
        ...config
    };

    console.log('Main: Sending message:', message);
    
    try {
        WebSocketHandler.sendMessage(message);
    } catch (error) {
        console.error('Main: Error sending message via WebSocket', error);
        alert("An error occurred while sending the prompt. Please try again.");
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('Main: DOM content loaded, initializing app...');
    initializeApp();
    // Load prompt and system prompts from localStorage
    const savedPrompt = localStorage.getItem('prompt');
    if (savedPrompt) {
        document.getElementById("prompt").innerText = savedPrompt;
    }
    UI.loadSystemPromptsFromLocalStorage();
});

// Make sendPrompt globally accessible
window.sendPrompt = sendPrompt;

console.log('Main: Main script loaded');