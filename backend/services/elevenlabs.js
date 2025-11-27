// Last Modified: 2025-11-23 17:30
/**
 * ElevenLabs Voice Synthesis Service
 * High-quality text-to-speech using ElevenLabs API
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.defaultVoiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    this.model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
    this.audioDir = path.join(__dirname, '../public/audio');

    if (!this.apiKey) {
      logger.warn('ELEVENLABS_API_KEY not configured');
    }

    // Ensure audio directory exists
    this.ensureAudioDirectory();
  }

  /**
   * Ensure audio directory exists
   */
  ensureAudioDirectory() {
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      logger.info('Created audio directory');
    }
  }

  /**
   * Initialize ElevenLabs client
   */
  getClient() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }
    return new ElevenLabsClient({ apiKey: this.apiKey });
  }

  /**
   * Convert text to speech and save audio file
   * @param {string} text - Text to convert to speech
   * @param {string} voiceId - ElevenLabs voice ID (optional)
   * @param {Object} options - Voice settings (optional)
   * @returns {Promise<Object>} Audio file details
   */
  async textToSpeech(text, voiceId = null, options = {}) {
    try {
      const client = this.getClient();
      const selectedVoiceId = voiceId || this.defaultVoiceId;

      logger.info(`Converting text to speech: ${text.substring(0, 50)}...`);

      const startTime = Date.now();

      // Generate audio
      const audio = await client.textToSpeech.convert(selectedVoiceId, {
        text,
        model_id: this.model,
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.75,
          style: options.style || 0.0,
          use_speaker_boost: options.useSpeakerBoost !== undefined ? options.useSpeakerBoost : true
        }
      });

      const endTime = Date.now();
      const generationTime = endTime - startTime;

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `speech_${timestamp}.mp3`;
      const filepath = path.join(this.audioDir, filename);

      // Save audio to file
      const chunks = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(filepath, buffer);

      const fileSize = buffer.length;

      logger.info(`Audio generated: ${filename}, size: ${fileSize} bytes, time: ${generationTime}ms`);

      // Store usage record in database
      await this.trackUsage({
        text,
        voiceId: selectedVoiceId,
        filename,
        fileSize,
        generationTime,
        model: this.model
      });

      return {
        filename,
        filepath,
        fileSize,
        generationTime,
        url: `/api/v1/voice/audio/${filename}`,
        voiceId: selectedVoiceId,
        model: this.model
      };
    } catch (error) {
      logger.error('Error in textToSpeech:', error);
      throw error;
    }
  }

  /**
   * Stream audio in real-time (for future implementation)
   * @param {string} text - Text to convert to speech
   * @param {string} voiceId - ElevenLabs voice ID (optional)
   * @returns {Promise<ReadableStream>} Audio stream
   */
  async streamAudio(text, voiceId = null) {
    try {
      const client = this.getClient();
      const selectedVoiceId = voiceId || this.defaultVoiceId;

      logger.info(`Streaming audio: ${text.substring(0, 50)}...`);

      const audio = await client.textToSpeech.convert(selectedVoiceId, {
        text,
        model_id: this.model
      });

      return audio;
    } catch (error) {
      logger.error('Error in streamAudio:', error);
      throw error;
    }
  }

  /**
   * Get available voices from ElevenLabs
   * @returns {Promise<Array>} List of available voices
   */
  async getVoices() {
    try {
      const client = this.getClient();

      logger.info('Fetching available voices');

      const response = await client.voices.getAll();

      const voices = response.voices.map(voice => ({
        voiceId: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        labels: voice.labels,
        previewUrl: voice.preview_url,
        settings: voice.settings
      }));

      logger.info(`Retrieved ${voices.length} voices`);

      return voices;
    } catch (error) {
      logger.error('Error getting voices:', error);
      throw error;
    }
  }

  /**
   * Get specific voice details
   * @param {string} voiceId - ElevenLabs voice ID
   * @returns {Promise<Object>} Voice details
   */
  async getVoice(voiceId) {
    try {
      const client = this.getClient();

      logger.info(`Fetching voice details: ${voiceId}`);

      const voice = await client.voices.get(voiceId);

      return {
        voiceId: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        labels: voice.labels,
        previewUrl: voice.preview_url,
        settings: voice.settings
      };
    } catch (error) {
      logger.error(`Error getting voice ${voiceId}:`, error);
      throw error;
    }
  }

  /**
   * Track usage in database for cost monitoring
   * @param {Object} usage - Usage details
   */
  async trackUsage({ text, voiceId, filename, fileSize, generationTime, model }) {
    try {
      // Calculate approximate cost (ElevenLabs pricing: ~$0.30 per 1000 characters)
      const characterCount = text.length;
      const estimatedCost = (characterCount / 1000) * 0.30;

      await pool.query(
        `INSERT INTO call_costs (
          service_provider,
          service_type,
          cost_amount,
          currency,
          metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          'elevenlabs',
          'text_to_speech',
          estimatedCost,
          'USD',
          JSON.stringify({
            voiceId,
            filename,
            fileSize,
            generationTime,
            characterCount,
            model,
            timestamp: new Date().toISOString()
          })
        ]
      );

      logger.info(`Usage tracked: ${characterCount} characters, estimated cost: $${estimatedCost.toFixed(6)}`);
    } catch (error) {
      logger.error('Error tracking usage:', error);
      // Don't throw - usage tracking failure shouldn't break the main flow
    }
  }

  /**
   * Get audio file path
   * @param {string} filename - Audio filename
   * @returns {string} Full file path
   */
  getAudioPath(filename) {
    return path.join(this.audioDir, filename);
  }

  /**
   * Check if audio file exists
   * @param {string} filename - Audio filename
   * @returns {boolean} True if file exists
   */
  audioFileExists(filename) {
    const filepath = this.getAudioPath(filename);
    return fs.existsSync(filepath);
  }

  /**
   * Delete old audio files (cleanup)
   * @param {number} maxAgeHours - Maximum age in hours (default: 24)
   */
  async cleanupOldAudioFiles(maxAgeHours = 24) {
    try {
      const files = fs.readdirSync(this.audioDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      let deletedCount = 0;

      files.forEach(file => {
        const filepath = path.join(this.audioDir, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
          logger.info(`Deleted old audio file: ${file}`);
        }
      });

      logger.info(`Cleanup complete: deleted ${deletedCount} old audio files`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up audio files:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   * @param {number} days - Number of days to look back (default: 7)
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats(days = 7) {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_requests,
          SUM(cost_amount) as total_cost,
          AVG(cost_amount) as avg_cost_per_request,
          SUM((metadata->>'characterCount')::int) as total_characters,
          AVG((metadata->>'generationTime')::int) as avg_generation_time_ms
        FROM call_costs
        WHERE service_provider = 'elevenlabs'
          AND service_type = 'text_to_speech'
          AND created_at >= NOW() - INTERVAL '${days} days'`
      );

      const stats = result.rows[0];

      return {
        period: `Last ${days} days`,
        totalRequests: parseInt(stats.total_requests) || 0,
        totalCost: parseFloat(stats.total_cost) || 0,
        avgCostPerRequest: parseFloat(stats.avg_cost_per_request) || 0,
        totalCharacters: parseInt(stats.total_characters) || 0,
        avgGenerationTimeMs: parseFloat(stats.avg_generation_time_ms) || 0
      };
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      throw error;
    }
  }
}

export default new ElevenLabsService();
