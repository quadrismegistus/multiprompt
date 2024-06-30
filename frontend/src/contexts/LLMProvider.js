import React, { useEffect, useRef, useContext } from 'react';
import OpenAI from 'openai';
import Claude from 'claude-ai';
import { ConfigContext } from '../contexts/ConfigContext';

const useApiClients = () => {
  const { config } = useContext(ConfigContext);
  const openai = useRef(null);
  const claude = useRef(null);

  useEffect(() => {
    if (config.openaiApiKey) {
      openai.current = new OpenAI({
        apiKey: config.openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
    }
    if (config.claudeApiKey) {
      claude.current = new Claude(config.claudeApiKey);
    }
  }, [config]);

  const query = async function* (model, messages) {
    if (!openai.current && !claude.current) {
      throw new Error('API clients are not initialized. Please set API keys in the configuration.');
    }

    if (model.startsWith('gpt')) {
      yield* queryOpenAI(model, messages);
    } else if (model.startsWith('claude')) {
      yield* queryClaude(model, messages);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  };

  const queryOpenAI = async function* (model, messages) {
    if (!openai.current) {
      throw new Error('OpenAI client is not initialized. Please set OpenAI API key in the configuration.');
    }

    try {
      const stream = await openai.current.chat.completions.create({
        model: model,
        messages: messages,
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

  const queryClaude = async function* (model, messages) {
    if (!claude.current) {
      throw new Error('Claude client is not initialized. Please set Claude API key in the configuration.');
    }

    try {
      const conversation = await claude.current.startConversation({
        model,
      });

      const fullPrompt = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');

      const response = await conversation.sendMessage(fullPrompt, {
        stream: true,
      });

      for await (const chunk of response) {
        if (chunk.completion) {
          yield chunk.completion;
        }
      }
    } catch (error) {
      console.error('Error querying Claude:', error);
      throw error;
    }
  };

  return { query };
};

export { useApiClients };
