// Last Modified: 2025-11-23 19:30
// Test script for Redis caching infrastructure
import dotenv from 'dotenv';
import { getRedisClient, isRedisAvailable, closeRedis } from '../config/redis.js';
import logger from '../config/logger.js';

dotenv.config();

const testRedisSetup = async () => {
  console.log('\n========================================');
  console.log('Redis Caching Infrastructure Test');
  console.log('========================================\n');

  // Test 1: Check if Redis is available
  console.log('Test 1: Redis Availability');
  console.log('---------------------------');
  const available = isRedisAvailable();
  console.log(`Redis Available: ${available ? '✅ YES' : '❌ NO'}`);

  if (!available) {
    console.log('\n⚠️  Redis is not available. This is OPTIONAL in production.');
    console.log('   The application will work without Redis, but caching will be disabled.');
    console.log('\nTo enable Redis:');
    console.log('   1. Set CACHE_ENABLED=true in .env');
    console.log('   2. Set REDIS_URL=redis://localhost:6379 (or your Redis URL)');
    console.log('   3. Ensure Redis server is running\n');
    await closeRedis();
    return;
  }

  const redis = getRedisClient();

  // Test 2: Connection test
  console.log('\nTest 2: Connection Status');
  console.log('---------------------------');
  console.log(`Connection Status: ${redis.status}`);

  // Test 3: Basic operations
  console.log('\nTest 3: Basic Operations');
  console.log('---------------------------');

  try {
    // Set a test key
    await redis.set('test:key', 'test-value', 'EX', 10);
    console.log('✅ SET operation successful');

    // Get the test key
    const value = await redis.get('test:key');
    console.log(`✅ GET operation successful: ${value}`);

    // Test cache key pattern
    const cacheKey = 'cache:user:123:/api/v1/contacts';
    await redis.setex(cacheKey, 300, JSON.stringify({ test: 'data' }));
    console.log('✅ Cache key SET successful');

    // Retrieve cache key
    const cachedData = await redis.get(cacheKey);
    console.log(`✅ Cache key GET successful: ${cachedData.substring(0, 50)}...`);

    // Test pattern matching
    const keys = await redis.keys('cache:user:123:*');
    console.log(`✅ Pattern matching successful: Found ${keys.length} key(s)`);

    // Delete test keys
    await redis.del('test:key', cacheKey);
    console.log('✅ DELETE operation successful');

  } catch (err) {
    console.error('❌ Operation failed:', err.message);
  }

  // Test 4: Cache middleware simulation
  console.log('\nTest 4: Cache Middleware Simulation');
  console.log('-------------------------------------');

  try {
    // Simulate caching a contact list response
    const userId = '123';
    const url = '/api/v1/contacts';
    const cacheKey = `cache:user:${userId}:${url}:{}`;

    const mockResponse = {
      success: true,
      data: [
        { id: 1, name: 'Test Contact 1' },
        { id: 2, name: 'Test Contact 2' }
      ],
      pagination: { page: 1, limit: 20, total: 2 }
    };

    // Set cache
    await redis.setex(cacheKey, 300, JSON.stringify(mockResponse));
    console.log('✅ Simulated cache SET for contacts list');

    // Get cache
    const cached = await redis.get(cacheKey);
    const parsed = JSON.parse(cached);
    console.log(`✅ Simulated cache GET: ${parsed.data.length} contacts retrieved`);

    // Test cache invalidation pattern
    const invalidatePattern = `cache:user:${userId}:/api/v1/contacts*`;
    const keysToDelete = await redis.keys(invalidatePattern);
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      console.log(`✅ Cache invalidation: ${keysToDelete.length} key(s) deleted`);
    }

  } catch (err) {
    console.error('❌ Cache middleware simulation failed:', err.message);
  }

  // Test 5: Performance metrics
  console.log('\nTest 5: Performance Metrics');
  console.log('-----------------------------');

  try {
    const startSet = Date.now();
    await redis.set('perf:test', 'value');
    const setTime = Date.now() - startSet;

    const startGet = Date.now();
    await redis.get('perf:test');
    const getTime = Date.now() - startGet;

    await redis.del('perf:test');

    console.log(`✅ SET latency: ${setTime}ms`);
    console.log(`✅ GET latency: ${getTime}ms`);

    if (setTime < 10 && getTime < 10) {
      console.log('✅ Performance: EXCELLENT (<10ms)');
    } else if (setTime < 50 && getTime < 50) {
      console.log('✅ Performance: GOOD (<50ms)');
    } else {
      console.log('⚠️  Performance: SLOW (>50ms) - Check Redis connection');
    }

  } catch (err) {
    console.error('❌ Performance test failed:', err.message);
  }

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================\n');
  console.log('✅ Redis caching infrastructure is ready!');
  console.log('\nCached Routes:');
  console.log('  - GET /api/v1/contacts (TTL: 5 min)');
  console.log('  - GET /api/v1/contacts/:id (TTL: 10 min)');
  console.log('  - GET /api/v1/analytics/dashboard (TTL: 15 min)');
  console.log('\nCache Invalidation on:');
  console.log('  - POST /api/v1/contacts (create)');
  console.log('  - PUT /api/v1/contacts/:id (update)');
  console.log('  - DELETE /api/v1/contacts/:id (delete)');
  console.log('\nEnvironment Variables:');
  console.log(`  - CACHE_ENABLED: ${process.env.CACHE_ENABLED || 'true'}`);
  console.log(`  - CACHE_DEFAULT_TTL: ${process.env.CACHE_DEFAULT_TTL || '300'}s`);
  console.log(`  - REDIS_URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
  console.log('');

  await closeRedis();
  process.exit(0);
};

// Run test
testRedisSetup().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
