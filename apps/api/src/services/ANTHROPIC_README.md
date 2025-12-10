# Anthropic Claude Service

**Created:** 08 December 2025 15 00 00

Production-grade AI service for call transcript analysis powered by Claude 3.5 Sonnet.

## Features

- **Transcript Summarization** - Generate concise, detailed, or brief summaries
- **Sentiment Analysis** - Multi-dimensional emotional tone and concern level detection
- **Action Item Extraction** - Automatic identification of tasks, assignees, and priorities
- **Follow-up Suggestions** - Intelligent recommendations for next best actions
- **Topic Classification** - Categorize calls by type, keywords, and themes
- **Streaming Support** - Real-time response generation
- **Comprehensive Error Handling** - Retry logic, correlation IDs, and detailed logging

## Installation

The service is already installed as part of the API package:

```bash
pnpm add @anthropic-ai/sdk --filter @repo/api
```

## Configuration

Set the following environment variable:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

## Basic Usage

### 1. Summarize a Call Transcript

```typescript
import { summarizeTranscript } from './services';

const transcript = "Agent: Hello... Customer: Hi...";

const summary = await summarizeTranscript(transcript, {
  length: "standard", // "brief" | "standard" | "detailed"
  includeKeyPoints: true,
  focusAreas: ["technical issues", "resolutions"]
});

console.log(summary.summary);
console.log(summary.keyPoints);
```

### 2. Analyze Sentiment

```typescript
import { analyzeSentiment } from './services';

const sentiment = await analyzeSentiment(transcript);

console.log(sentiment.overall.type); // "positive" | "negative" | "neutral" | "mixed"
console.log(sentiment.overall.confidence); // 0-1
console.log(sentiment.concernLevel); // "low" | "medium" | "high"
console.log(sentiment.emotionalTone); // ["professional", "friendly", ...]
```

### 3. Extract Action Items

```typescript
import { extractActionItems } from './services';

const actionItems = await extractActionItems(transcript);

actionItems.actionItems.forEach(item => {
  console.log(`${item.priority}: ${item.description}`);
  console.log(`  Assignee: ${item.assignee}`);
  console.log(`  Due: ${item.dueDate}`);
});
```

### 4. Generate Follow-up Suggestions

```typescript
import { generateFollowUps } from './services';

const followUps = await generateFollowUps(transcript);

console.log("Next best action:", followUps.nextBestAction);

followUps.suggestions.forEach(suggestion => {
  console.log(`${suggestion.type} (${suggestion.priority}): ${suggestion.suggestion}`);
});
```

### 5. Classify Call Topics

```typescript
import { classifyTopic } from './services';

const classification = await classifyTopic(transcript);

console.log("Primary topic:", classification.classification.primary);
console.log("Secondary topics:", classification.classification.secondary);
console.log("Keywords:", classification.classification.keywords);
console.log("Categories:", classification.categories);
```

### 6. Streaming Response (Real-time)

```typescript
import { streamAnalysis } from './services';

const result = await streamAnalysis(
  "You are a helpful assistant",
  "Summarize this call: ...",
  {
    onText: (chunk) => process.stdout.write(chunk),
    onComplete: (fullText) => console.log("\nDone:", fullText.length),
    onError: (error) => console.error("Error:", error)
  }
);
```

## Advanced Usage

### Custom Configuration

```typescript
import { AnthropicService } from './services';

const customService = new AnthropicService({
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 2048,
  temperature: 0.5,
  timeout: 30000
});

const summary = await customService.summarize(transcript);
```

### Health Check

```typescript
import { checkHealth } from './services';

const health = await checkHealth();

if (health.status === 'healthy') {
  console.log(`✓ Service is healthy (latency: ${health.latency}ms)`);
} else {
  console.log('✗ Service is unhealthy');
}
```

### Error Handling

```typescript
try {
  const result = await summarizeTranscript(transcript);
} catch (error: any) {
  if (error.retryable) {
    // Implement retry logic
    console.log("Retryable error - trying again...");
  } else if (error.statusCode === 401) {
    console.error("Authentication failed");
  } else if (error.statusCode === 429) {
    console.error("Rate limit exceeded");
  }
}
```

## Response Types

### SummarizeResponse

```typescript
{
  summary: string;
  keyPoints?: string[];
  duration?: string;
  participants?: string[];
  correlationId: string;
  tokensUsed: number;
  model: string;
}
```

### SentimentAnalysisResponse

```typescript
{
  overall: {
    type: "positive" | "negative" | "neutral" | "mixed";
    confidence: number;
    reasoning: string;
  };
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
```

### ActionItemsResponse

```typescript
{
  actionItems: Array<{
    id: string;
    description: string;
    assignee?: string;
    priority: "low" | "medium" | "high" | "critical";
    dueDate?: string;
    category?: string;
    context?: string;
  }>;
  summary: string;
  totalCount: number;
  correlationId: string;
  tokensUsed: number;
  model: string;
}
```

### FollowUpResponse

```typescript
{
  suggestions: Array<{
    type: "email" | "call" | "meeting" | "task" | "reminder";
    priority: "low" | "medium" | "high";
    suggestion: string;
    reasoning: string;
    timing?: string;
  }>;
  nextBestAction: string;
  correlationId: string;
  tokensUsed: number;
  model: string;
}
```

### ClassificationResponse

```typescript
{
  classification: {
    primary: string;
    secondary: string[];
    keywords: string[];
    confidence: number;
  };
  categories: string[];
  tags: string[];
  correlationId: string;
  tokensUsed: number;
  model: string;
}
```

## Best Practices

1. **Always handle errors** - Use try/catch blocks and check for `error.retryable`
2. **Monitor token usage** - Track `tokensUsed` in responses for cost optimization
3. **Use correlation IDs** - Include `correlationId` in logs for request tracing
4. **Implement rate limiting** - Respect API rate limits (50 req/min, 40k tokens/min)
5. **Sanitize inputs** - Service automatically truncates inputs > 200k characters
6. **Choose appropriate length** - Use "brief" for quick summaries, "detailed" for comprehensive analysis
7. **Stream for UX** - Use `streamAnalysis` for real-time user feedback
8. **Batch carefully** - Process multiple transcripts in parallel but watch rate limits

## Performance Characteristics

- **Average latency:** 2-5 seconds (depending on transcript length and complexity)
- **Max input:** 200,000 characters (~50 pages of text)
- **Max output:** Configurable via `maxTokens` (default: 4,096)
- **Timeout:** 60 seconds (configurable)
- **Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)

## Security Features

- **Zero-trust input validation** - All inputs sanitized and validated
- **No data leakage** - Internal errors never exposed in production
- **Correlation tracking** - Every request has unique correlation ID
- **Timeout protection** - Prevents runaway requests
- **Type-safe interfaces** - Full TypeScript support

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable is required"
- Set the `ANTHROPIC_API_KEY` in your `.env` file

### "Rate limit exceeded"
- Implement exponential backoff retry logic
- Check that you're not exceeding 50 requests/minute or 40k tokens/minute

### "Timeout error"
- Increase timeout in service configuration
- Check network connectivity
- Verify transcript isn't too large

### "Failed to parse Claude response as JSON"
- Check Claude API status
- Verify model supports structured output
- Review logs for correlation ID and investigate

## Examples

See `anthropic.example.ts` for comprehensive usage examples including:
- Summarization with different lengths
- Sentiment analysis with emotional tone
- Action item extraction with priorities
- Follow-up suggestion generation
- Topic classification and categorization
- Streaming responses
- Custom configurations
- Error handling patterns
- Batch processing

## Logging

All requests are logged with:
- **Correlation ID** - Unique identifier for tracking
- **Model** - Which Claude model was used
- **Duration** - Request completion time in milliseconds
- **Tokens Used** - Input + output token count

Example log:
```
[Anthropic] Request completed {
  correlationId: 'claude-1733673600-a1b2c3d4',
  model: 'claude-3-5-sonnet-20241022',
  duration: '2847.23ms',
  tokensUsed: 1523
}
```

## Support

For issues or questions:
1. Check the examples in `anthropic.example.ts`
2. Review error logs with correlation IDs
3. Consult Anthropic API documentation: https://docs.anthropic.com/
4. Check service health: `await checkHealth()`

---

**Version:** 1.0.0
**Last Updated:** 08 December 2025 15 00 00
**Model:** Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
**SDK Version:** @anthropic-ai/sdk@0.71.2
