#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Rate Limiting Test Script
 * Tests all rate limiting configurations
 */

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_KEY = process.env.API_KEY || 'test-api-key-bollalabz-2024';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  log(`Testing: ${name}`, 'blue');
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test 1: General API Rate Limit (100 requests per 15 minutes)
 */
async function testGeneralRateLimit() {
  logTest('General API Rate Limit (100 req/15min)');

  try {
    const requests = [];
    let successCount = 0;
    let rateLimitHit = false;
    let lastHeaders = null;

    // Make 105 requests quickly
    for (let i = 0; i < 105; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1`, {
          headers: { 'X-API-Key': API_KEY }
        });
        successCount++;
        lastHeaders = response.headers;

        if (i % 20 === 0) {
          log(`Request ${i + 1}: Success (Remaining: ${response.headers['ratelimit-remaining'] || 'N/A'})`, 'blue');
        }
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitHit = true;
          logWarning(`Request ${i + 1}: Rate limit hit (429)`);
          log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
          break;
        }
      }
    }

    if (rateLimitHit) {
      logSuccess(`General rate limit working correctly (${successCount} requests succeeded before limit)`);
    } else {
      logWarning(`Sent ${successCount} requests without hitting rate limit`);
    }

    if (lastHeaders) {
      log(`\nRate Limit Headers:`, 'blue');
      log(`  RateLimit-Limit: ${lastHeaders['ratelimit-limit'] || 'N/A'}`, 'blue');
      log(`  RateLimit-Remaining: ${lastHeaders['ratelimit-remaining'] || 'N/A'}`, 'blue');
      log(`  RateLimit-Reset: ${lastHeaders['ratelimit-reset'] || 'N/A'}`, 'blue');
    }

  } catch (error) {
    logError(`General rate limit test failed: ${error.message}`);
  }
}

/**
 * Test 2: Auth Rate Limit (5 requests per 15 minutes)
 */
async function testAuthRateLimit() {
  logTest('Auth Endpoint Rate Limit (5 req/15min)');

  try {
    let successCount = 0;
    let rateLimitHit = false;

    // Make 10 auth requests
    for (let i = 0; i < 10; i++) {
      try {
        // Since we don't have an actual auth endpoint, we'll use a mock
        // In production, test against /api/v1/auth/login
        await axios.post(`${BASE_URL}/api/v1/auth/login`, {
          email: 'test@example.com',
          password: 'test123'
        }, {
          headers: { 'X-API-Key': API_KEY }
        });
        successCount++;
        log(`Auth request ${i + 1}: Success`, 'blue');
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitHit = true;
          logWarning(`Auth request ${i + 1}: Rate limit hit (429)`);
          log(`Response: ${JSON.stringify(error.response.data)}`, 'yellow');
          break;
        } else if (error.response?.status === 404) {
          log(`Auth request ${i + 1}: Endpoint not found (expected for now)`, 'yellow');
          break;
        }
      }
    }

    if (rateLimitHit) {
      logSuccess(`Auth rate limit working correctly (${successCount} requests before limit)`);
    } else {
      logWarning(`Auth endpoint not configured - skipping full test`);
    }

  } catch (error) {
    logError(`Auth rate limit test failed: ${error.message}`);
  }
}

/**
 * Test 3: Webhook Rate Limit (1000 requests per hour)
 */
async function testWebhookRateLimit() {
  logTest('Webhook Rate Limit (1000 req/hour)');

  try {
    let successCount = 0;
    const testRequests = 20; // Test with 20 requests

    log(`Testing with ${testRequests} requests...`, 'blue');

    for (let i = 0; i < testRequests; i++) {
      try {
        const response = await axios.post(`${BASE_URL}/api/v1/integrations/webhook`, {
          source: 'test',
          event: 'test.event',
          payload: { data: 'test' }
        }, {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        successCount++;

        if (i % 5 === 0) {
          log(`Webhook request ${i + 1}: Success`, 'blue');
        }
      } catch (error) {
        if (error.response?.status === 429) {
          logWarning(`Webhook request ${i + 1}: Rate limit hit unexpectedly`);
          break;
        }
      }
    }

    if (successCount === testRequests) {
      logSuccess(`Webhook rate limit allows high throughput (${successCount}/${testRequests} succeeded)`);
    } else {
      logWarning(`Only ${successCount}/${testRequests} webhook requests succeeded`);
    }

  } catch (error) {
    logError(`Webhook rate limit test failed: ${error.message}`);
  }
}

/**
 * Test 4: Rate Limit Headers
 */
async function testRateLimitHeaders() {
  logTest('Rate Limit Headers');

  try {
    const response = await axios.get(`${BASE_URL}/api/v1`, {
      headers: { 'X-API-Key': API_KEY }
    });

    const headers = response.headers;
    const requiredHeaders = [
      'ratelimit-limit',
      'ratelimit-remaining',
      'ratelimit-reset'
    ];

    let allHeadersPresent = true;
    log('\nChecking standard rate limit headers:', 'blue');

    for (const header of requiredHeaders) {
      if (headers[header]) {
        logSuccess(`${header}: ${headers[header]}`);
      } else {
        logError(`${header}: Missing`);
        allHeadersPresent = false;
      }
    }

    // Check custom X-RateLimit headers
    log('\nChecking custom X-RateLimit headers:', 'blue');
    const customHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset'
    ];

    for (const header of customHeaders) {
      if (headers[header]) {
        logSuccess(`${header}: ${headers[header]}`);
      } else {
        logWarning(`${header}: Not present (optional)`);
      }
    }

    if (allHeadersPresent) {
      logSuccess('All required rate limit headers present');
    }

  } catch (error) {
    logError(`Rate limit headers test failed: ${error.message}`);
  }
}

/**
 * Test 5: 429 Response Format
 */
async function test429ResponseFormat() {
  logTest('429 Response Format');

  try {
    // Trigger rate limit by making many requests
    log('Making requests to trigger rate limit...', 'blue');

    for (let i = 0; i < 101; i++) {
      try {
        await axios.get(`${BASE_URL}/api/v1`, {
          headers: { 'X-API-Key': API_KEY }
        });
      } catch (error) {
        if (error.response?.status === 429) {
          log('\n429 Response received:', 'yellow');
          log(JSON.stringify(error.response.data, null, 2), 'yellow');

          const data = error.response.data;
          const requiredFields = ['success', 'error', 'message', 'retryAfter'];

          log('\nValidating response format:', 'blue');
          let allFieldsPresent = true;

          for (const field of requiredFields) {
            if (field in data) {
              logSuccess(`${field}: ${typeof data[field]} - "${data[field]}"`);
            } else {
              logError(`${field}: Missing`);
              allFieldsPresent = false;
            }
          }

          if (allFieldsPresent) {
            logSuccess('429 response format is correct');
          }

          // Check retry-after header
          if (error.response.headers['retry-after']) {
            logSuccess(`Retry-After header: ${error.response.headers['retry-after']}`);
          } else {
            logWarning('Retry-After header not present');
          }

          break;
        }
      }
    }

  } catch (error) {
    logError(`429 response format test failed: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║          BollaLabz Rate Limiting Test Suite               ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  log(`\nBase URL: ${BASE_URL}`, 'blue');
  log(`API Key: ${API_KEY.substring(0, 10)}...`, 'blue');

  // Test if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    logSuccess('Server is running and healthy');
  } catch (error) {
    logError('Server is not responding. Please start the backend server.');
    process.exit(1);
  }

  // Run all tests
  await testRateLimitHeaders();
  await sleep(1000);

  await testWebhookRateLimit();
  await sleep(1000);

  await testAuthRateLimit();
  await sleep(1000);

  await test429ResponseFormat();
  await sleep(1000);

  // Note: General rate limit test should be last as it will hit the limit
  // await testGeneralRateLimit();

  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'green');
  log('║              Rate Limiting Tests Complete                 ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝', 'green');
  console.log('\n');

  log('Note: General rate limit test is commented out to avoid exhausting limits.', 'yellow');
  log('Uncomment the test in the script if you want to test full limit exhaustion.', 'yellow');
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
