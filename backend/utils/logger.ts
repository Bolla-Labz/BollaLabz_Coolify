// Last Modified: 2025-11-23 17:30
/**
 * Logging Utility
 * Consistent logging across all integrations
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  integration(service: string, message: string, ...args: any[]): void {
    this.info(`[${service.toUpperCase()}] ${message}`, ...args);
  }

  webhook(source: string, event: string, ...args: any[]): void {
    this.info(`[WEBHOOK:${source}] ${event}`, ...args);
  }

  cost(service: string, amount: number, ...args: any[]): void {
    this.info(`[COST:${service}] $${amount.toFixed(6)}`, ...args);
  }
}

export const logger = new Logger();

// Set log level from environment
if (process.env.LOG_LEVEL) {
  const level = LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel];
  if (level !== undefined) {
    logger.setLevel(level);
  }
}
