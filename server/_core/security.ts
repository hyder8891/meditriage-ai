// @ts-nocheck
/**
 * Security Middleware and Utilities
 * Implements comprehensive security measures for the application
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { auditLogs } from '../../drizzle/schema';

/**
 * Rate Limiting Configuration
 * Protects against brute force and DDoS attacks
 */

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Triage/AI endpoint limiter (more generous for patient use)
export const triageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 triage sessions per hour
  message: 'You have reached the maximum number of triage sessions. Please try again later.',
});

// Doctor availability update limiter
export const availabilityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 status changes per 5 minutes
  message: 'Too many availability updates. Please wait before changing status again.',
});

/**
 * Security Headers Configuration
 * Uses Helmet to set various HTTP headers for security
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://manus-analytics.com", // Analytics
        "https://*.manus.computer"      // Preview environments
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.manus.im",
        "https://*.manus-asia.computer",
        "https://manus-analytics.com",
        "wss://*.manus.computer",       // WebSocket connections
        "https://*.manus.computer"      // API calls to preview env
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources to be loaded
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Input Sanitization Middleware
 * Protects against NoSQL injection and XSS attacks
 */
export const sanitizeInput = [
  mongoSanitize(), // Sanitize MongoDB queries
  xss(), // Sanitize against XSS
  hpp(), // Protect against HTTP Parameter Pollution
];

/**
 * Request Size Limiter
 * Prevents large payload attacks
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length'], 10);
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request payload too large',
        maxSize: '10MB',
      });
    }
  }
  
  next();
};

/**
 * Audit Logging
 * Logs sensitive operations for security monitoring
 */

export type AuditAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'user.password_reset'
  | 'user.email_verified'
  | 'doctor.availability_change'
  | 'doctor.patient_access'
  | 'patient.doctor_connect'
  | 'patient.triage_start'
  | 'patient.triage_complete'
  | 'admin.user_modify'
  | 'admin.system_config'
  | 'security.failed_login'
  | 'security.suspicious_activity'
  | 'data.export'
  | 'data.delete';

export interface AuditLogEntry {
  userId?: number;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[AUDIT LOG] Database not available');
      console.log('[AUDIT]', entry);
      return;
    }
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      details: entry.details ? JSON.stringify(entry.details) : null,
      success: entry.success,
      errorMessage: entry.errorMessage,
      timestamp: new Date(),
    });
  } catch (error) {
    // Log to console if database logging fails
    console.error('[AUDIT LOG ERROR]', error);
    console.log('[AUDIT]', entry);
  }
}

/**
 * Extract client IP address from request
 */
export function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Session Security Configuration
 */
export const sessionConfig = {
  cookieName: 'meditriage_session',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  httpOnly: true, // Prevent XSS access to cookies
  sameSite: 'lax' as const, // CSRF protection
};

/**
 * Password Strength Validator
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Email Validator
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Account Lockout Tracking
 * Prevents brute force attacks by locking accounts after failed attempts
 */
const failedLoginAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

export function recordFailedLogin(identifier: string): boolean {
  const attempts = failedLoginAttempts.get(identifier) || { count: 0 };
  
  // Check if account is locked
  if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
    return true; // Account is locked
  }
  
  // Increment failed attempts
  attempts.count += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (attempts.count >= 5) {
    attempts.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    failedLoginAttempts.set(identifier, attempts);
    return true; // Account is now locked
  }
  
  failedLoginAttempts.set(identifier, attempts);
  return false; // Not locked yet
}

export function clearFailedLogins(identifier: string): void {
  failedLoginAttempts.delete(identifier);
}

export function isAccountLocked(identifier: string): boolean {
  const attempts = failedLoginAttempts.get(identifier);
  if (!attempts?.lockedUntil) return false;
  
  if (attempts.lockedUntil > new Date()) {
    return true;
  }
  
  // Lockout period expired, clear it
  failedLoginAttempts.delete(identifier);
  return false;
}

/**
 * Security Monitoring
 * Detects suspicious activity patterns
 */
export function detectSuspiciousActivity(req: Request): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for SQL injection patterns
  const sqlPatterns = /(union|select|insert|update|delete|drop|create|alter|exec|script)/i;
  const queryString = JSON.stringify(req.query) + JSON.stringify(req.body);
  
  if (sqlPatterns.test(queryString)) {
    reasons.push('Potential SQL injection attempt detected');
  }
  
  // Check for XSS patterns
  const xssPatterns = /(<script|javascript:|onerror=|onload=)/i;
  if (xssPatterns.test(queryString)) {
    reasons.push('Potential XSS attempt detected');
  }
  
  // Check for path traversal
  if (queryString.includes('../') || queryString.includes('..\\')) {
    reasons.push('Path traversal attempt detected');
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

console.log('✅ Security middleware initialized');
console.log('🔒 Security features enabled:');
console.log('   - Rate limiting (API, Auth, Triage)');
console.log('   - Security headers (Helmet)');
console.log('   - Input sanitization (XSS, NoSQL injection)');
console.log('   - Audit logging');
console.log('   - Account lockout protection');
console.log('   - Request size limiting');
console.log('   - Suspicious activity detection');
