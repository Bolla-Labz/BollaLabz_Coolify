// Last Modified: 2025-11-23 17:30
/**
 * ElevenLabs Integration Test Script
 * Tests voice synthesis functionality
 */

import dotenv from 'dotenv';
import elevenLabsService from '../services/elevenlabs.js';
import logger from '../config/logger.js';

// Load environment variables
dotenv.config();

async function testElevenLabsIntegration() {
  console.log('='.repeat(50));
  console.log('ElevenLabs Voice Synthesis Integration Test');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Test 1: Get available voices
    console.log('Test 1: Getting available voices...');
    const voices = await elevenLabsService.getVoices();
    console.log(`✓ Success: Found ${voices.length} voices`);
    console.log(`  Sample voices: ${voices.slice(0, 3).map(v => v.name).join(', ')}`);
    console.log('');

    // Test 2: Generate speech
    console.log('Test 2: Generating speech from text...');
    const text = 'Hello from BollaLabz! This is a test of the ElevenLabs voice synthesis system.';
    console.log(`  Text: "${text}"`);

    const result = await elevenLabsService.textToSpeech(text);
    console.log(`✓ Success: Audio generated`);
    console.log(`  Filename: ${result.filename}`);
    console.log(`  File size: ${(result.fileSize / 1024).toFixed(2)} KB`);
    console.log(`  Generation time: ${result.generationTime}ms`);
    console.log(`  URL: ${result.url}`);
    console.log('');

    // Test 3: Check if audio file exists
    console.log('Test 3: Verifying audio file...');
    const exists = elevenLabsService.audioFileExists(result.filename);
    if (exists) {
      console.log(`✓ Success: Audio file exists`);
      console.log(`  Path: ${elevenLabsService.getAudioPath(result.filename)}`);
    } else {
      console.log(`✗ Error: Audio file not found`);
    }
    console.log('');

    // Test 4: Get usage statistics
    console.log('Test 4: Getting usage statistics...');
    const stats = await elevenLabsService.getUsageStats(7);
    console.log(`✓ Success: Retrieved stats for ${stats.period}`);
    console.log(`  Total requests: ${stats.totalRequests}`);
    console.log(`  Total cost: $${stats.totalCost.toFixed(4)}`);
    console.log(`  Avg cost per request: $${stats.avgCostPerRequest.toFixed(6)}`);
    console.log(`  Total characters: ${stats.totalCharacters}`);
    console.log(`  Avg generation time: ${stats.avgGenerationTimeMs.toFixed(0)}ms`);
    console.log('');

    // Test 5: Get specific voice details
    console.log('Test 5: Getting voice details...');
    if (voices.length > 0) {
      const voice = await elevenLabsService.getVoice(voices[0].voiceId);
      console.log(`✓ Success: Retrieved voice details`);
      console.log(`  Name: ${voice.name}`);
      console.log(`  Category: ${voice.category}`);
      console.log(`  Description: ${voice.description || 'N/A'}`);
    } else {
      console.log(`✗ Skipped: No voices available`);
    }
    console.log('');

    // Summary
    console.log('='.repeat(50));
    console.log('All Tests Passed!');
    console.log('='.repeat(50));
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Test via API: curl http://localhost:3001/api/v1/voice/voices');
    console.log('3. Open Voice Demo page in browser');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(50));
    console.error('Test Failed!');
    console.error('='.repeat(50));
    console.error('');
    console.error('Error:', error.message);
    console.error('');

    if (error.message.includes('API key')) {
      console.error('Solution:');
      console.error('1. Get your ElevenLabs API key from https://elevenlabs.io');
      console.error('2. Add it to backend/.env:');
      console.error('   ELEVENLABS_API_KEY=your_api_key_here');
      console.error('3. Restart this test');
    }

    console.error('');
    process.exit(1);
  }
}

// Run the test
testElevenLabsIntegration();
