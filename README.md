# multiprompt

multiprompt is a utility that prompts multiple Language Learning Models (LLMs) in parallel and streams their outputs side by side in columns on a desktop application. It also provides a Python library for direct usage in scripts and notebooks.

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/multiprompt.git
   cd multiprompt
   ```

2. Install dependencies:
   ```
   pip install -e .
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   ```

## Usage

### Desktop Application

To run the desktop application:

```
npm run tauri dev
```

Enter a prompt in the input field and click "Send". The responses from different LLMs will be streamed in real-time and displayed side by side in columns.

### Python Library

You can also use multiprompt directly in Python scripts or notebooks. Here are some examples:

1. Creating a conversation with multiple agents:

```python
from multiprompt import Conversation, Agent

# Create a conversation with multiple agents
convo = Conversation(agents=['GPT-4o', 'Claude-3.5-Sonnet', 'Gemini-1.5-Pro'])

# Add a round to the conversation
round = convo.add_round("What is the meaning of life?")

# Run the conversation and get the results
results = convo.run()

# Show the results (as dataframe)
results
```

Output:

<div>

<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th>text</th>
    </tr>
    <tr>
      <th>conversation</th>
      <th>round</th>
      <th>position</th>
      <th>agent</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th rowspan="3" valign="top">0e40bf0c-59aa-4f39-b5e7-8603a9533c03</th>
      <th rowspan="3" valign="top">1</th>
      <th>0</th>
      <th>User</th>
      <td>Tell me a joke. Judge any jokes already told.</td>
    </tr>
    <tr>
      <th>1</th>
      <th>GPT-4o</th>
      <td>Sure, here's a joke for you:\n\nWhy don't scie...</td>
    </tr>
    <tr>
      <th>2</th>
      <th>Claude-3.5-Sonnet</th>
      <td>That's a classic science joke! The humor comes...</td>
    </tr>
  </tbody>
</table>
</div>

2. Using custom agents:

```python
from multiprompt import AlgorithmicAgent, Conversation

# agent 1
xml_researcher = Agent(system_prompt="""Annotate this news article for entities in the form <ENT id="Person1">Ryan</ENT>""")

# agent 2
class Redacter(AlgorithmicAgent):
    def run(self, messages):
        # get last message in convo
        txt = messages.get_last_message_txt()
        # convert to xml
        dom = bs4.BeautifulSoup(txt)
        # Replace all XML tags with their ID attribute
        for tag in dom.find_all():
            if tag.has_attr('id'):
                tag.replace_with(tag['id'])
        
        # Convert the modified DOM back to text
        redacted_text = dom.text
        return redacted_text

# Create a conversation with custom agents
convo = Conversation(agents=[xml_researcher, Redacter()])

# Add a round and run the conversation
round = convo.add_round("Analyze and redact this news article: ...")
results = convo.run()
```

For more examples and detailed usage, please refer to the notebooks in the `notebooks/` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GNU General Public License v3.0.