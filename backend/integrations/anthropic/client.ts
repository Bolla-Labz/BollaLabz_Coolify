// Last Modified: 2025-11-23 17:30
/**
 * Anthropic Claude Integration
 * AI processing for message analysis, context-aware responses, and task extraction
 */

import Anthropic from '@anthropic-ai/sdk';
import { AnthropicConfig } from '../../types';
import { retryWithBackoff } from '../../utils/retry';
import { costTracker, calculateAnthropicCost } from '../../utils/cost-tracker';
import { logger } from '../../utils/logger';

export interface AnalysisResult {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent?: string;
  topics?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export interface TaskExtraction {
  tasks: Array<{
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
  }>;
}

export class AnthropicClient {
  private client: Anthropic;
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = {
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 4096,
      temperature: 1.0,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    logger.integration('anthropic', `Client initialized (${this.config.model})`);
  }

  /**
   * Analyze a message for sentiment, intent, and topics
   */
  async analyzeMessage(message: string, context?: string[]): Promise<AnalysisResult> {
    logger.integration('anthropic', 'Analyzing message');

    const systemPrompt = `You are an expert message analyst. Analyze the given message and provide:
1. A brief summary (1-2 sentences)
2. Sentiment (positive, neutral, or negative)
3. Primary intent
4. Main topics discussed
5. Urgency level (low, medium, high)

Respond in JSON format with keys: summary, sentiment, intent, topics (array), urgency.`;

    const contextText = context && context.length > 0
      ? `Previous conversation context:\n${context.join('\n')}\n\n`
      : '';

    const response = await this.createMessage(
      `${contextText}Message to analyze:\n${message}`,
      systemPrompt
    );

    try {
      const result = JSON.parse(response);
      logger.integration('anthropic', 'Message analysis completed');
      return result;
    } catch (error) {
      logger.error('Failed to parse analysis result', error);
      return {
        summary: response,
        sentiment: 'neutral',
      };
    }
  }

  /**
   * Generate a context-aware response
   */
  async generateResponse(
    message: string,
    context?: string[],
    systemContext?: string
  ): Promise<string> {
    logger.integration('anthropic', 'Generating context-aware response');

    const defaultSystem = `You are a helpful AI assistant for BollaLabz. You help manage conversations,
tasks, and provide intelligent responses. Be concise, friendly, and professional.`;

    const systemPrompt = systemContext || defaultSystem;

    const contextText = context && context.length > 0
      ? `Previous conversation:\n${context.join('\n')}\n\n`
      : '';

    const response = await this.createMessage(
      `${contextText}Current message: ${message}\n\nProvide a helpful response:`,
      systemPrompt
    );

    logger.integration('anthropic', 'Response generated');
    return response;
  }

  /**
   * Summarize a conversation
   */
  async summarizeConversation(messages: string[]): Promise<string> {
    logger.integration('anthropic', `Summarizing conversation (${messages.length} messages)`);

    const systemPrompt = `You are a conversation summarizer. Create a concise summary of the conversation
highlighting key points, decisions made, and action items. Keep it brief but comprehensive.`;

    const conversationText = messages.join('\n\n');

    const summary = await this.createMessage(
      `Summarize this conversation:\n\n${conversationText}`,
      systemPrompt
    );

    logger.integration('anthropic', 'Conversation summarized');
    return summary;
  }

  /**
   * Extract tasks from conversation
   */
  async extractTasks(messages: string[]): Promise<TaskExtraction> {
    logger.integration('anthropic', 'Extracting tasks from conversation');

    const systemPrompt = `You are a task extraction expert. Analyze the conversation and extract any tasks,
action items, or commitments mentioned. For each task, provide a title, optional description,
estimated due date (if mentioned), and priority level.

Respond in JSON format: { "tasks": [{ "title": "...", "description": "...", "dueDate": "...", "priority": "..." }] }`;

    const conversationText = messages.join('\n\n');

    const response = await this.createMessage(
      `Extract tasks from this conversation:\n\n${conversationText}`,
      systemPrompt
    );

    try {
      const result = JSON.parse(response);
      logger.integration('anthropic', `Extracted ${result.tasks?.length || 0} tasks`);
      return result;
    } catch (error) {
      logger.error('Failed to parse task extraction result', error);
      return { tasks: [] };
    }
  }

  /**
   * Analyze sentiment of a message
   */
  async analyzeSentiment(message: string): Promise<'positive' | 'neutral' | 'negative'> {
    logger.integration('anthropic', 'Analyzing sentiment');

    const systemPrompt = `You are a sentiment analyzer. Analyze the sentiment of the given message
and respond with only one word: "positive", "neutral", or "negative".`;

    const response = await this.createMessage(message, systemPrompt);

    const sentiment = response.toLowerCase().trim();
    if (['positive', 'neutral', 'negative'].includes(sentiment)) {
      return sentiment as 'positive' | 'neutral' | 'negative';
    }

    return 'neutral';
  }

  /**
   * Core message creation method
   */
  private async createMessage(
    userMessage: string,
    systemPrompt?: string
  ): Promise<string> {
    const response = await retryWithBackoff(async () => {
      return await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });
    });

    // Track cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = calculateAnthropicCost(inputTokens, outputTokens);

    costTracker.trackCost({
      service: 'anthropic',
      type: 'ai',
      cost,
      units: inputTokens + outputTokens,
      metadata: {
        model: this.config.model,
        inputTokens,
        outputTokens,
      },
    });

    logger.cost('anthropic', cost, `${inputTokens} in + ${outputTokens} out tokens`);

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    return textContent?.type === 'text' ? textContent.text : '';
  }

  /**
   * Stream a response (for real-time use)
   */
  async *streamResponse(
    message: string,
    systemPrompt?: string
  ): AsyncGenerator<string> {
    logger.integration('anthropic', 'Streaming response');

    const stream = await this.client.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }

    // Get final usage stats
    const finalMessage = await stream.finalMessage();
    const inputTokens = finalMessage.usage.input_tokens;
    const outputTokens = finalMessage.usage.output_tokens;
    const cost = calculateAnthropicCost(inputTokens, outputTokens);

    costTracker.trackCost({
      service: 'anthropic',
      type: 'ai',
      cost,
      units: inputTokens + outputTokens,
      metadata: {
        model: this.config.model,
        inputTokens,
        outputTokens,
        streaming: true,
      },
    });

    logger.integration('anthropic', 'Streaming completed');
  }
}

/**
 * Create Anthropic client from environment variables
 */
export function createAnthropicClient(): AnthropicClient {
  const config: AnthropicConfig = {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    maxTokens: process.env.ANTHROPIC_MAX_TOKENS
      ? parseInt(process.env.ANTHROPIC_MAX_TOKENS)
      : 4096,
    temperature: process.env.ANTHROPIC_TEMPERATURE
      ? parseFloat(process.env.ANTHROPIC_TEMPERATURE)
      : 1.0,
  };

  if (!config.apiKey) {
    throw new Error('Missing required Anthropic configuration: ANTHROPIC_API_KEY');
  }

  return new AnthropicClient(config);
}
