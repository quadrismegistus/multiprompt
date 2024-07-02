import React, { createContext, useContext, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { useConfig } from './ConfigContext';

const LLMContext = createContext(null);

export const LLMProvider = ({ children }) => {
  const { config } = useConfig();
  const openai = useRef(null);
  const anthropic = useRef(null);

  useEffect(() => {
    if (config.openaiApiKey) {
      openai.current = new OpenAI({
        apiKey: config.openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
    }
    if (config.claudeApiKey) {
      anthropic.current = new Anthropic({
        apiKey: config.claudeApiKey,
      });
    }
  }, [config]);

  const query = async function* (model, messages, temperature = 0.7) {
    if (!openai.current && !anthropic.current) {
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
    if (!anthropic.current) {
      throw new Error('Anthropic client is not initialized. Please set Claude API key in the configuration.');
    }

    try {
      // Extract system message if present
      const systemMessage = messages.find(msg => msg.role === 'system');
      const userMessages = messages.filter(msg => msg.role !== 'system');

      const streamParams = {
        model: model,
        messages: userMessages,
        temperature: temperature,
        max_tokens: 1024,
        stream: true,
      };

      // Add system message if present
      if (systemMessage) {
        streamParams.system = systemMessage.content;
      }

      const stream = await anthropic.current.messages.create(streamParams);

      for await (const chunk of stream) {
        if (chunk.delta?.text) {
          yield chunk.delta.text;
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