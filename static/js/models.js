const Models = {
    models: {},     
    modelDict: {},  
    async initializeModels() {
        console.log('Models: Initializing models...');
        try {
            const response = await fetch('/models');
            const data = await response.json();
            this.models = data.available;
            console.log('Models: Fetched available models', this.models);
            this.setupModelSelection();
            this.setupSummaryModelDropdown(data.default_summary_model);
            console.log('Models: Models initialized successfully');
        } catch (error) {
            console.error('Models: Error initializing models', error);
        }
    },
    setupModelSelection() {
        console.log('Models: Setting up model selection...');
        const selectionDiv = document.getElementById('modelSelection');
        if (!selectionDiv) {
            console.warn('Models: Model selection div not found');
            return;
        }
        Object.keys(this.models).forEach(category => {
            console.log(`Models: Setting up category: ${category}`);
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'model-category';
            categoryDiv.innerHTML = `<h4>${category}</h4>`;
            this.models[category].forEach(model => {
                const checkbox = document.createElement('div');
                checkbox.className = 'model-checkbox';
                checkbox.innerHTML = `
                    <input type="checkbox" id="${model.value}" name="model" value="${model.value}">
                    <label for="${model.value}">${model.name}</label>
                `;
                categoryDiv.appendChild(checkbox);
                this.modelDict[model.value] = model.name;
                console.log(`Models: Added model: ${model.name} (${model.value})`);
            });
            selectionDiv.appendChild(categoryDiv);
        });
        console.log('Models: Model selection setup complete');
    },
    setupSummaryModelDropdown(defaultSummaryModel) {
        console.log('Models: Setting up summary model dropdown...');
        const summaryModelDropdown = document.getElementById('summaryModelDropdown');
        if (!summaryModelDropdown) {
            console.warn('Models: Summary model dropdown not found');
            return;
        }
        summaryModelDropdown.innerHTML = '';
        Object.values(this.models).flat().forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.name;
            if (model.value === defaultSummaryModel) {
                option.selected = true;
                console.log(`Models: Default summary model set to ${model.name}`);
            }
            summaryModelDropdown.appendChild(option);
        });
        console.log('Models: Summary model dropdown setup complete');
    },
    populateColumnModelDropdown(dropdown) {
        console.log('Models: Populating column model dropdown...');
        dropdown.innerHTML = '';
        Object.values(this.models).flat().forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.name;
            dropdown.appendChild(option);
        });
        console.log('Models: Column model dropdown populated');
    },
    getModelDict() {
        console.log('Models: Retrieving model dictionary');
        return { ...this.modelDict };
    }
};
console.log('Models: Model management system loaded');