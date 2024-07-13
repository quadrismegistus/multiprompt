# Ballitore Project

Welcome to the repository for the Ballitore Project. This project provides tools and methodologies for analyzing and visualizing historical correspondences and metadata from the Ballitore Collection.

## Table of Contents

- [Project Overview](#project-overview)
- [Directory Structure](#directory-structure)
- [Installation](#installation)
- [Usage](#usage)
    - [Topic Modeling](#topic-modeling)
    - [Geography](#geography)
    - [Networks](#networks)
    - [Utilities](#utilities)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Ballitore Project is a comprehensive suite of tools designed to facilitate the analysis of historical texts from the Ballitore Collection. The project includes modules for topic modeling, named entity recognition (NER), geographic data handling, network analysis, and various utilities.

## Directory Structure

```
└── ballitoreproject
    ├── ballitoreproject.py  # Main module for data handling and preprocessing
    ├── geography.py         # Module for named entity recognition and geolocation
    ├── imports.py           # Common imports and constants
    ├── networks.py          # Module for network analysis and visualization
    ├── topicmodels.py       # Module for topic modeling
    └── utils.py             # Utility functions
```

## Installation

To install the necessary dependencies for the Ballitore Project, you can use the following command:

```bash
pip install -r requirements.txt
```

## Usage

### Topic Modeling

The `topicmodels.py` module provides classes for different types of topic models, including Tomotopy and BERTopic models.

#### Example

```python
from ballitoreproject.topicmodels import TopicModel

# Load your data
data = get_data()

# Initialize a topic model
topic_model = TopicModel(data, model_type='tomotopy')

# Train the model
topic_model.model()

# Visualize the topics
topic_model.visualize_topics()
```

### Geography

The `geography.py` module provides functions for named entity recognition and geolocation.

#### Example

```python
from ballitoreproject.geography import get_named_places_for_id, get_place_data

# Get named places for a specific document ID
places = get_named_places_for_id('document_id')

# Get geolocation data for a place
place_data = get_place_data('Dublin')
```

### Networks

The `networks.py` module provides functions for network analysis and visualization.

#### Example

```python
from ballitoreproject.networks import get_correspondence_network, plot_network

# Get the correspondence network
network = get_correspondence_network()

# Plot the network
plot_network(network)
```

### Utilities

The `utils.py` module provides various utility functions, such as text tokenization and Excel file writing.

#### Example

```python
from ballitoreproject.utils import tokenize, write_excel

# Tokenize text
tokens = tokenize("This is an example text.")

# Write a DataFrame to an Excel file
write_excel(dataframe, 'output.xlsx')
```

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.