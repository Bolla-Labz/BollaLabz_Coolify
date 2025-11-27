// Last Modified: 2025-11-23 17:30
/**
 * Logger Utility (JavaScript)
 * Simple console-based logging
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    this.level = LogLevel.INFO;
  }

  setLevel(level) {
    this.level = level;
  }

  debug(message, ...args) {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message, error, ...args) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  integration(service, message, ...args) {
    this.info(`[${service.toUpperCase()}] ${message}`, ...args);
  }

  webhook(source, event, ...args) {
    this.info(`[WEBHOOK:${source}] ${event}`, ...args);
  }

  cost(service, amount, ...args) {
    this.info(`[COST:${service}] $${amount.toFixed(6)}`, ...args);
  }
}

const logger = new Logger();

// Set log level from environment
if (process.env.LOG_LEVEL) {
  const level = LogLevel[process.env.LOG_LEVEL.toUpperCase()];
  if (level !== undefined) {
    logger.setLevel(level);
  }
}

export default logger;
