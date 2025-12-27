/**
 * Global Error Handler
 * Catches ALL unhandled exceptions and routes them to the self-healing system
 */

import { nanoid } from "nanoid";

export interface ErrorContext {
  errorId: string;
  timestamp: Date;
  error: Error;
  errorType: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

export type ErrorHandler = (context: ErrorContext) => void | Promise<void>;

/**
 * Global Error Handler
 * Singleton that manages all error handling in the application
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private handlers: ErrorHandler[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Initialize global error handlers
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn("[GlobalErrorHandler] Already initialized");
      return;
    }

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      console.error("[GlobalErrorHandler] Uncaught Exception:", error);
      
      this.handleError({
        errorId: nanoid(),
        timestamp: new Date(),
        error,
        errorType: "uncaught_exception",
        severity: "critical",
        source: "process",
        context: {
          type: "uncaughtException",
        },
      });

      // Give handlers time to process before exiting
      setTimeout(() => {
        console.error("[GlobalErrorHandler] Exiting due to uncaught exception");
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      console.error("[GlobalErrorHandler] Unhandled Rejection:", reason);

      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      this.handleError({
        errorId: nanoid(),
        timestamp: new Date(),
        error,
        errorType: "unhandled_rejection",
        severity: "high",
        source: "promise",
        context: {
          type: "unhandledRejection",
          reason: String(reason),
        },
      });
    });

    // Handle warnings
    process.on("warning", (warning: Error) => {
      console.warn("[GlobalErrorHandler] Warning:", warning);
      
      this.handleError({
        errorId: nanoid(),
        timestamp: new Date(),
        error: warning,
        errorType: "warning",
        severity: "low",
        source: "process",
        context: {
          type: "warning",
        },
      });
    });

    this.isInitialized = true;
    console.log("[GlobalErrorHandler] Initialized successfully");
  }

  /**
   * Register an error handler
   */
  registerHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Handle an error by notifying all registered handlers
   */
  async handleError(context: ErrorContext): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(context);
      } catch (err) {
        console.error("[GlobalErrorHandler] Handler failed:", err);
      }
    }
  }

  /**
   * Categorize error severity based on error type and message
   */
  categorizeSeverity(error: Error): "low" | "medium" | "high" | "critical" {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Critical errors
    if (
      name.includes("syntaxerror") ||
      name.includes("referenceerror") ||
      message.includes("cannot read property") ||
      message.includes("is not a function") ||
      message.includes("database") ||
      message.includes("connection")
    ) {
      return "critical";
    }

    // High severity errors
    if (
      message.includes("timeout") ||
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
    ) {
      return "high";
    }

    // Medium severity errors
    if (
      message.includes("not found") ||
      message.includes("invalid") ||
      message.includes("failed")
    ) {
      return "medium";
    }

    // Default to low
    return "low";
  }

  /**
   * Determine error category
   */
  categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes("timeout")) return "timeout";
    if (message.includes("connection") || message.includes("econnrefused"))
      return "connection";
    if (message.includes("rate limit")) return "rate_limit";
    if (message.includes("quota")) return "quota_exceeded";
    if (message.includes("database")) return "database";
    if (message.includes("redis")) return "cache";
    if (message.includes("storage") || message.includes("s3")) return "storage";
    if (name.includes("typeerror")) return "type_error";
    if (name.includes("referenceerror")) return "reference_error";
    if (name.includes("syntaxerror")) return "syntax_error";

    return "unknown";
  }
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: {
    source: string;
    userId?: string;
    requestId?: string;
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handler = GlobalErrorHandler.getInstance();
      const err = error instanceof Error ? error : new Error(String(error));

      await handler.handleError({
        errorId: nanoid(),
        timestamp: new Date(),
        error: err,
        errorType: handler.categorizeError(err),
        severity: handler.categorizeSeverity(err),
        source: context.source,
        context: {
          args: args.map((arg) => {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }),
        },
        userId: context.userId,
        requestId: context.requestId,
      });

      throw error;
    }
  }) as T;
}

/**
 * Wrap sync functions with error handling
 */
export function withErrorHandlingSync<T extends (...args: any[]) => any>(
  fn: T,
  context: {
    source: string;
    userId?: string;
    requestId?: string;
  }
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      const handler = GlobalErrorHandler.getInstance();
      const err = error instanceof Error ? error : new Error(String(error));

      handler.handleError({
        errorId: nanoid(),
        timestamp: new Date(),
        error: err,
        errorType: handler.categorizeError(err),
        severity: handler.categorizeSeverity(err),
        source: context.source,
        context: {
          args: args.map((arg) => {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }),
        },
        userId: context.userId,
        requestId: context.requestId,
      });

      throw error;
    }
  }) as T;
}
