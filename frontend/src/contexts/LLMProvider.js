import React, { createContext, useContext, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { useConfig } from './ConfigContext';
import { ANTHROPIC_BASE_URL } from '../constants';

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
  const { config } = useConfig();
  const openai = useRef(null);

  useEffect(() => {
    if (config.openaiApiKey) {
      openai.current = new OpenAI({
        apiKey: config.openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
    }
  }, [config]);

  const query = async function* (model, messages, temperature = 0.7) {
    if (!openai.current && !config.claudeApiKey) {
      throw new Error('API clients are not initialized. Please set API keys in the configuration.');
    }

    if (model.startsWith('gpt')) {
      yield* queryOpenAI(model, messages, temperature);
    } else if (model.startsWith('claude')) {
      yield* queryAnthropic(model, messages, temperature);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  };


  const queryOpenAI = async function* (model, messages, temperature) {
    if (!openai.current) {
      throw new Error('OpenAI client is not initialized. Please set OpenAI API key in the configuration.');
    }

    try {
      const stream = await openai.current.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error) {
      console.error('Error querying OpenAI:', error);
      throw error;
    }
  };

  const queryAnthropic = async function* (model, messages, temperature) {
    if (!config.claudeApiKey) {
      throw new Error('Anthropic API key is not set. Please set Claude API key in the configuration.');
    }

    try {
      const response = await fetch(ANTHROPIC_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.claudeApiKey,
          model,
          messages,
          max_tokens: 1024,
          temperature,
          stream: true,
        }),
        // Remove the credentials option
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.delta?.text) {
              yield data.delta.text;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error querying Anthropic:', error);
      throw error;
    }
  };

  return (
    <LLMContext.Provider value={{ query }}>
      {children}
    </LLMContext.Provider>
  );
};

export const useApiClients = () => {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error('useApiClients must be used within an LLMProvider');
  }
  return context;
};