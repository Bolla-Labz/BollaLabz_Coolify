#!/usr/bin/env node
// Last Modified: 2025-11-23 17:30
/**
 * Generate Secure Secrets for BollaLabz Backend
 * Use this script to generate cryptographically secure secrets for .env file
 */

import crypto from 'crypto';

console.log('='.repeat(70));
console.log('  BollaLabz Security - Secret Generator');
console.log('='.repeat(70));
console.log('');
console.log('Copy these secrets to your .env file:');
console.log('');
console.log('# JWT Authentication Secrets (64 characters each)');
console.log(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('');
console.log('# API Key (32 characters)');
console.log(`API_KEY=${crypto.randomBytes(32).toString('hex')}`);
console.log('');
console.log('# Session Secret (32 characters)');
console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('');
console.log('='.repeat(70));
console.log('SECURITY WARNINGS:');
console.log('1. Never commit .env file to version control');
console.log('2. JWT_SECRET and JWT_REFRESH_SECRET must be different');
console.log('3. Rotate secrets every 90 days');
console.log('4. Store secrets securely (AWS Secrets Manager, etc.)');
console.log('='.repeat(70));
