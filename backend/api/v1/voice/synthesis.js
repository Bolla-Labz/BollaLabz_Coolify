// Last Modified: 2025-11-23 17:30
/**
 * Voice Synthesis API Endpoints
 * ElevenLabs text-to-speech integration
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import path from 'path';
import elevenLabsService from '../../../services/elevenlabs.js';
import logger from '../../../config/logger.js';
import { authenticateJWT } from '../../../middleware/auth.js';
import { costControlMiddleware, SERVICE_TYPES } from '../../../middleware/costControl.js';

const router = express.Router();

/**
 * @route   POST /api/v1/voice/synthesis
 * @desc    Convert text to speech
 * @access  Private
 * @security Cost control: Daily ElevenLabs API limit enforced
 */
router.post(
  '/synthesis',
  authenticateJWT,
  costControlMiddleware(SERVICE_TYPES.ELEVENLABS),
  [
    body('text')
      .notEmpty()
      .withMessage('Text is required')
      .isLength({ max: 5000 })
      .withMessage('Text must be less than 5000 characters'),
    body('voiceId')
      .optional()
      .isString()
      .withMessage('Voice ID must be a string'),
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be an object'),
    body('settings.stability')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Stability must be between 0 and 1'),
    body('settings.similarityBoost')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Similarity boost must be between 0 and 1'),
    body('settings.style')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Style must be between 0 and 1'),
    body('settings.useSpeakerBoost')
      .optional()
      .isBoolean()
      .withMessage('Use speaker boost must be a boolean')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { text, voiceId, settings } = req.body;

      // Convert text to speech
      const result = await elevenLabsService.textToSpeech(text, voiceId, settings);

      logger.info(`Text-to-speech successful: ${result.filename}`);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in /synthesis endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate speech',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/voice/voices
 * @desc    Get list of available voices
 * @access  Private
 */
router.get('/voices', async (req, res) => {
  try {
    const voices = await elevenLabsService.getVoices();

    res.status(200).json({
      success: true,
      count: voices.length,
      data: voices
    });
  } catch (error) {
    logger.error('Error in /voices endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voices',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/voice/voices/:voiceId
 * @desc    Get specific voice details
 * @access  Private
 */
router.get(
  '/voices/:voiceId',
  [
    param('voiceId')
      .notEmpty()
      .withMessage('Voice ID is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { voiceId } = req.params;

      const voice = await elevenLabsService.getVoice(voiceId);

      res.status(200).json({
        success: true,
        data: voice
      });
    } catch (error) {
      logger.error(`Error in /voices/${req.params.voiceId} endpoint:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve voice details',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/voice/audio/:filename
 * @desc    Serve audio file
 * @access  Private
 */
router.get(
  '/audio/:filename',
  [
    param('filename')
      .notEmpty()
      .withMessage('Filename is required')
      .matches(/^speech_\d+\.mp3$/)
      .withMessage('Invalid filename format')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { filename } = req.params;

      // Check if file exists
      if (!elevenLabsService.audioFileExists(filename)) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      const filepath = elevenLabsService.getAudioPath(filename);

      // Set headers for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

      // Send file
      res.sendFile(filepath);
    } catch (error) {
      logger.error(`Error serving audio file ${req.params.filename}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to serve audio file',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/v1/voice/audio/:filename
 * @desc    Delete audio file
 * @access  Private
 */
router.delete(
  '/audio/:filename',
  [
    param('filename')
      .notEmpty()
      .withMessage('Filename is required')
      .matches(/^speech_\d+\.mp3$/)
      .withMessage('Invalid filename format')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { filename } = req.params;

      // Check if file exists
      if (!elevenLabsService.audioFileExists(filename)) {
        return res.status(404).json({
          success: false,
          message: 'Audio file not found'
        });
      }

      const filepath = elevenLabsService.getAudioPath(filename);

      // Delete file
      const fs = await import('fs');
      fs.unlinkSync(filepath);

      logger.info(`Deleted audio file: ${filename}`);

      res.status(200).json({
        success: true,
        message: 'Audio file deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting audio file ${req.params.filename}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete audio file',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/voice/stats
 * @desc    Get usage statistics
 * @access  Private
 */
router.get(
  '/stats',
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const days = parseInt(req.query.days) || 7;

      const stats = await elevenLabsService.getUsageStats(days);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in /stats endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/voice/cleanup
 * @desc    Clean up old audio files
 * @access  Private (admin only)
 */
router.post(
  '/cleanup',
  [
    body('maxAgeHours')
      .optional()
      .isInt({ min: 1, max: 720 })
      .withMessage('Max age must be between 1 and 720 hours')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const maxAgeHours = parseInt(req.body.maxAgeHours) || 24;

      const deletedCount = await elevenLabsService.cleanupOldAudioFiles(maxAgeHours);

      res.status(200).json({
        success: true,
        message: `Cleanup complete: deleted ${deletedCount} files`,
        deletedCount
      });
    } catch (error) {
      logger.error('Error in /cleanup endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup audio files',
        error: error.message
      });
    }
  }
);

export default router;
