/**
 * Log Sanitization Utility
 * 
 * Prevents sensitive data (passwords, tokens, PHI) from being logged
 * Critical for HIPAA compliance and security
 */

// Sensitive field names to scrub (case-insensitive)
const SENSITIVE_KEYS = [
  // Authentication
  "password",
  "passwordHash",
  "password_hash",
  "newPassword",
  "oldPassword",
  "currentPassword",
  
  // Tokens
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "apiKey",
  "api_key",
  "secret",
  "secretKey",
  "secret_key",
  "verificationToken",
  "verification_token",
  "resetToken",
  "reset_token",
  "authToken",
  "auth_token",
  "bearerToken",
  "bearer_token",
  
  // Personal Identifiable Information (PII)
  "ssn",
  "socialSecurityNumber",
  "social_security_number",
  "creditCard",
  "credit_card",
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
  "pin",
  
  // Protected Health Information (PHI) - sensitive fields
  "medicalRecord",
  "medical_record",
  "diagnosis",
  "prescription",
  "labResult",
  "lab_result",
  
  // Stripe/Payment
  "stripeSecretKey",
  "stripe_secret_key",
  "stripeToken",
  "stripe_token",
];

/**
 * Check if a key is sensitive
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => 
    lowerKey.includes(sensitiveKey.toLowerCase())
  );
}

/**
 * Sanitize a single value
 */
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  
  // For strings, show first 3 chars + ***
  if (typeof value === "string") {
    if (value.length <= 3) {
      return "***";
    }
    return value.substring(0, 3) + "***";
  }
  
  // For numbers, return [REDACTED]
  if (typeof value === "number") {
    return "[REDACTED]";
  }
  
  // For objects/arrays, recursively sanitize
  if (typeof value === "object") {
    return sanitizeObject(value);
  }
  
  return "[REDACTED]";
}

/**
 * Recursively sanitize an object or array
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === "object") {
        return sanitizeObject(item);
      }
      return item;
    });
  }
  
  // Handle objects
  if (typeof obj === "object") {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = sanitizeValue(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize data before logging
 * 
 * @param data - Any data structure (object, array, string, etc.)
 * @returns Sanitized copy with sensitive fields redacted
 * 
 * @example
 * const userData = { email: "user@example.com", password: "secret123" };
 * console.log(sanitizeForLog(userData));
 * // Output: { email: "user@example.com", password: "sec***" }
 */
export function sanitizeForLog(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // For primitive types, return as-is
  if (typeof data !== "object") {
    return data;
  }
  
  // Deep clone and sanitize
  try {
    return sanitizeObject(data);
  } catch (error) {
    console.error("[LogSanitizer] Error sanitizing data:", error);
    return "[SANITIZATION_ERROR]";
  }
}

/**
 * Sanitize error objects before logging
 * Errors may contain sensitive data in their message or stack
 */
export function sanitizeError(error: any): any {
  if (!error) {
    return error;
  }
  
  const sanitized: any = {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
  };
  
  // Sanitize any additional properties
  for (const [key, value] of Object.entries(error)) {
    if (!["name", "message", "code", "stack"].includes(key)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = sanitizeValue(value);
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Safe console.log that automatically sanitizes
 */
export function safeLog(...args: any[]): void {
  const sanitized = args.map(arg => sanitizeForLog(arg));
  console.log(...sanitized);
}

/**
 * Safe console.error that automatically sanitizes
 */
export function safeError(...args: any[]): void {
  const sanitized = args.map(arg => {
    if (arg instanceof Error) {
      return sanitizeError(arg);
    }
    return sanitizeForLog(arg);
  });
  console.error(...sanitized);
}

/**
 * Safe JSON.stringify that sanitizes before stringifying
 */
export function safeStringify(data: any, space?: number): string {
  try {
    const sanitized = sanitizeForLog(data);
    return JSON.stringify(sanitized, null, space);
  } catch (error) {
    return "[STRINGIFY_ERROR]";
  }
}
