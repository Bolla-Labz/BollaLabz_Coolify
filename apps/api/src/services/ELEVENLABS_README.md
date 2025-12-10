# ElevenLabs Text-to-Speech Service

**08 December 2025 15 00 00**

Comprehensive TTS service with streaming support, voice management, and telephony integration.

## Features

- **Speech Generation**: Convert text to high-quality audio in multiple formats
- **Real-time Streaming**: Low-latency streaming for live applications
- **Voice Management**: Access and configure 100+ premium voices
- **Telephony Support**: μ-law encoding for SIP/PSTN compatibility
- **Voice Customization**: Fine-tune stability, similarity, and style
- **Preset Settings**: Pre-configured profiles for common use cases
- **Error Handling**: Comprehensive error handling with correlation IDs
- **Structured Logging**: JSON logs with performance metrics

## Installation

Package already installed via:
```bash
pnpm add elevenlabs --filter @repo/api
```

## Configuration

### Required Environment Variables

```bash
# ElevenLabs API Key (required)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx

# Default Voice ID (optional but recommended)
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### Get Your API Key

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to Profile → API Keys
3. Generate a new API key
4. Add to your `.env` file

### Find Voice IDs

```typescript
import { getVoices } from "@repo/api/services";

const voices = await getVoices();
if (voices.success) {
  voices.data.forEach(voice => {
    console.log(`${voice.name}: ${voice.voice_id}`);
  });
}
```

## Quick Start

### Basic Speech Generation

```typescript
import { generateSpeech } from "@repo/api/services";

const result = await generateSpeech({
  text: "Hello, welcome to BollaLabz!",
});

if (result.success) {
  // result.audio is a Buffer containing MP3 data
  fs.writeFileSync("output.mp3", result.audio);
  console.log(`Generated ${result.audio.length} bytes in ${result.duration}ms`);
}
```

### Streaming Speech (Low Latency)

```typescript
import { streamSpeech } from "@repo/api/services";

const result = await streamSpeech({
  text: "This will be streamed in real-time...",
  optimizeStreamingLatency: 3, // Maximum optimization
});

if (result.success) {
  // Pipe to HTTP response
  result.stream.pipe(response);

  // Or process chunks
  result.stream.on("data", (chunk) => {
    // Handle audio chunk
  });
}
```

### Telephony Integration

```typescript
import { generateSpeechForTelephony } from "@repo/api/services";

const result = await generateSpeechForTelephony({
  text: "Your verification code is 1 2 3 4 5 6",
});

if (result.success) {
  // result.audio is μ-law 8kHz format (SIP/PSTN compatible)
  await telnyxCall.playAudio(result.audio);
}
```

## Output Formats

| Format | Sample Rate | Bitrate | Use Case |
|--------|-------------|---------|----------|
| `mp3_44100_128` | 44.1 kHz | 128 kbps | High quality (default) |
| `mp3_44100_64` | 44.1 kHz | 64 kbps | Balanced quality/size |
| `mp3_22050_32` | 22.05 kHz | 32 kbps | Low bandwidth |
| `pcm_16000` | 16 kHz | - | Raw audio processing |
| `pcm_22050` | 22.05 kHz | - | Higher quality PCM |
| `pcm_24000` | 24 kHz | - | High quality PCM |
| `pcm_44100` | 44.1 kHz | - | Studio quality PCM |
| `ulaw_8000` | 8 kHz | - | **Telephony (SIP/PSTN)** |

## Voice Settings

### Preset Configurations

```typescript
import { PRESET_VOICE_SETTINGS } from "@repo/api/services";

// Balanced (general use)
PRESET_VOICE_SETTINGS.balanced
// { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }

// Stable (audiobooks, consistent narration)
PRESET_VOICE_SETTINGS.stable
// { stability: 0.75, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true }

// Expressive (storytelling, dynamic content)
PRESET_VOICE_SETTINGS.expressive
// { stability: 0.3, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true }

// Professional (IVR, announcements)
PRESET_VOICE_SETTINGS.professional
// { stability: 0.6, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true }

// Telephony (phone calls)
PRESET_VOICE_SETTINGS.telephony
// { stability: 0.7, similarity_boost: 0.85, style: 0.0, use_speaker_boost: true }
```

### Custom Voice Settings

```typescript
await generateSpeech({
  text: "Custom voice settings example",
  voiceSettings: {
    stability: 0.5,         // 0.0-1.0 (higher = more consistent)
    similarity_boost: 0.75, // 0.0-1.0 (higher = closer to original)
    style: 0.3,             // 0.0-1.0 (higher = more expressive)
    use_speaker_boost: true // Enhance clarity
  }
});
```

## Voice Management

### List All Voices

```typescript
import { getVoices } from "@repo/api/services";

const result = await getVoices();
if (result.success) {
  console.log(`Found ${result.data.length} voices`);

  result.data.forEach(voice => {
    console.log(`${voice.name} (${voice.voice_id})`);
    console.log(`  Category: ${voice.category}`);
    console.log(`  Description: ${voice.description}`);
  });
}
```

### Get Voice Details

```typescript
import { getVoice, getVoiceSettings } from "@repo/api/services";

// Get voice info
const voice = await getVoice("21m00Tcm4TlvDq8ikWAM");
if (voice.success) {
  console.log(voice.data.name);
}

// Get default settings for voice
const settings = await getVoiceSettings("21m00Tcm4TlvDq8ikWAM");
if (settings.success) {
  console.log(settings.data);
}
```

## Available Models

```typescript
type ModelId =
  | "eleven_monolingual_v1"    // English only, fastest
  | "eleven_multilingual_v1"   // Multiple languages
  | "eleven_multilingual_v2"   // Improved multilingual
  | "eleven_turbo_v2"          // Ultra-low latency
  | "eleven_turbo_v2_5";       // Latest turbo (default)
```

## Error Handling

All functions return a discriminated union:

```typescript
// Success response
{
  success: true,
  audio: Buffer,
  format: OutputFormat,
  voiceId: string,
  correlationId: string,
  duration: number,
  metadata: { ... }
}

// Error response
{
  success: false,
  error: string,
  code: TTSErrorCode,
  correlationId: string,
  details?: unknown
}
```

### Error Codes

```typescript
enum TTSErrorCode {
  MISSING_API_KEY = "MISSING_API_KEY",
  MISSING_VOICE_ID = "MISSING_VOICE_ID",
  INVALID_TEXT = "INVALID_TEXT",
  GENERATION_FAILED = "GENERATION_FAILED",
  STREAM_FAILED = "STREAM_FAILED",
  VOICE_NOT_FOUND = "VOICE_NOT_FOUND",
  API_ERROR = "API_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}
```

### Example Error Handling

```typescript
const result = await generateSpeech({ text: "Hello" });

if (!result.success) {
  console.error(`Error: ${result.error}`);
  console.error(`Code: ${result.code}`);
  console.error(`Correlation ID: ${result.correlationId}`);

  switch (result.code) {
    case TTSErrorCode.MISSING_API_KEY:
      // Handle missing API key
      break;
    case TTSErrorCode.GENERATION_FAILED:
      // Retry or log
      break;
    // ... other cases
  }
}
```

## Utilities

### Configuration Check

```typescript
import { isConfigured } from "@repo/api/services";

const config = isConfigured();

console.log(config.configured);      // true if fully configured
console.log(config.hasApiKey);       // true if API key exists
console.log(config.hasDefaultVoiceId); // true if default voice set
```

### Estimate Audio Duration

```typescript
import { estimateAudioDuration } from "@repo/api/services";

const text = "This is a sample text to estimate duration.";
const seconds = estimateAudioDuration(text);

console.log(`Estimated duration: ~${seconds} seconds`);
```

## Use Cases

### 1. IVR System

```typescript
const greeting = await generateSpeechForTelephony({
  text: "Thank you for calling. Please hold while we connect you.",
  voiceSettings: PRESET_VOICE_SETTINGS.professional,
});
```

### 2. Podcast/Audiobook

```typescript
const chapter = await generateSpeech({
  text: longText,
  voiceSettings: PRESET_VOICE_SETTINGS.stable,
  outputFormat: "mp3_44100_128",
});
```

### 3. Real-time Chat/Streaming

```typescript
const stream = await streamSpeech({
  text: userMessage,
  outputFormat: "mp3_44100_64",
  optimizeStreamingLatency: 3,
});

if (stream.success) {
  stream.stream.pipe(webSocketConnection);
}
```

### 4. Verification Codes

```typescript
const code = await generateSpeechForTelephony({
  text: "Your code is 1, 2, 3, 4, 5, 6",
  voiceSettings: PRESET_VOICE_SETTINGS.telephony,
});
```

## Performance

- **Generation Time**: ~200-500ms for short texts (< 100 chars)
- **Streaming Latency**: < 300ms first chunk with optimization
- **Concurrent Requests**: Rate limited by ElevenLabs plan
- **Audio Size**: ~1MB per minute (MP3 128kbps)

## Pricing Considerations

ElevenLabs pricing is based on characters processed:

- **Free Tier**: 10,000 characters/month
- **Starter**: 30,000 characters/month
- **Creator**: 100,000 characters/month
- **Pro**: 500,000 characters/month

Monitor usage via the ElevenLabs dashboard.

## Security Best Practices

1. **API Key Storage**: Store in environment variables, never commit to git
2. **Rate Limiting**: Implement rate limiting on your endpoints
3. **Input Validation**: Always validate text length and content
4. **Error Handling**: Never expose internal errors to clients
5. **Logging**: Use correlation IDs for request tracking

## Integration Examples

### Hono API Endpoint

```typescript
import { Hono } from "hono";
import { generateSpeech } from "@repo/api/services";

const app = new Hono();

app.post("/api/tts", async (c) => {
  const { text } = await c.req.json();

  const result = await generateSpeech({ text });

  if (result.success) {
    return c.body(result.audio, 200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(result.audio.length),
    });
  }

  return c.json({ error: result.error }, 500);
});
```

### Telnyx Integration

```typescript
import { generateSpeechForTelephony } from "@repo/api/services";
import { TelnyxService } from "@repo/api/services";

async function playMessage(callId: string, text: string) {
  const audio = await generateSpeechForTelephony({ text });

  if (audio.success) {
    await TelnyxService.playAudio(callId, audio.audio);
  }
}
```

## Troubleshooting

### Issue: "ELEVENLABS_API_KEY environment variable is required"

**Solution**: Add API key to `.env` file

```bash
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
```

### Issue: "Text exceeds maximum length of 5000 characters"

**Solution**: Split long text into chunks

```typescript
const chunks = splitTextIntoChunks(longText, 4000);
const audioBuffers = await Promise.all(
  chunks.map(chunk => generateSpeech({ text: chunk }))
);
```

### Issue: Streaming audio choppy

**Solution**: Increase streaming latency optimization

```typescript
await streamSpeech({
  text: "...",
  optimizeStreamingLatency: 4, // Higher = more optimization
});
```

## Advanced Features

### Pronunciation Dictionary

```typescript
await generateSpeech({
  text: "BollaLabz is amazing",
  pronunciationDictionaryId: "dictionary_id_here",
});
```

### Batch Processing

```typescript
const texts = ["Text 1", "Text 2", "Text 3"];

const results = await Promise.all(
  texts.map(text => generateSpeech({ text }))
);

results.forEach((result, i) => {
  if (result.success) {
    fs.writeFileSync(`output-${i}.mp3`, result.audio);
  }
});
```

## API Reference

See `elevenlabs.ts` for full TypeScript definitions and documentation.

See `elevenlabs.example.ts` for comprehensive usage examples.

## Support

- **ElevenLabs Docs**: [docs.elevenlabs.io](https://docs.elevenlabs.io)
- **API Status**: [status.elevenlabs.io](https://status.elevenlabs.io)
- **Community**: [discord.gg/elevenlabs](https://discord.gg/elevenlabs)

---

**Last Updated**: 08 December 2025 15 00 00
