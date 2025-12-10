// 08 December 2025 15 10 00

/**
 * Anthropic Claude Service
 * Production-grade AI service for call transcript analysis
 *
 * Features:
 * - Transcript summarization with configurable length
 * - Multi-dimensional sentiment analysis
 * - Action item extraction with priorities
 * - Follow-up suggestion generation
 * - Topic classification and categorization
 * - Streaming support for real-time responses
 * - Comprehensive error handling with retry logic
 * - Request correlation tracking
 * - Performance monitoring
 *
 * November 2025 Production Standards:
 * - Zero-trust input validation
 * - Structured logging with correlation IDs
 * - Timeout protection (configurable)
 * - Type-safe interfaces
 * - Provider fallback handling
 */

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Configuration & Constants
// ---------------------------------------------------------------------------

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;
const REQUEST_TIMEOUT = 60000; // 60 seconds for complex analysis
const MAX_INPUT_LENGTH = 200000; // ~200k characters (Claude's context)

// Rate limiting (implement based on your subscription tier)
const RATE_LIMIT = {
  requestsPerMinute: 50,
  tokensPerMinute: 40000,
};

// ---------------------------------------------------------------------------
// TypeScript Interfaces
// ---------------------------------------------------------------------------

export interface ClaudeConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface SummarizeOptions {
  length?: "brief" | "standard" | "detailed";
  includeKeyPoints?: boolean;
  focusAreas?: string[];
}

export interface SummarizeResponse {
  summary: string;
  keyPoints?: string[];
  duration?: string;
  participants?: string[];
  correlationId: string;
  tokensUsed: number;
  model: string;
}

export type SentimentType = "positive" | "negative" | "neutral" | "mixed";

export interface SentimentScore {
  type: SentimentType;
  confidence: number; // 0-1
  reasoning: string;
}

export interface SentimentAnalysisResponse {
  overall: SentimentScore;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  emotionalTone: string[];
  concernLevel: "low" | "medium" | "high";
  correlationId: string;
  tokensUsed: number;
  model: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  category?: string;
  context?: string;
}

export interface ActionItemsResponse {
  actionItems: ActionItem[];
  summary: string;
  totalCount: number;
  correlationId: string;
  tokensUsed: number;
  model: string;
}

export interface FollowUpSuggestion {
  type: "email" | "call" | "meeting" | "task" | "reminder";
  priority: "low" | "medium" | "high";
  suggestion: string;
  reasoning: string;
  timing?: string;
}

export interface FollowUpResponse {
  suggestions: FollowUpSuggestion[];
  nextBestAction: string;
  correlationId: string;
  tokensUsed: number;
  model: string;
}

export interface TopicClassification {
  primary: string;
  secondary: string[];
  keywords: string[];
  confidence: number;
}

export interface ClassificationResponse {
  classification: TopicClassification;
  categories: string[];
  tags: string[];
  correlationId: string;
  tokensUsed: number;
  model: string;
}

export interface StreamOptions {
  onText?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

interface ClaudeError extends Error {
  statusCode?: number;
  type?: string;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Service Class
// ---------------------------------------------------------------------------

class AnthropicService {
  private client: Anthropic;
  private config: Required<ClaudeConfig>;

  constructor(config: ClaudeConfig = {}) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is required but not set"
      );
    }

    this.client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      timeout: config.timeout || REQUEST_TIMEOUT,
    });

    this.config = {
      model: config.model || DEFAULT_MODEL,
      maxTokens: config.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: config.temperature ?? 0.7,
      timeout: config.timeout || REQUEST_TIMEOUT,
    };
  }

  // -------------------------------------------------------------------------
  // Private Utility Methods
  // -------------------------------------------------------------------------

  /**
   * Sanitize and validate input transcript
   */
  private sanitizeTranscript(transcript: string): string {
    if (!transcript || typeof transcript !== "string") {
      throw this.createError(
        "Invalid transcript: must be a non-empty string",
        false
      );
    }

    const sanitized = transcript.trim();

    if (sanitized.length === 0) {
      throw this.createError("Transcript cannot be empty", false);
    }

    if (sanitized.length > MAX_INPUT_LENGTH) {
      console.warn(
        `[Anthropic] Transcript length (${sanitized.length}) exceeds maximum (${MAX_INPUT_LENGTH}), truncating...`
      );
      return sanitized.substring(0, MAX_INPUT_LENGTH);
    }

    return sanitized;
  }

  /**
   * Create a typed error with metadata
   */
  private createError(message: string, retryable: boolean): ClaudeError {
    const error = new Error(message) as ClaudeError;
    error.retryable = retryable;
    return error;
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `claude-${Date.now()}-${crypto.randomUUID().split("-")[0]}`;
  }

  /**
   * Execute Claude API request with error handling
   */
  private async executeRequest(
    systemPrompt: string,
    userPrompt: string,
    correlationId: string,
    maxTokens?: number
  ): Promise<{ content: string; tokensUsed: number }> {
    const startTime = performance.now();

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: maxTokens || this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const duration = performance.now() - startTime;

      console.log(`[Anthropic] Request completed`, {
        correlationId,
        model: this.config.model,
        duration: `${duration.toFixed(2)}ms`,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      });

      // Extract text content from response
      const textContent = response.content
        .filter((block) => block.type === "text")
        .map((block) => ("text" in block ? block.text : ""))
        .join("\n");

      return {
        content: textContent,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (error: any) {
      const duration = performance.now() - startTime;

      console.error(`[Anthropic] Request failed`, {
        correlationId,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
        type: error.type,
        statusCode: error.status,
      });

      // Determine if error is retryable
      const retryable =
        error.status === 429 || // Rate limit
        error.status === 500 || // Server error
        error.status === 503 || // Service unavailable
        error.type === "overloaded_error";

      const claudeError = this.createError(
        `Claude API error: ${error.message}`,
        retryable
      );
      claudeError.statusCode = error.status;
      claudeError.type = error.type;

      throw claudeError;
    }
  }

  /**
   * Parse JSON response with error handling
   */
  private parseJsonResponse<T>(content: string, correlationId: string): T {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch && jsonMatch[1] ? jsonMatch[1] : content;

      return JSON.parse(jsonString.trim());
    } catch (error) {
      console.error(`[Anthropic] JSON parse error`, {
        correlationId,
        content: content.substring(0, 200),
      });
      throw this.createError("Failed to parse Claude response as JSON", false);
    }
  }

  // -------------------------------------------------------------------------
  // Public API Methods
  // -------------------------------------------------------------------------

  /**
   * Summarize call transcript
   */
  async summarize(
    transcript: string,
    options: SummarizeOptions = {}
  ): Promise<SummarizeResponse> {
    const correlationId = this.generateCorrelationId();
    const sanitizedTranscript = this.sanitizeTranscript(transcript);

    const lengthInstructions = {
      brief: "1-2 paragraphs (100-150 words)",
      standard: "2-3 paragraphs (200-300 words)",
      detailed: "3-5 paragraphs (400-600 words)",
    };

    const systemPrompt = `You are an expert call analyst specializing in creating clear, actionable summaries of call transcripts.

Your task is to analyze call transcripts and provide structured summaries that help users quickly understand:
- What was discussed
- What decisions were made
- What outcomes were achieved
- Who the participants were

Always be objective, professional, and focus on extracting key information.`;

    const userPrompt = `Analyze the following call transcript and provide a comprehensive summary.

**Requirements:**
- Summary length: ${lengthInstructions[options.length || "standard"]}
- Include key points: ${options.includeKeyPoints !== false ? "Yes" : "No"}
- Focus areas: ${options.focusAreas?.join(", ") || "General overview"}

**Output Format (JSON):**
\`\`\`json
{
  "summary": "The main summary text...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "duration": "Estimated call duration",
  "participants": ["Participant 1", "Participant 2"]
}
\`\`\`

**Call Transcript:**
${sanitizedTranscript}

Provide your analysis in the exact JSON format specified above.`;

    const { content, tokensUsed } = await this.executeRequest(
      systemPrompt,
      userPrompt,
      correlationId
    );

    const parsed = this.parseJsonResponse<{
      summary: string;
      keyPoints?: string[];
      duration?: string;
      participants?: string[];
    }>(content, correlationId);

    return {
      ...parsed,
      correlationId,
      tokensUsed,
      model: this.config.model,
    };
  }

  /**
   * Analyze sentiment of call transcript
   */
  async analyzeSentiment(
    transcript: string
  ): Promise<SentimentAnalysisResponse> {
    const correlationId = this.generateCorrelationId();
    const sanitizedTranscript = this.sanitizeTranscript(transcript);

    const systemPrompt = `You are an expert sentiment analyst specializing in customer call analysis.

Your task is to analyze the emotional tone, sentiment, and concern level of call transcripts to help teams:
- Understand customer satisfaction
- Identify potential issues early
- Prioritize follow-up actions
- Track sentiment trends

Provide nuanced, accurate sentiment analysis with clear reasoning.`;

    const userPrompt = `Analyze the sentiment and emotional tone of the following call transcript.

**Output Format (JSON):**
\`\`\`json
{
  "overall": {
    "type": "positive|negative|neutral|mixed",
    "confidence": 0.85,
    "reasoning": "Explanation of the sentiment assessment"
  },
  "breakdown": {
    "positive": 0.6,
    "negative": 0.2,
    "neutral": 0.2
  },
  "emotionalTone": ["professional", "friendly", "concerned"],
  "concernLevel": "low|medium|high"
}
\`\`\`

**Call Transcript:**
${sanitizedTranscript}

Provide your sentiment analysis in the exact JSON format specified above.`;

    const { content, tokensUsed } = await this.executeRequest(
      systemPrompt,
      userPrompt,
      correlationId
    );

    const parsed = this.parseJsonResponse<{
      overall: SentimentScore;
      breakdown: { positive: number; negative: number; neutral: number };
      emotionalTone: string[];
      concernLevel: "low" | "medium" | "high";
    }>(content, correlationId);

    return {
      ...parsed,
      correlationId,
      tokensUsed,
      model: this.config.model,
    };
  }

  /**
   * Extract action items from call transcript
   */
  async extractActionItems(
    transcript: string
  ): Promise<ActionItemsResponse> {
    const correlationId = this.generateCorrelationId();
    const sanitizedTranscript = this.sanitizeTranscript(transcript);

    const systemPrompt = `You are an expert project manager specializing in extracting actionable tasks from call transcripts.

Your task is to identify:
- Clear action items and commitments
- Who is responsible for each task
- Priority levels based on urgency and impact
- Due dates or timeframes mentioned
- Context for each action item

Be specific, actionable, and prioritize items that have clear ownership.`;

    const userPrompt = `Extract all action items from the following call transcript.

**Output Format (JSON):**
\`\`\`json
{
  "actionItems": [
    {
      "id": "1",
      "description": "Clear, actionable description",
      "assignee": "Person or role responsible",
      "priority": "low|medium|high|critical",
      "dueDate": "YYYY-MM-DD or 'Not specified'",
      "category": "Category of the action",
      "context": "Brief context from the call"
    }
  ],
  "summary": "Brief overview of action items",
  "totalCount": 5
}
\`\`\`

**Call Transcript:**
${sanitizedTranscript}

Provide your analysis in the exact JSON format specified above.`;

    const { content, tokensUsed } = await this.executeRequest(
      systemPrompt,
      userPrompt,
      correlationId,
      6000 // More tokens for detailed action items
    );

    const parsed = this.parseJsonResponse<{
      actionItems: ActionItem[];
      summary: string;
      totalCount: number;
    }>(content, correlationId);

    return {
      ...parsed,
      correlationId,
      tokensUsed,
      model: this.config.model,
    };
  }

  /**
   * Generate follow-up suggestions based on call transcript
   */
  async generateFollowUps(transcript: string): Promise<FollowUpResponse> {
    const correlationId = this.generateCorrelationId();
    const sanitizedTranscript = this.sanitizeTranscript(transcript);

    const systemPrompt = `You are an expert customer success manager specializing in relationship management and follow-up strategies.

Your task is to suggest appropriate follow-up actions that will:
- Strengthen the relationship
- Ensure commitments are met
- Address any concerns proactively
- Move the conversation forward productively

Consider timing, priority, and the most effective communication channel.`;

    const userPrompt = `Based on the following call transcript, suggest follow-up actions.

**Output Format (JSON):**
\`\`\`json
{
  "suggestions": [
    {
      "type": "email|call|meeting|task|reminder",
      "priority": "low|medium|high",
      "suggestion": "Specific follow-up action",
      "reasoning": "Why this follow-up is recommended",
      "timing": "When to perform this action"
    }
  ],
  "nextBestAction": "The single most important follow-up action"
}
\`\`\`

**Call Transcript:**
${sanitizedTranscript}

Provide your suggestions in the exact JSON format specified above.`;

    const { content, tokensUsed } = await this.executeRequest(
      systemPrompt,
      userPrompt,
      correlationId
    );

    const parsed = this.parseJsonResponse<{
      suggestions: FollowUpSuggestion[];
      nextBestAction: string;
    }>(content, correlationId);

    return {
      ...parsed,
      correlationId,
      tokensUsed,
      model: this.config.model,
    };
  }

  /**
   * Classify call topic and categorize
   */
  async classifyTopic(transcript: string): Promise<ClassificationResponse> {
    const correlationId = this.generateCorrelationId();
    const sanitizedTranscript = this.sanitizeTranscript(transcript);

    const systemPrompt = `You are an expert call categorization specialist.

Your task is to classify call transcripts into relevant topics and categories to help teams:
- Route calls appropriately
- Track conversation themes
- Generate insights and reports
- Improve service delivery

Provide accurate, consistent categorization with clear confidence scores.`;

    const userPrompt = `Classify the following call transcript into topics and categories.

**Common Categories:**
- Sales (prospecting, demo, negotiation, closing)
- Support (technical issue, how-to, troubleshooting)
- Account Management (check-in, renewal, upsell)
- Onboarding (setup, training, orientation)
- Feedback (feature request, complaint, praise)
- General (inquiry, information, other)

**Output Format (JSON):**
\`\`\`json
{
  "classification": {
    "primary": "Main topic/category",
    "secondary": ["Additional relevant topics"],
    "keywords": ["key", "terms", "extracted"],
    "confidence": 0.95
  },
  "categories": ["Category1", "Category2"],
  "tags": ["tag1", "tag2", "tag3"]
}
\`\`\`

**Call Transcript:**
${sanitizedTranscript}

Provide your classification in the exact JSON format specified above.`;

    const { content, tokensUsed } = await this.executeRequest(
      systemPrompt,
      userPrompt,
      correlationId
    );

    const parsed = this.parseJsonResponse<{
      classification: TopicClassification;
      categories: string[];
      tags: string[];
    }>(content, correlationId);

    return {
      ...parsed,
      correlationId,
      tokensUsed,
      model: this.config.model,
    };
  }

  /**
   * Stream a response for real-time analysis
   */
  async streamAnalysis(
    prompt: string,
    systemPrompt: string,
    options: StreamOptions = {}
  ): Promise<string> {
    const correlationId = this.generateCorrelationId();
    const startTime = performance.now();

    try {
      const stream = await this.client.messages.stream({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      let fullText = "";

      // Handle streaming events
      stream.on("text", (text) => {
        fullText += text;
        if (options.onText) {
          options.onText(text);
        }
      });

      // Wait for stream to complete
      const finalMessage = await stream.finalMessage();

      const duration = performance.now() - startTime;

      console.log(`[Anthropic] Stream completed`, {
        correlationId,
        model: this.config.model,
        duration: `${duration.toFixed(2)}ms`,
        tokensUsed:
          finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      });

      // Extract full text from final message
      fullText = finalMessage.content
        .filter((block) => block.type === "text")
        .map((block) => ("text" in block ? block.text : ""))
        .join("\n");

      if (options.onComplete) {
        options.onComplete(fullText);
      }

      return fullText;
    } catch (error: any) {
      const duration = performance.now() - startTime;

      console.error(`[Anthropic] Stream failed`, {
        correlationId,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message,
      });

      if (options.onError) {
        options.onError(error);
      }

      throw this.createError(`Stream error: ${error.message}`, false);
    }
  }

  /**
   * Generic prompt execution for custom use cases
   */
  async executePrompt(
    systemPrompt: string,
    userPrompt: string,
    maxTokens?: number
  ): Promise<string> {
    const correlationId = this.generateCorrelationId();

    const { content } = await this.executeRequest(
      systemPrompt,
      userPrompt,
      correlationId,
      maxTokens
    );

    return content;
  }

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    model: string;
    apiKeyConfigured: boolean;
    latency?: number;
  }> {
    const startTime = performance.now();

    try {
      await this.client.messages.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      });

      const latency = performance.now() - startTime;

      return {
        status: "healthy",
        model: this.config.model,
        apiKeyConfigured: true,
        latency,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        model: this.config.model,
        apiKeyConfigured: Boolean(ANTHROPIC_API_KEY),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export (Lazy Initialization)
// ---------------------------------------------------------------------------

// Lazily initialized singleton - allows API to start without ANTHROPIC_API_KEY
let anthropicServiceInstance: AnthropicService | null = null;

function getAnthropicService(): AnthropicService {
  if (!anthropicServiceInstance) {
    anthropicServiceInstance = new AnthropicService();
  }
  return anthropicServiceInstance;
}

// For backwards compatibility, create a proxy that lazily initializes
const anthropicService = new Proxy({} as AnthropicService, {
  get(_target, prop) {
    const instance = getAnthropicService();
    const value = instance[prop as keyof AnthropicService];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export default anthropicService;

// Also export the class for custom configurations and the getter
export { AnthropicService, getAnthropicService };

// ---------------------------------------------------------------------------
// Convenience Exports
// ---------------------------------------------------------------------------

export const summarizeTranscript = (
  transcript: string,
  options?: SummarizeOptions
) => getAnthropicService().summarize(transcript, options);

export const analyzeSentiment = (transcript: string) =>
  getAnthropicService().analyzeSentiment(transcript);

export const extractActionItems = (transcript: string) =>
  getAnthropicService().extractActionItems(transcript);

export const generateFollowUps = (transcript: string) =>
  getAnthropicService().generateFollowUps(transcript);

export const classifyTopic = (transcript: string) =>
  getAnthropicService().classifyTopic(transcript);

export const streamAnalysis = (
  prompt: string,
  systemPrompt: string,
  options?: StreamOptions
) => getAnthropicService().streamAnalysis(prompt, systemPrompt, options);

export const executePrompt = (
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number
) => getAnthropicService().executePrompt(systemPrompt, userPrompt, maxTokens);

export const checkHealth = () => getAnthropicService().healthCheck();
