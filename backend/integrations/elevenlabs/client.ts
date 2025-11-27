// Last Modified: 2025-11-23 17:30
/**
 * ElevenLabs Voice Generation Integration
 * Handles text-to-speech conversion
 */

import { ElevenLabsClient as ElevenLabs } from '@elevenlabs/elevenlabs-js';
import { ElevenLabsConfig } from '../../types';
import { retryWithBackoff } from '../../utils/retry';
import { costTracker, calculateElevenLabsCost } from '../../utils/cost-tracker';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class ElevenLabsClient {
  private client: ElevenLabs;
  private config: ElevenLabsConfig;
  private cacheDir: string;

  constructor(config: ElevenLabsConfig, cacheDir = './cache/audio') {
    this.config = config;
    this.client = new ElevenLabs({
      apiKey: config.apiKey,
    });
    this.cacheDir = cacheDir;

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    logger.integration('elevenlabs', 'Client initialized');
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(
    text: string,
    options?: {
      voiceId?: string;
      modelId?: string;
      stability?: number;
      similarityBoost?: number;
      cache?: boolean;
    }
  ): Promise<Buffer> {
    logger.integration('elevenlabs', `Converting text to speech (${text.length} chars)`);

    const voiceId = options?.voiceId || this.config.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default to Bella

    // Check cache first
    const cacheKey = this.getCacheKey(text, voiceId);
    if (options?.cache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.integration('elevenlabs', 'Using cached audio');
        return cached;
      }
    }

    const audioBuffer = await retryWithBackoff(async () => {
      const response = await this.client.textToSpeech.convert(voiceId, {
        text,
        model_id: options?.modelId || this.config.modelId || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options?.stability || 0.5,
          similarity_boost: options?.similarityBoost || 0.75,
        },
      });

      // Convert response to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      return buffer;
    });

    // Track cost
    const cost = calculateElevenLabsCost(text.length);
    costTracker.trackCost({
      service: 'elevenlabs',
      type: 'tts',
      cost,
      units: text.length,
      metadata: {
        voiceId,
        characterCount: text.length,
      },
    });

    logger.cost('elevenlabs', cost, `${text.length} characters`);

    // Cache the result
    if (options?.cache !== false) {
      this.saveToCache(cacheKey, audioBuffer);
    }

    logger.integration('elevenlabs', 'Text-to-speech conversion completed');
    return audioBuffer;
  }

  /**
   * Stream text to speech (for real-time use)
   */
  async *streamTextToSpeech(
    text: string,
    options?: {
      voiceId?: string;
      modelId?: string;
    }
  ): AsyncGenerator<Buffer> {
    logger.integration('elevenlabs', `Streaming text to speech (${text.length} chars)`);

    const voiceId = options?.voiceId || this.config.voiceId || 'EXAVITQu4vr4xnSDxMaL';

    const response = await this.client.textToSpeech.convert(voiceId, {
      text,
      model_id: options?.modelId || this.config.modelId || 'eleven_monolingual_v1',
    });

    for await (const chunk of response) {
      yield Buffer.from(chunk);
    }

    // Track cost
    const cost = calculateElevenLabsCost(text.length);
    costTracker.trackCost({
      service: 'elevenlabs',
      type: 'tts',
      cost,
      units: text.length,
      metadata: {
        voiceId,
        characterCount: text.length,
        streaming: true,
      },
    });

    logger.integration('elevenlabs', 'Streaming completed');
  }

  /**
   * List available voices
   */
  async listVoices(): Promise<any[]> {
    logger.integration('elevenlabs', 'Fetching available voices');

    const response = await retryWithBackoff(async () => {
      return await this.client.voices.getAll();
    });

    return response.voices || [];
  }

  /**
   * Get voice details
   */
  async getVoice(voiceId: string): Promise<any> {
    logger.integration('elevenlabs', `Fetching voice details for ${voiceId}`);

    const response = await retryWithBackoff(async () => {
      return await this.client.voices.get(voiceId);
    });

    return response;
  }

  /**
   * Get user subscription info (for quota tracking)
   */
  async getSubscriptionInfo(): Promise<any> {
    logger.integration('elevenlabs', 'Fetching subscription info');

    const response = await retryWithBackoff(async () => {
      return await this.client.user.getSubscription();
    });

    return response;
  }

  /**
   * Cache management
   */
  private getCacheKey(text: string, voiceId: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${text}-${voiceId}`).digest('hex');
    return hash;
  }

  private getFromCache(key: string): Buffer | null {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }

  private saveToCache(key: string, buffer: Buffer): void {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    fs.writeFileSync(filePath, buffer);
    logger.integration('elevenlabs', `Audio cached: ${key}`);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    const files = fs.readdirSync(this.cacheDir);
    files.forEach((file) => {
      fs.unlinkSync(path.join(this.cacheDir, file));
    });
    logger.integration('elevenlabs', 'Cache cleared');
  }
}

/**
 * Create ElevenLabs client from environment variables
 */
export function createElevenLabsClient(): ElevenLabsClient {
  const config: ElevenLabsConfig = {
    apiKey: process.env.ELEVENLABS_API_KEY!,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL_ID,
  };

  if (!config.apiKey) {
    throw new Error('Missing required ElevenLabs configuration: ELEVENLABS_API_KEY');
  }

  return new ElevenLabsClient(config);
}
