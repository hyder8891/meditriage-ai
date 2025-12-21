/**
 * AEC Sentinel Layer - Error Detection and Monitoring
 * 
 * This layer actively monitors for errors across the application:
 * - Server-side errors (Express middleware)
 * - API errors (tRPC errors)
 * - 404 errors (missing routes)
 * - Uncaught exceptions
 * - Unhandled promise rejections
 */

import { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { aecDetectedErrors } from "../../drizzle/schema";
import { sendCriticalErrorAlert } from "./alerts/notification-service";
import { eq } from "drizzle-orm";
import { sanitizeForLog } from "../_core/log-sanitizer";

/**
 * Detect and log an error to the AEC system
 */
export async function detectError(errorData: {
  errorType: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stackTrace?: string;
  source?: string;
  endpoint?: string;
  userContext?: any;
}) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[AEC Sentinel] Database not available");
      return null;
    }

    // Sanitize user context before logging to prevent sensitive data leaks
    const sanitizedContext = errorData.userContext ? sanitizeForLog(errorData.userContext) : undefined;
    
    console.log(`[AEC Sentinel] Detecting error: ${errorData.errorType} (${errorData.severity})`);

    // Check if this error already exists
    const existingErrors = await db
      .select()
      .from(aecDetectedErrors)
      .where(eq(aecDetectedErrors.errorType, errorData.errorType))
      .limit(1);

    let errorId: number;

    if (existingErrors.length > 0) {
      // Update existing error
      const existing = existingErrors[0];
      errorId = existing.id;

      await db
        .update(aecDetectedErrors)
        .set({
          lastOccurrence: new Date(),
          occurrenceCount: existing.occurrenceCount + 1,
          message: errorData.message, // Update with latest message
          stackTrace: errorData.stackTrace,
        })
        .where(eq(aecDetectedErrors.id, errorId));

      console.log(`[AEC Sentinel] Updated existing error #${errorId} (occurrence count: ${existing.occurrenceCount + 1})`);
    } else {
      // Insert new error
      const [result] = await db.insert(aecDetectedErrors).values({
        errorType: errorData.errorType,
        severity: errorData.severity,
        message: errorData.message,
        stackTrace: errorData.stackTrace,
        source: errorData.source,
        endpoint: errorData.endpoint,
        // Store sanitized context to prevent PHI/PII leaks
        userContext: sanitizedContext ? JSON.stringify(sanitizedContext) : undefined,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        occurrenceCount: 1,
        status: "detected",
      });

      errorId = result.insertId;
      console.log(`[AEC Sentinel] New error detected #${errorId}`);

      // Send alert for critical errors
      if (errorData.severity === "critical" || errorData.severity === "high") {
        console.log(`[AEC Sentinel] Sending alert for ${errorData.severity} error`);
        await sendCriticalErrorAlert(errorId);
      }
    }

    return errorId;
  } catch (error) {
    console.error("[AEC Sentinel] Error logging to database:", error);
    return null;
  }
}

/**
 * Express middleware to catch 404 errors
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  // Skip API routes - they handle their own 404s
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Log 404 error to AEC
  detectError({
    errorType: "ROUTE_NOT_FOUND",
    severity: "medium",
    message: `404 Not Found: ${req.method} ${req.path}`,
    source: "express-router",
    endpoint: req.path,
    userContext: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  // Continue to next handler (React app will show 404 page)
  next();
}

/**
 * Express error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[AEC Sentinel] Express error caught:", err);

  // Detect error in AEC system
  detectError({
    errorType: err.name || "EXPRESS_ERROR",
    severity: "critical",
    message: err.message,
    stackTrace: err.stack,
    source: "express-middleware",
    endpoint: req.path,
    userContext: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  // Send error response
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "An error occurred",
  });
}

/**
 * Monitor uncaught exceptions
 */
export function monitorUncaughtExceptions() {
  process.on("uncaughtException", (error: Error) => {
    console.error("[AEC Sentinel] Uncaught Exception:", error);

    detectError({
      errorType: "UNCAUGHT_EXCEPTION",
      severity: "critical",
      message: error.message,
      stackTrace: error.stack,
      source: "process-uncaughtException",
    });

    // Don't exit the process - let it continue
    // In production, you might want to exit and let a process manager restart
  });
}

/**
 * Monitor unhandled promise rejections
 */
export function monitorUnhandledRejections() {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("[AEC Sentinel] Unhandled Rejection:", reason);

    detectError({
      errorType: "UNHANDLED_REJECTION",
      severity: "critical",
      message: reason?.message || String(reason),
      stackTrace: reason?.stack,
      source: "process-unhandledRejection",
    });
  });
}

/**
 * Initialize AEC Sentinel Layer monitoring
 */
export function initializeSentinel() {
  console.log("[AEC Sentinel] Initializing error monitoring...");
  
  monitorUncaughtExceptions();
  monitorUnhandledRejections();
  
  console.log("[AEC Sentinel] ✅ Error monitoring initialized");
}
