// static/js/config.js

// Config object to manage application configuration
const Config = {
    // Default configuration values
    config: {
        includeRepoAnalysis: true,  // Whether to include repository analysis
        summaryModel: false,        // Whether to use summary model
        summaryModelValue: ''       // The selected summary model (if any)
    },

    /**
     * Initializes the configuration by fetching default models from the server
     * @async
     */
    async initializeConfig() {
        console.log('Config: Initializing configuration...');
        try {
            // Fetch models data from the server
            const response = await fetch('/models');
            const data = await response.json();
            
            // Set default models and default summary model in the config
            this.config.defaultModels = data.default;
            this.config.defaultSummaryModel = data.default_summary_model;

            // Set checked models to default models if not already set
            if (!this.config.checkedModels || this.config.checkedModels.length === 0) {
                this.config.checkedModels = data.default;
            }
            
            console.log('Config: Configuration initialized successfully', this.config);
        } catch (error) {
            console.error('Config: Error initializing configuration', error);
        }
    },

    /**
     * Loads configuration from localStorage and applies it
     */
    loadConfigFromLocalStorage() {
        console.log('Config: Loading configuration from localStorage...');
        // Attempt to retrieve saved configuration from localStorage
        const savedConfig = localStorage.getItem('config');
        if (savedConfig) {
            // If saved config exists, parse it and merge with current config
            const parsedConfig = JSON.parse(savedConfig);
            this.config = { ...this.config, ...parsedConfig };
            
            console.log('Config: Loaded configuration from localStorage', this.config);
            
            // Apply the loaded configuration to the UI
            this.applyConfig();
        } else {
            console.log('Config: No saved configuration found in localStorage');
        }
    },

    /**
     * Saves the current configuration to localStorage
     */
    saveConfigToLocalStorage() {
        console.log('Config: Saving configuration to localStorage...', this.config);
        localStorage.setItem('config', JSON.stringify(this.config));
        console.log('Config: Configuration saved to localStorage');
    },

    /**
     * Returns a copy of the current configuration
     * @returns {Object} A copy of the current config
     */
    getConfig() {
        console.log('Config: Getting current configuration');
        // Return a shallow copy to prevent direct external modifications
        return { ...this.config };
    },

    /**
     * Updates the configuration with new values
     * @param {Object} newConfig - The new configuration values
     */
    updateConfig(newConfig) {
        console.log('Config: Updating configuration...', newConfig);
        // Merge the new config with the existing config
        this.config = { ...this.config, ...newConfig };
        
        console.log('Config: Configuration updated', this.config);
        
        // Save the updated config to localStorage
        this.saveConfigToLocalStorage();
        
        // Apply the new configuration to the UI
        this.applyConfig();
    },

    /**
     * Applies the current configuration to the UI elements
     */
    applyConfig() {
        console.log('Config: Applying configuration to UI...');
        
        // Set the state of the repository analysis checkbox
        const includeRepoAnalysisCheckbox = document.getElementById("includeRepoAnalysis");
        if (includeRepoAnalysisCheckbox) {
            includeRepoAnalysisCheckbox.checked = this.config.includeRepoAnalysis;
            console.log('Config: Set includeRepoAnalysis to', this.config.includeRepoAnalysis);
        } else {
            console.warn('Config: includeRepoAnalysis element not found');
        }
        
        // Set the state of the summary model checkbox
        const summaryModelCheckbox = document.getElementById("summaryModel");
        if (summaryModelCheckbox) {
            summaryModelCheckbox.checked = this.config.summaryModel;
            console.log('Config: Set summaryModel to', this.config.summaryModel);
        } else {
            console.warn('Config: summaryModel element not found');
        }
        
        // If a summary model is selected, set it in the dropdown
        if (this.config.summaryModelValue) {
            const summaryModelDropdown = document.getElementById("summaryModelDropdown");
            if (summaryModelDropdown) {
                summaryModelDropdown.value = this.config.summaryModelValue;
                console.log('Config: Set summaryModelValue to', this.config.summaryModelValue);
            } else {
                console.warn('Config: summaryModelDropdown element not found');
            }
        }
        
        // Set the checked state of model checkboxes based on the config
        const modelCheckboxes = document.querySelectorAll('input[name="model"]');
        if (modelCheckboxes.length > 0) {
            modelCheckboxes.forEach(checkbox => {
                checkbox.checked = this.config.checkedModels.includes(checkbox.value);
                console.log(`Config: Set model checkbox ${checkbox.value} to ${checkbox.checked}`);
            });
            UI.createModelColumns();
        } else {
            console.warn('Config: No model checkboxes found');
        }

        console.log('Config: Configuration applied to UI');
    }
};

console.log('Config: Configuration management system loaded');