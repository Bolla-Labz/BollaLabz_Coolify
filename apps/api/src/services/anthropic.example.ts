// 08 December 2025 15 10 00

/**
 * Anthropic Claude Service - Usage Examples
 * This file demonstrates how to use the Anthropic service for call transcript analysis
 */

import anthropicService, {
  summarizeTranscript,
  analyzeSentiment,
  extractActionItems,
  generateFollowUps,
  classifyTopic,
  streamAnalysis,
  checkHealth,
} from "./anthropic";

// ---------------------------------------------------------------------------
// Example 1: Summarize a Call Transcript
// ---------------------------------------------------------------------------

async function exampleSummarize() {
  const transcript = `
    Agent: Thank you for calling BollaLabz Support. How can I help you today?

    Customer: Hi, I'm having issues with the API integration. The authentication
    keeps failing and I'm getting 401 errors.

    Agent: I understand. Let me check your account. Can you provide your API key?

    Customer: Sure, it starts with bz_live_...

    Agent: I see the issue. Your API key was regenerated yesterday for security
    reasons. I'll send you the new key via email. You'll also need to update
    your webhook URL to use the new endpoint.

    Customer: Oh, I see. Thanks for catching that. When will the email arrive?

    Agent: You should receive it within the next 5 minutes. Is there anything
    else I can help you with?

    Customer: No, that's all. Thanks for your help!

    Agent: You're welcome! Have a great day.
  `;

  try {
    // Standard summary
    const summary = await summarizeTranscript(transcript);
    console.log("Summary:", summary);

    // Detailed summary with key points
    const detailedSummary = await summarizeTranscript(transcript, {
      length: "detailed",
      includeKeyPoints: true,
      focusAreas: ["technical issues", "resolutions"],
    });
    console.log("Detailed Summary:", detailedSummary);
  } catch (error) {
    console.error("Summarization failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 2: Analyze Sentiment
// ---------------------------------------------------------------------------

async function exampleSentiment() {
  const transcript = `
    Agent: Hello! Thanks for being a valued customer.

    Customer: Hi. I'm really frustrated. This is the third time I've had to
    call about this issue and it's still not fixed!

    Agent: I sincerely apologize for the inconvenience. Let me personally
    ensure this gets resolved today.

    Customer: I appreciate that. I just want this working so I can get back
    to my project.

    Agent: I completely understand. I've escalated this to our senior team
    and they're working on it right now.

    Customer: Okay, thank you. That makes me feel better.
  `;

  try {
    const sentiment = await analyzeSentiment(transcript);
    console.log("Sentiment Analysis:", {
      overall: sentiment.overall,
      breakdown: sentiment.breakdown,
      emotionalTone: sentiment.emotionalTone,
      concernLevel: sentiment.concernLevel,
    });
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 3: Extract Action Items
// ---------------------------------------------------------------------------

async function exampleActionItems() {
  const transcript = `
    Manager: Let's review our Q1 goals. John, can you prepare the sales report
    by next Friday?

    John: Absolutely, I'll have it ready by EOD Thursday.

    Manager: Great. Sarah, we need to update the client onboarding documentation.
    Can you work with the design team on that?

    Sarah: Yes, I'll schedule a meeting with them this week and aim to have
    the first draft done by the end of the month.

    Manager: Perfect. Also, everyone should complete the compliance training
    by Monday. It's critical we all finish this.

    John: Got it, I'll do mine today.

    Sarah: I already completed mine yesterday!

    Manager: Excellent. One more thing - we need to schedule a follow-up
    meeting for next month to review progress.
  `;

  try {
    const actionItems = await extractActionItems(transcript);
    console.log("Action Items:", {
      total: actionItems.totalCount,
      summary: actionItems.summary,
      items: actionItems.actionItems,
    });
  } catch (error) {
    console.error("Action item extraction failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 4: Generate Follow-up Suggestions
// ---------------------------------------------------------------------------

async function exampleFollowUps() {
  const transcript = `
    Sales Rep: Thanks for taking the time to discuss our enterprise plan today.

    Prospect: Yes, it looks promising. I need to discuss this with our CTO
    before making a decision.

    Sales Rep: Of course. Would it be helpful if I prepared a technical
    overview specifically for your CTO?

    Prospect: That would be great. Also, do you have any case studies from
    companies in the healthcare industry?

    Sales Rep: Absolutely. I'll put together a package with our healthcare
    case studies and the technical overview. When would be a good time for
    a follow-up call?

    Prospect: How about next Tuesday afternoon?

    Sales Rep: Perfect. I'll send a calendar invite and the materials by
    end of day tomorrow.

    Prospect: Sounds good. Looking forward to it.
  `;

  try {
    const followUps = await generateFollowUps(transcript);
    console.log("Follow-up Suggestions:", {
      nextBestAction: followUps.nextBestAction,
      suggestions: followUps.suggestions,
    });
  } catch (error) {
    console.error("Follow-up generation failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 5: Classify Call Topic
// ---------------------------------------------------------------------------

async function exampleClassification() {
  const transcript = `
    Agent: Welcome to BollaLabz technical support. What can I help you with?

    Customer: I need help integrating your webhook system with my application.
    I'm getting timeout errors when trying to receive events.

    Agent: Let me help you troubleshoot that. Are you using the webhook
    verification system correctly?

    Customer: I think so, but I'm not sure if I'm handling the signature
    validation properly.

    Agent: Let me walk you through the signature validation process step by step...
  `;

  try {
    const classification = await classifyTopic(transcript);
    console.log("Topic Classification:", {
      primary: classification.classification.primary,
      secondary: classification.classification.secondary,
      keywords: classification.classification.keywords,
      categories: classification.categories,
      tags: classification.tags,
    });
  } catch (error) {
    console.error("Topic classification failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 6: Streaming Response (Real-time)
// ---------------------------------------------------------------------------

async function exampleStreaming() {
  const transcript = `
    Agent: How can I assist you today?
    Customer: I need to upgrade my subscription plan.
    Agent: Great! Let me walk you through our available plans...
  `;

  const systemPrompt = `You are a helpful assistant analyzing call transcripts.`;
  const userPrompt = `Provide a brief summary of this call: ${transcript}`;

  try {
    const result = await streamAnalysis(systemPrompt, userPrompt, {
      onText: (chunk) => {
        // This will be called for each chunk of text as it arrives
        process.stdout.write(chunk);
      },
      onComplete: (fullText) => {
        console.log("\n\nStream completed. Full text length:", fullText.length);
      },
      onError: (error) => {
        console.error("Stream error:", error);
      },
    });

    console.log("\nFinal result:", result);
  } catch (error) {
    console.error("Streaming failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 7: Health Check
// ---------------------------------------------------------------------------

async function exampleHealthCheck() {
  try {
    const health = await checkHealth();
    console.log("Service Health:", health);

    if (health.status === "healthy") {
      console.log(`✓ Anthropic service is healthy (latency: ${health.latency}ms)`);
    } else {
      console.log("✗ Anthropic service is unhealthy");
    }
  } catch (error) {
    console.error("Health check failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 8: Using the Service Class Directly
// ---------------------------------------------------------------------------

async function exampleCustomConfig() {
  // Create a custom service instance with specific configuration
  const { AnthropicService } = await import("./anthropic");

  const customService = new AnthropicService({
    model: "claude-3-5-sonnet-20241022",
    maxTokens: 2048,
    temperature: 0.5,
    timeout: 30000,
  });

  const transcript = "Agent: Hello! Customer: Hi, I have a question...";

  try {
    const summary = await customService.summarize(transcript, {
      length: "brief",
    });
    console.log("Custom service summary:", summary);
  } catch (error) {
    console.error("Custom service failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Example 9: Error Handling Best Practices
// ---------------------------------------------------------------------------

async function exampleErrorHandling() {
  const transcript = "Short call.";

  try {
    const result = await summarizeTranscript(transcript);
    console.log("Success:", result);
  } catch (error: any) {
    // Type-safe error handling
    if (error.retryable) {
      console.error("Retryable error occurred:", error.message);
      // Implement retry logic here
    } else if (error.statusCode === 401) {
      console.error("Authentication failed. Check ANTHROPIC_API_KEY");
    } else if (error.statusCode === 429) {
      console.error("Rate limit exceeded. Please wait before retrying");
    } else {
      console.error("Non-retryable error:", error.message);
    }
  }
}

// ---------------------------------------------------------------------------
// Example 10: Batch Processing Multiple Transcripts
// ---------------------------------------------------------------------------

async function exampleBatchProcessing() {
  const transcripts = [
    "Agent: Hello... Customer: Hi...",
    "Agent: Welcome... Customer: Thanks...",
    "Agent: How can I help? Customer: I need support...",
  ];

  try {
    // Process all transcripts in parallel
    const results = await Promise.all(
      transcripts.map((transcript) =>
        summarizeTranscript(transcript, { length: "brief" })
      )
    );

    results.forEach((result, index) => {
      console.log(`\nTranscript ${index + 1}:`);
      console.log("Summary:", result.summary);
      console.log("Tokens used:", result.tokensUsed);
    });
  } catch (error) {
    console.error("Batch processing failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Run Examples (uncomment to test)
// ---------------------------------------------------------------------------

// Uncomment to run individual examples:
// exampleSummarize();
// exampleSentiment();
// exampleActionItems();
// exampleFollowUps();
// exampleClassification();
// exampleStreaming();
// exampleHealthCheck();
// exampleCustomConfig();
// exampleErrorHandling();
// exampleBatchProcessing();

export {
  exampleSummarize,
  exampleSentiment,
  exampleActionItems,
  exampleFollowUps,
  exampleClassification,
  exampleStreaming,
  exampleHealthCheck,
  exampleCustomConfig,
  exampleErrorHandling,
  exampleBatchProcessing,
};
