// Last Modified: 2025-11-23 17:30
// Jest Setup File for Backend Tests
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test database URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://admin:testpassword@localhost:5432/bollalabz_test';
}

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce test output noise
// Note: In ES modules, jest is available globally but can't be used in top-level scope
// These mocks will be applied in beforeAll hooks in test files if needed

// Global test timeout - will be set in jest.config.js instead

// Clean up after all tests
afterAll(async () => {
  // Close database connections, etc.
  await new Promise(resolve => setTimeout(resolve, 500));
});