#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Twilio Integration Test Script
 * Tests all Twilio SMS endpoints and functionality
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'bollalabz-secret-api-key';

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`Testing: ${name}...`, 'yellow');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...options.headers
      }
    });

    const data = await response.json();

    if (response.ok) {
      log(`✓ ${name} - PASSED`, 'green');
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      log(`✗ ${name} - FAILED (${response.status})`, 'red');
      console.log('Error:', JSON.stringify(data, null, 2));
      return { success: false, data };
    }
  } catch (error) {
    log(`✗ ${name} - ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  logSection('BollaLabz Twilio SMS Integration Test Suite');

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Health Check
  logSection('Test 1: Server Health Check');
  const healthCheck = await testEndpoint(
    'Health Check',
    `${API_BASE_URL}/health`,
    { method: 'GET' }
  );
  testResults.total++;
  if (healthCheck.success) testResults.passed++;
  else testResults.failed++;

  // Test 2: API Info
  logSection('Test 2: API Information');
  const apiInfo = await testEndpoint(
    'API Info',
    `${API_BASE_URL}/api/v1`,
    { method: 'GET' }
  );
  testResults.total++;
  if (apiInfo.success) testResults.passed++;
  else testResults.failed++;

  // Test 3: Webhook Test Endpoint
  logSection('Test 3: Webhook Test Endpoint (No Auth Required)');
  const webhookTest = await testEndpoint(
    'Webhook Test',
    `${API_BASE_URL}/api/v1/webhooks/twilio/test`,
    {
      method: 'GET',
      headers: {} // No API key for webhook endpoint
    }
  );
  testResults.total++;
  if (webhookTest.success) testResults.passed++;
  else testResults.failed++;

  // Test 4: Get Messages (Empty)
  logSection('Test 4: Get Message History');
  const getMessages = await testEndpoint(
    'Get Messages',
    `${API_BASE_URL}/api/v1/messages?limit=10`,
    { method: 'GET' }
  );
  testResults.total++;
  if (getMessages.success) testResults.passed++;
  else testResults.failed++;

  // Test 5: Get SMS Costs
  logSection('Test 5: Get SMS Costs');
  const getCosts = await testEndpoint(
    'Get SMS Costs',
    `${API_BASE_URL}/api/v1/messages/costs`,
    { method: 'GET' }
  );
  testResults.total++;
  if (getCosts.success) testResults.passed++;
  else testResults.failed++;

  // Test 6: Send SMS (Will fail if Twilio not configured - expected)
  logSection('Test 6: Send SMS (Expected to fail without Twilio credentials)');
  const sendSMS = await testEndpoint(
    'Send SMS',
    `${API_BASE_URL}/api/v1/messages/send`,
    {
      method: 'POST',
      body: JSON.stringify({
        to: '+1234567890',
        message: 'Test message from BollaLabz'
      })
    }
  );
  testResults.total++;
  // We expect this to fail if Twilio is not configured
  if (sendSMS.data?.error === 'SMS service not available') {
    log('⚠ Twilio not configured (expected in development)', 'yellow');
    testResults.passed++;
  } else if (sendSMS.success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  // Test 7: Invalid Phone Number Format
  logSection('Test 7: Invalid Phone Number Format (Should Fail)');
  const invalidPhone = await testEndpoint(
    'Invalid Phone Number',
    `${API_BASE_URL}/api/v1/messages/send`,
    {
      method: 'POST',
      body: JSON.stringify({
        to: '1234567890', // Missing + prefix
        message: 'Test message'
      })
    }
  );
  testResults.total++;
  // Should fail validation
  if (!invalidPhone.success && invalidPhone.data?.error === 'Validation failed') {
    log('✓ Validation working correctly', 'green');
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  // Test 8: Missing Message Content
  logSection('Test 8: Missing Message Content (Should Fail)');
  const missingMessage = await testEndpoint(
    'Missing Message Content',
    `${API_BASE_URL}/api/v1/messages/send`,
    {
      method: 'POST',
      body: JSON.stringify({
        to: '+1234567890'
        // Missing message field
      })
    }
  );
  testResults.total++;
  // Should fail validation
  if (!missingMessage.success && missingMessage.data?.error === 'Validation failed') {
    log('✓ Validation working correctly', 'green');
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  // Final Results
  logSection('Test Results Summary');
  console.log('');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  console.log('');

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 85 ? 'green' : 'red');
  console.log('');

  // Configuration Check
  logSection('Configuration Status');
  console.log('');
  log(`API Base URL: ${API_BASE_URL}`, 'blue');
  log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Configured' : '✗ Not Configured'}`,
    process.env.TWILIO_ACCOUNT_SID ? 'green' : 'yellow');
  log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✓ Configured' : '✗ Not Configured'}`,
    process.env.TWILIO_AUTH_TOKEN ? 'green' : 'yellow');
  log(`Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER || 'Not Configured'}`,
    process.env.TWILIO_PHONE_NUMBER ? 'blue' : 'yellow');
  console.log('');

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    log('⚠ To enable SMS functionality, configure Twilio credentials in .env:', 'yellow');
    console.log('  TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('  TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('  TWILIO_PHONE_NUMBER=+1234567890');
  }

  console.log('');
  logSection('Next Steps');
  console.log('');
  console.log('1. Configure Twilio credentials in .env file');
  console.log('2. Set up Twilio webhook URL: https://bollalabz.com/api/v1/webhooks/twilio/sms');
  console.log('3. Set up status callback URL: https://bollalabz.com/api/v1/webhooks/twilio/status');
  console.log('4. Test sending real SMS messages');
  console.log('5. Test receiving inbound SMS');
  console.log('');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
