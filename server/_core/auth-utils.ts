import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from './env';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a Short-Lived Access Token (15 Minutes)
 * Used for API calls. If stolen, it expires quickly.
 * Now includes tokenVersion for immediate revocation capability
 */
export function generateToken(payload: { userId: number; email: string; role: string; tokenVersion: number }): string {
  return jwt.sign(payload, ENV.cookieSecret, {
    expiresIn: '15m',
  });
}

/**
 * Generate a Long-Lived Refresh Token (30 Days)
 * Stored in an HTTP-Only cookie. Used to get new Access Tokens.
 */
export function generateRefreshToken(payload: { userId: number; email: string; role: string; tokenVersion: number }): string {
  const secret = process.env.JWT_REFRESH_SECRET || ENV.cookieSecret;
  return jwt.sign(payload, secret, {
    expiresIn: '30d',
  });
}

/**
 * Verify a Refresh Token
 * Returns decoded payload or null if invalid
 */
export function verifyRefreshToken(token: string): { userId: number; email: string; role: string; tokenVersion: number } | null {
  const secret = process.env.JWT_REFRESH_SECRET || ENV.cookieSecret;
  try {
    const decoded = jwt.verify(token, secret) as { userId: number; email: string; role: string; tokenVersion: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode a JWT token
 * Returns decoded payload including tokenVersion
 */
export function verifyToken(token: string): { userId: number; email: string; role: string; tokenVersion: number } | null {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret) as { userId: number; email: string; role: string; tokenVersion: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a random token for email verification or password reset
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate token expiry time (default 1 hour from now)
 */
export function generateTokenExpiry(hoursFromNow: number = 1): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hoursFromNow);
  return expiry;
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}

/**
 * Extract JWT token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  
  return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}
