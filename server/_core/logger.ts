/**
 * Production-Safe Logger
 * 
 * Provides structured logging that:
 * 1. Sanitizes sensitive data automatically
 * 2. Respects log levels based on environment
 * 3. Adds timestamps and context
 * 4. Can be easily integrated with external logging services
 */

import { sanitizeForLog, sanitizeError } from './log-sanitizer';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Environment-based log level threshold
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
function getMinLogLevel(): LogLevel {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  
  if (configuredLevel && LOG_LEVEL_PRIORITY[configuredLevel] !== undefined) {
    return configuredLevel;
  }
  
  // Default: debug in development, info in production
  return env === 'production' ? 'info' : 'debug';
}

const MIN_LOG_LEVEL = getMinLogLevel();

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

/**
 * Production-safe logger instance
 */
export const logger = {
  /**
   * Debug level - only in development
   */
  debug(context: string, message: string, data?: unknown): void {
    if (!shouldLog('debug')) return;
    
    const formatted = formatMessage('debug', context, message);
    if (data !== undefined) {
      console.log(formatted, sanitizeForLog(data));
    } else {
      console.log(formatted);
    }
  },

  /**
   * Info level - general operational messages
   */
  info(context: string, message: string, data?: unknown): void {
    if (!shouldLog('info')) return;
    
    const formatted = formatMessage('info', context, message);
    if (data !== undefined) {
      console.log(formatted, sanitizeForLog(data));
    } else {
      console.log(formatted);
    }
  },

  /**
   * Warn level - potential issues
   */
  warn(context: string, message: string, data?: unknown): void {
    if (!shouldLog('warn')) return;
    
    const formatted = formatMessage('warn', context, message);
    if (data !== undefined) {
      console.warn(formatted, sanitizeForLog(data));
    } else {
      console.warn(formatted);
    }
  },

  /**
   * Error level - errors and exceptions
   */
  error(context: string, message: string, error?: unknown): void {
    if (!shouldLog('error')) return;
    
    const formatted = formatMessage('error', context, message);
    if (error !== undefined) {
      if (error instanceof Error) {
        console.error(formatted, sanitizeError(error));
      } else {
        console.error(formatted, sanitizeForLog(error));
      }
    } else {
      console.error(formatted);
    }
  },

  /**
   * Security-related logs - always logged regardless of level
   */
  security(context: string, message: string, data?: unknown): void {
    const formatted = formatMessage('warn', `SECURITY:${context}`, message);
    if (data !== undefined) {
      console.warn(formatted, sanitizeForLog(data));
    } else {
      console.warn(formatted);
    }
  },

  /**
   * Audit logs for compliance - always logged
   */
  audit(context: string, action: string, details: Record<string, unknown>): void {
    const formatted = formatMessage('info', `AUDIT:${context}`, action);
    console.log(formatted, sanitizeForLog({
      ...details,
      timestamp: new Date().toISOString(),
    }));
  },
};

/**
 * Create a scoped logger for a specific module
 */
export function createLogger(moduleName: string) {
  return {
    debug: (message: string, data?: unknown) => logger.debug(moduleName, message, data),
    info: (message: string, data?: unknown) => logger.info(moduleName, message, data),
    warn: (message: string, data?: unknown) => logger.warn(moduleName, message, data),
    error: (message: string, error?: unknown) => logger.error(moduleName, message, error),
    security: (message: string, data?: unknown) => logger.security(moduleName, message, data),
    audit: (action: string, details: Record<string, unknown>) => logger.audit(moduleName, action, details),
  };
}

export default logger;
