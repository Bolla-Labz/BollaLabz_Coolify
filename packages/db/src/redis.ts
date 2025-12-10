/**
 * Redis Client Configuration
 * Provides Redis connection for caching and BullMQ job queues
 */

import Redis from "ioredis";

// Lazy configuration - built when first accessed
function getRedisConfig() {
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
    db: Number(process.env.REDIS_DB) || 0,
    maxRetriesPerRequest: null as null, // Required for BullMQ compatibility
    enableReadyCheck: false, // Faster connection
    lazyConnect: true, // Don't connect until first command
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error("[Redis] Max retry attempts reached, giving up");
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      console.warn(`[Redis] Connection retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  };
}

// Lazy singleton Redis instance for general caching
let _redis: Redis | null = null;

function getRedisInstance(): Redis {
  if (_redis) return _redis;

  const config = getRedisConfig();
  _redis = new Redis(config);

  // Event handlers for monitoring
  _redis.on("connect", () => {
    console.log("[Redis] Connected to server");
  });

  _redis.on("ready", () => {
    console.log("[Redis] Ready to accept commands");
  });

  _redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  _redis.on("close", () => {
    console.warn("[Redis] Connection closed");
  });

  _redis.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
  });

  return _redis;
}

// Export redis as a getter that initializes on first access
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const instance = getRedisInstance();
    const value = instance[prop as keyof Redis];
    return typeof value === "function" ? (value as Function).bind(instance) : value;
  },
});

/**
 * Creates a new Redis connection
 * Use this for BullMQ workers (each worker needs its own connection)
 */
export function createRedisConnection(): Redis {
  const config = getRedisConfig();
  const connection = new Redis(config);

  connection.on("error", (err) => {
    console.error("[Redis Worker] Connection error:", err.message);
  });

  return connection;
}

/**
 * Health check for Redis connection
 * Returns true if Redis is responsive, false otherwise
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    console.error("[Redis] Health check failed:", error);
    return false;
  }
}

/**
 * Get Redis connection info for diagnostics
 */
export async function getRedisInfo(): Promise<{
  connected: boolean;
  memory?: string;
  clients?: string;
  uptime?: string;
}> {
  try {
    const info = await redis.info("server");
    const memoryInfo = await redis.info("memory");
    const clientsInfo = await redis.info("clients");

    const parseInfo = (str: string, key: string): string | undefined => {
      const match = str.match(new RegExp(`${key}:(.+)`));
      return match && match[1] ? match[1].trim() : undefined;
    };

    const result: {
      connected: boolean;
      memory?: string;
      clients?: string;
      uptime?: string;
    } = { connected: true };

    const memory = parseInfo(memoryInfo, "used_memory_human");
    if (memory) result.memory = memory;

    const clients = parseInfo(clientsInfo, "connected_clients");
    if (clients) result.clients = clients;

    const uptime = parseInfo(info, "uptime_in_seconds");
    if (uptime) result.uptime = uptime;

    return result;
  } catch {
    return { connected: false };
  }
}

/**
 * Graceful shutdown for Redis connections
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    await redis.quit();
    console.log("[Redis] Connection closed gracefully");
  } catch (error) {
    console.error("[Redis] Error during shutdown:", error);
    redis.disconnect();
  }
}

export type { Redis };
