# multiprompt

multiprompt is a utility that prompts multiple Language Learning Models (LLMs) in parallel and streams their outputs side by side in columns on a simple web page.

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/multiprompt.git
   cd multiprompt
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required dependencies:
   ```
   pip install -U pip wheel
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the root directory and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_cohere_api_key
   ```

5. Run the FastAPI server:
   ```
   uvicorn main:app --reload
   ```

6. Open a web browser and navigate to `http://localhost:8000`.

## Usage

Enter a prompt in the input field and click "Send". The responses from different LLMs will be streamed in real-time and displayed side by side in columns.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.