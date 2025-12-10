// 08 December 2025 15 00 00

/**
 * ElevenLabs TTS Service - Usage Examples
 * Demonstrates all features and use cases
 */

import {
  generateSpeech,
  streamSpeech,
  generateSpeechForTelephony,
  getVoices,
  getVoice,
  getVoiceSettings,
  PRESET_VOICE_SETTINGS,
  isConfigured,
  estimateAudioDuration,
  type VoiceSettings,
  type OutputFormat,
} from "./elevenlabs";
import { writeFileSync } from "fs";

// Mock Response type for example purposes
interface MockResponse {
  write: (chunk: Buffer) => void;
  end: () => void;
}

// ---------------------------------------------------------------------------
// Example 1: Basic Speech Generation
// ---------------------------------------------------------------------------

async function example1_BasicGeneration() {
  console.log("Example 1: Basic Speech Generation");

  const result = await generateSpeech({
    text: "Hello! Welcome to BollaLabz Command Center. This is a demonstration of our text-to-speech capabilities.",
  });

  if (result.success) {
    console.log(`✓ Generated ${result.audio.length} bytes`);
    console.log(`✓ Format: ${result.format}`);
    console.log(`✓ Duration: ${result.duration}ms`);
    console.log(`✓ Voice ID: ${result.voiceId}`);

    // Save to file
    writeFileSync("output.mp3", result.audio);
    console.log("✓ Saved to output.mp3");
  } else {
    console.error(`✗ Error: ${result.error}`);
  }
}

// ---------------------------------------------------------------------------
// Example 2: Custom Voice Settings
// ---------------------------------------------------------------------------

async function example2_CustomVoiceSettings() {
  console.log("\nExample 2: Custom Voice Settings");

  // Use preset for professional IVR
  const result = await generateSpeech({
    text: "Thank you for calling. Please hold while we connect you.",
    voiceSettings: PRESET_VOICE_SETTINGS.professional,
    outputFormat: "mp3_44100_128",
  });

  if (result.success) {
    console.log(`✓ Professional voice generated: ${result.audio.length} bytes`);
    writeFileSync("ivr-professional.mp3", result.audio);
  }

  // Custom expressive settings for storytelling
  const storytelling = await generateSpeech({
    text: "Once upon a time, in a land far away, there lived a brave knight who sought to conquer the digital realm.",
    voiceSettings: PRESET_VOICE_SETTINGS.expressive,
  });

  if (storytelling.success) {
    console.log(`✓ Expressive voice generated: ${storytelling.audio.length} bytes`);
    writeFileSync("story-expressive.mp3", storytelling.audio);
  }
}

// ---------------------------------------------------------------------------
// Example 3: Multiple Output Formats
// ---------------------------------------------------------------------------

async function example3_MultipleFormats() {
  console.log("\nExample 3: Multiple Output Formats");

  const text = "Testing different audio formats for various use cases.";

  const formats: OutputFormat[] = [
    "mp3_44100_128", // High quality MP3
    "mp3_22050_32",  // Low bandwidth MP3
    "pcm_16000",     // Raw PCM for processing
    "ulaw_8000",     // Telephony format
  ];

  for (const format of formats) {
    const result = await generateSpeech({
      text,
      outputFormat: format,
    });

    if (result.success) {
      console.log(`✓ ${format}: ${result.audio.length} bytes`);
    }
  }
}

// ---------------------------------------------------------------------------
// Example 4: Streaming Speech (Real-time)
// ---------------------------------------------------------------------------

async function example4_StreamingSpeech(response: MockResponse) {
  console.log("\nExample 4: Streaming Speech");

  const result = await streamSpeech({
    text: "This is a streaming example. The audio will be delivered in real-time chunks for minimal latency.",
    outputFormat: "mp3_44100_128",
    optimizeStreamingLatency: 3, // Maximum optimization
  });

  if (result.success) {
    console.log(`✓ Stream initialized`);

    // Pipe to HTTP response for web playback (example)
    // result.stream.pipe(response);

    // Or handle chunks manually
    result.stream.on("data", (chunk: Buffer) => {
      console.log(`  Received chunk: ${chunk.length} bytes`);
      // Process or forward chunk
    });

    result.stream.on("end", () => {
      console.log("✓ Stream completed");
    });

    result.stream.on("error", (error) => {
      console.error(`✗ Stream error: ${error.message}`);
    });
  } else {
    console.error(`✗ Error: ${result.error}`);
  }
}

// ---------------------------------------------------------------------------
// Example 5: Telephony Integration
// ---------------------------------------------------------------------------

async function example5_TelephonyIntegration() {
  console.log("\nExample 5: Telephony Integration");

  // Generate speech optimized for phone calls
  const result = await generateSpeechForTelephony({
    text: "Your verification code is 1, 2, 3, 4, 5, 6. Please enter it now.",
    voiceSettings: PRESET_VOICE_SETTINGS.telephony,
  });

  if (result.success) {
    console.log(`✓ Telephony audio generated: ${result.audio.length} bytes`);
    console.log(`✓ Format: ${result.format} (μ-law 8kHz)`);
    console.log(`✓ Ready for SIP/PSTN playback`);

    // Use with Telnyx or Twilio
    // await telnyxCall.playAudio(result.audio);
  }
}

// ---------------------------------------------------------------------------
// Example 6: Voice Management
// ---------------------------------------------------------------------------

async function example6_VoiceManagement() {
  console.log("\nExample 6: Voice Management");

  // Get all available voices
  const voicesResult = await getVoices();
  if (voicesResult.success) {
    console.log(`✓ Found ${voicesResult.data.length} voices`);

    // List first 5 voices
    voicesResult.data.slice(0, 5).forEach((voice) => {
      console.log(`  - ${voice.name} (${voice.voice_id})`);
      if (voice.description) {
        console.log(`    ${voice.description}`);
      }
    });
  }

  // Get specific voice details
  if (process.env.ELEVENLABS_VOICE_ID) {
    const voiceResult = await getVoice(process.env.ELEVENLABS_VOICE_ID);
    if (voiceResult.success) {
      console.log(`\n✓ Voice Details:`);
      console.log(`  Name: ${voiceResult.data.name}`);
      console.log(`  ID: ${voiceResult.data.voice_id}`);
      console.log(`  Category: ${voiceResult.data.category}`);
    }

    // Get voice settings
    const settingsResult = await getVoiceSettings(process.env.ELEVENLABS_VOICE_ID);
    if (settingsResult.success) {
      console.log(`\n✓ Default Settings:`);
      console.log(`  Stability: ${settingsResult.data.stability}`);
      console.log(`  Similarity: ${settingsResult.data.similarity_boost}`);
      console.log(`  Style: ${settingsResult.data.style}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Example 7: Configuration Check & Utilities
// ---------------------------------------------------------------------------

async function example7_UtilitiesAndConfiguration() {
  console.log("\nExample 7: Utilities & Configuration");

  // Check configuration
  const config = isConfigured();
  console.log(`✓ Configuration Status:`);
  console.log(`  Fully configured: ${config.configured}`);
  console.log(`  Has API key: ${config.hasApiKey}`);
  console.log(`  Has default voice: ${config.hasDefaultVoiceId}`);

  // Estimate audio duration
  const text = "This is a sample text to estimate audio duration. It contains multiple sentences and words.";
  const estimatedDuration = estimateAudioDuration(text);
  console.log(`\n✓ Estimated Duration: ~${estimatedDuration} seconds`);
  console.log(`  Text length: ${text.length} characters`);
  console.log(`  Word count: ${text.split(/\s+/).length} words`);
}

// ---------------------------------------------------------------------------
// Example 8: Error Handling
// ---------------------------------------------------------------------------

async function example8_ErrorHandling() {
  console.log("\nExample 8: Error Handling");

  // Test with invalid input
  const result1 = await generateSpeech({
    text: "", // Empty text
  });

  if (!result1.success) {
    console.log(`✓ Caught validation error: ${result1.error}`);
    console.log(`  Error code: ${result1.code}`);
    console.log(`  Correlation ID: ${result1.correlationId}`);
  }

  // Test with text too long
  const longText = "x".repeat(10000);
  const result2 = await generateSpeech({
    text: longText,
  });

  if (!result2.success) {
    console.log(`✓ Caught length error: ${result2.error}`);
  }

  // Test with invalid voice settings
  const result3 = await generateSpeech({
    text: "Testing invalid settings",
    voiceSettings: {
      stability: 2.0, // Invalid: must be 0-1
    },
  });

  if (!result3.success) {
    console.log(`✓ Caught settings error: ${result3.error}`);
  }
}

// ---------------------------------------------------------------------------
// Example 9: Batch Processing
// ---------------------------------------------------------------------------

async function example9_BatchProcessing() {
  console.log("\nExample 9: Batch Processing");

  const texts = [
    "First message for batch processing.",
    "Second message with different content.",
    "Third message completing the batch.",
  ];

  console.log(`Processing ${texts.length} texts...`);

  const results = await Promise.all(
    texts.map((text, index) =>
      generateSpeech({
        text,
        voiceSettings: PRESET_VOICE_SETTINGS.balanced,
      }).then((result) => ({
        index,
        result,
      }))
    )
  );

  results.forEach(({ index, result }) => {
    if (result.success) {
      console.log(`✓ Message ${index + 1}: ${result.audio.length} bytes in ${result.duration}ms`);
      writeFileSync(`batch-${index + 1}.mp3`, result.audio);
    } else {
      console.error(`✗ Message ${index + 1}: ${result.error}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Example 10: Advanced Voice Comparison
// ---------------------------------------------------------------------------

async function example10_VoiceComparison() {
  console.log("\nExample 10: Voice Comparison");

  const text = "Compare how different voice settings affect the output.";

  const settings: Record<string, VoiceSettings> = {
    stable: PRESET_VOICE_SETTINGS.stable,
    expressive: PRESET_VOICE_SETTINGS.expressive,
    professional: PRESET_VOICE_SETTINGS.professional,
  };

  for (const [name, voiceSettings] of Object.entries(settings)) {
    const result = await generateSpeech({
      text,
      voiceSettings,
    });

    if (result.success) {
      console.log(`✓ ${name.padEnd(15)}: ${result.audio.length} bytes`);
      writeFileSync(`comparison-${name}.mp3`, result.audio);
    }
  }
}

// ---------------------------------------------------------------------------
// Run All Examples
// ---------------------------------------------------------------------------

export async function runAllExamples() {
  console.log("=".repeat(70));
  console.log("ElevenLabs TTS Service - Complete Examples");
  console.log("=".repeat(70));

  try {
    await example1_BasicGeneration();
    await example2_CustomVoiceSettings();
    await example3_MultipleFormats();
    // await example4_StreamingSpeech(response); // Requires Express response
    await example5_TelephonyIntegration();
    await example6_VoiceManagement();
    await example7_UtilitiesAndConfiguration();
    await example8_ErrorHandling();
    await example9_BatchProcessing();
    await example10_VoiceComparison();

    console.log("\n" + "=".repeat(70));
    console.log("✓ All examples completed successfully");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n✗ Example execution failed:");
    console.error(error);
  }
}

// Uncomment to run examples directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   runAllExamples();
// }
