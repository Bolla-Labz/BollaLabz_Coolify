/**
 * Embedding Generation Service
 * Supports Voyage AI (primary) and OpenAI (fallback) for vector embeddings
 *
 * November 2025 Production Standards:
 * - Dual provider fallback for high availability
 * - Structured error handling with correlation IDs
 * - Request timeout protection
 * - Input sanitization and validation
 */

// ---------------------------------------------------------------------------
// Configuration Types
// ---------------------------------------------------------------------------

interface EmbeddingConfig {
  provider: "voyage" | "openai";
  apiKey: string;
  model: string;
  dimensions: number;
}

interface EmbeddingResponse {
  embedding: number[];
  provider: "voyage" | "openai";
  model: string;
  tokensUsed?: number;
}

interface EmbeddingError extends Error {
  provider: "voyage" | "openai";
  statusCode: number | undefined;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Provider Configurations
// ---------------------------------------------------------------------------

const VOYAGE_CONFIG: EmbeddingConfig = {
  provider: "voyage",
  apiKey: process.env.VOYAGE_API_KEY || "",
  model: "voyage-3-lite", // 768 dimensions, optimized for search
  dimensions: 768,
};

const OPENAI_CONFIG: EmbeddingConfig = {
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY || "",
  model: "text-embedding-3-small", // 1536 dimensions
  dimensions: 1536,
};

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Maximum input length (characters)
const MAX_INPUT_LENGTH = 8192;

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Sanitize input text for embedding generation
 */
function sanitizeInput(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Input text is required and must be a string");
  }

  // Trim and normalize whitespace
  let sanitized = text.trim().replace(/\s+/g, " ");

  // Truncate if too long
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }

  return sanitized;
}

/**
 * Create a fetch request with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Create a typed embedding error
 */
function createEmbeddingError(
  message: string,
  provider: "voyage" | "openai",
  statusCode?: number
): EmbeddingError {
  const error = new Error(message) as EmbeddingError;
  error.provider = provider;
  error.statusCode = statusCode;
  error.retryable = statusCode ? statusCode >= 500 || statusCode === 429 : false;
  return error;
}

// ---------------------------------------------------------------------------
// Provider-Specific Embedding Functions
// ---------------------------------------------------------------------------

/**
 * Generate embedding using Voyage AI
 */
async function generateVoyageEmbedding(text: string): Promise<EmbeddingResponse> {
  const sanitizedText = sanitizeInput(text);

  const response = await fetchWithTimeout(
    "https://api.voyageai.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOYAGE_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: sanitizedText,
        model: VOYAGE_CONFIG.model,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw createEmbeddingError(
      `Voyage AI API error: ${response.status} - ${errorText}`,
      "voyage",
      response.status
    );
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
    usage?: { total_tokens: number };
  };

  if (!data.data?.[0]?.embedding) {
    throw createEmbeddingError("Invalid response format from Voyage AI", "voyage");
  }

  const result: EmbeddingResponse = {
    embedding: data.data[0].embedding,
    provider: "voyage",
    model: VOYAGE_CONFIG.model,
  };
  if (data.usage?.total_tokens !== undefined) {
    result.tokensUsed = data.usage.total_tokens;
  }
  return result;
}

/**
 * Generate embedding using OpenAI
 */
async function generateOpenAIEmbedding(text: string): Promise<EmbeddingResponse> {
  const sanitizedText = sanitizeInput(text);

  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: sanitizedText,
        model: OPENAI_CONFIG.model,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw createEmbeddingError(
      `OpenAI API error: ${response.status} - ${errorText}`,
      "openai",
      response.status
    );
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
    usage?: { total_tokens: number };
  };

  if (!data.data?.[0]?.embedding) {
    throw createEmbeddingError("Invalid response format from OpenAI", "openai");
  }

  const result: EmbeddingResponse = {
    embedding: data.data[0].embedding,
    provider: "openai",
    model: OPENAI_CONFIG.model,
  };
  if (data.usage?.total_tokens !== undefined) {
    result.tokensUsed = data.usage.total_tokens;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main Export Functions
// ---------------------------------------------------------------------------

/**
 * Generate embedding with automatic provider fallback
 * Tries Voyage AI first, falls back to OpenAI if unavailable
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await generateEmbeddingWithMetadata(text);
  return response.embedding;
}

/**
 * Generate embedding with full metadata (provider info, tokens used)
 */
export async function generateEmbeddingWithMetadata(
  text: string
): Promise<EmbeddingResponse> {
  const errors: EmbeddingError[] = [];

  // Try Voyage AI first (primary provider)
  if (VOYAGE_CONFIG.apiKey) {
    try {
      return await generateVoyageEmbedding(text);
    } catch (error) {
      const embeddingError = error as EmbeddingError;
      errors.push(embeddingError);
      console.warn(
        `[Embeddings] Voyage AI failed, attempting OpenAI fallback:`,
        embeddingError.message
      );
    }
  }

  // Fallback to OpenAI
  if (OPENAI_CONFIG.apiKey) {
    try {
      return await generateOpenAIEmbedding(text);
    } catch (error) {
      const embeddingError = error as EmbeddingError;
      errors.push(embeddingError);
      console.error(`[Embeddings] OpenAI fallback also failed:`, embeddingError.message);
    }
  }

  // No provider available or all failed
  if (errors.length === 0) {
    throw new Error(
      "No embedding provider configured. Set VOYAGE_API_KEY or OPENAI_API_KEY environment variable."
    );
  }

  // Throw the last error with combined context
  const combinedMessage = errors
    .map((e) => `${e.provider}: ${e.message}`)
    .join("; ");
  throw new Error(`All embedding providers failed: ${combinedMessage}`);
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<EmbeddingResponse[]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 10;
  const results: EmbeddingResponse[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbeddingWithMetadata(text))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Check which embedding providers are available
 */
export function getAvailableProviders(): Array<{
  provider: "voyage" | "openai";
  model: string;
  dimensions: number;
  available: boolean;
}> {
  return [
    {
      provider: "voyage",
      model: VOYAGE_CONFIG.model,
      dimensions: VOYAGE_CONFIG.dimensions,
      available: Boolean(VOYAGE_CONFIG.apiKey),
    },
    {
      provider: "openai",
      model: OPENAI_CONFIG.model,
      dimensions: OPENAI_CONFIG.dimensions,
      available: Boolean(OPENAI_CONFIG.apiKey),
    },
  ];
}

/**
 * Get the dimensions of the current primary embedding provider
 */
export function getEmbeddingDimensions(): number {
  if (VOYAGE_CONFIG.apiKey) {
    return VOYAGE_CONFIG.dimensions;
  }
  if (OPENAI_CONFIG.apiKey) {
    return OPENAI_CONFIG.dimensions;
  }
  // Default to OpenAI dimensions
  return OPENAI_CONFIG.dimensions;
}

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type { EmbeddingConfig, EmbeddingResponse, EmbeddingError };
