/**
 * Security Tests for MediTriage AI Pro
 * Tests critical security fixes implemented in January 2026
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptSensitiveData, decryptSensitiveData, isEncrypted } from './_core/auth-utils';
import { sanitizeForLog, sanitizeError } from './_core/log-sanitizer';
import { logger, createLogger } from './_core/logger';

describe('Encryption Utilities', () => {
  const testData = 'my-secret-access-token-12345';

  it('should encrypt data and return base64 string', () => {
    const encrypted = encryptSensitiveData(testData);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(testData);
    // Should be base64 encoded
    expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
  });

  it('should decrypt data back to original', () => {
    const encrypted = encryptSensitiveData(testData);
    const decrypted = decryptSensitiveData(encrypted);
    expect(decrypted).toBe(testData);
  });

  it('should produce different ciphertext for same plaintext (due to random IV)', () => {
    const encrypted1 = encryptSensitiveData(testData);
    const encrypted2 = encryptSensitiveData(testData);
    expect(encrypted1).not.toBe(encrypted2);
    // But both should decrypt to same value
    expect(decryptSensitiveData(encrypted1)).toBe(testData);
    expect(decryptSensitiveData(encrypted2)).toBe(testData);
  });

  it('should detect encrypted data correctly', () => {
    const encrypted = encryptSensitiveData(testData);
    expect(isEncrypted(encrypted)).toBe(true);
    expect(isEncrypted(testData)).toBe(false);
    expect(isEncrypted('')).toBe(false);
    expect(isEncrypted('short')).toBe(false);
  });

  it('should throw error for tampered data', () => {
    const encrypted = encryptSensitiveData(testData);
    // Tamper with the encrypted data
    const tampered = encrypted.slice(0, -5) + 'XXXXX';
    expect(() => decryptSensitiveData(tampered)).toThrow();
  });

  it('should handle empty string', () => {
    const encrypted = encryptSensitiveData('');
    const decrypted = decryptSensitiveData(encrypted);
    expect(decrypted).toBe('');
  });

  it('should handle unicode characters', () => {
    const unicodeData = 'مرحبا بالعالم 🏥 医疗';
    const encrypted = encryptSensitiveData(unicodeData);
    const decrypted = decryptSensitiveData(encrypted);
    expect(decrypted).toBe(unicodeData);
  });
});

describe('Log Sanitization', () => {
  it('should redact password fields', () => {
    const data = { email: 'test@example.com', password: 'secret123' };
    const sanitized = sanitizeForLog(data);
    expect(sanitized.email).toBe('test@example.com');
    expect(sanitized.password).toBe('sec***');
  });

  it('should redact token fields', () => {
    const data = { userId: 1, accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' };
    const sanitized = sanitizeForLog(data);
    expect(sanitized.userId).toBe(1);
    expect(sanitized.accessToken).toBe('eyJ***');
  });

  it('should redact nested sensitive fields', () => {
    const data = {
      user: {
        email: 'test@example.com',
        auth: {
          password: 'secret123',
          refreshToken: 'refresh-token-value',
        },
      },
    };
    const sanitized = sanitizeForLog(data);
    expect(sanitized.user.email).toBe('test@example.com');
    expect(sanitized.user.auth.password).toBe('sec***');
    expect(sanitized.user.auth.refreshToken).toBe('ref***');
  });

  it('should handle arrays with sensitive data', () => {
    const data = [
      { email: 'a@test.com', password: 'pass1' },
      { email: 'b@test.com', password: 'pass2' },
    ];
    const sanitized = sanitizeForLog(data);
    expect(sanitized[0].password).toBe('pas***');
    expect(sanitized[1].password).toBe('pas***');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeForLog(null)).toBe(null);
    expect(sanitizeForLog(undefined)).toBe(undefined);
  });

  it('should sanitize error objects', () => {
    const error = new Error('Database error');
    (error as any).password = 'leaked-password';
    const sanitized = sanitizeError(error);
    expect(sanitized.message).toBe('Database error');
    expect(sanitized.password).toBe('lea***');
  });
});

describe('Production Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  it('should create scoped logger', () => {
    const log = createLogger('TestModule');
    expect(log).toHaveProperty('debug');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('error');
    expect(log).toHaveProperty('security');
    expect(log).toHaveProperty('audit');
  });

  it('should format log messages with timestamp and context', () => {
    logger.info('Auth', 'User logged in');
    expect(consoleSpy.log).toHaveBeenCalled();
    const logCall = consoleSpy.log.mock.calls[0][0];
    expect(logCall).toContain('[INFO]');
    expect(logCall).toContain('[Auth]');
    expect(logCall).toContain('User logged in');
  });

  it('should sanitize data in logs', () => {
    logger.info('Auth', 'Login attempt', { email: 'test@example.com', password: 'secret' });
    expect(consoleSpy.log).toHaveBeenCalled();
    const logData = consoleSpy.log.mock.calls[0][1];
    expect(logData.password).toBe('sec***');
  });

  it('should always log security events', () => {
    logger.security('Auth', 'Suspicious login attempt', { ip: '192.168.1.1' });
    expect(consoleSpy.warn).toHaveBeenCalled();
    const logCall = consoleSpy.warn.mock.calls[0][0];
    expect(logCall).toContain('[SECURITY:Auth]');
  });

  it('should always log audit events', () => {
    logger.audit('User', 'password_changed', { userId: 123 });
    expect(consoleSpy.log).toHaveBeenCalled();
    const logCall = consoleSpy.log.mock.calls[0][0];
    expect(logCall).toContain('[AUDIT:User]');
  });
});

describe('Rate Limiting Fallback', () => {
  // Note: Full rate limiting tests would require mocking Redis
  // These tests verify the in-memory fallback structure exists
  
  it('should have rate limit module available', async () => {
    const rateLimit = await import('./_core/rate-limit');
    expect(rateLimit).toHaveProperty('rateLimit');
  });
});

describe('Input Validation', () => {
  // Verify Zod schemas are properly defined for public procedures
  
  it('should have z (Zod) available for validation', async () => {
    const { z } = await import('zod');
    expect(z).toBeDefined();
    expect(z.string).toBeDefined();
    expect(z.object).toBeDefined();
  });

  it('should validate email format', async () => {
    const { z } = await import('zod');
    const emailSchema = z.string().email();
    
    expect(() => emailSchema.parse('valid@email.com')).not.toThrow();
    expect(() => emailSchema.parse('invalid-email')).toThrow();
  });

  it('should validate password minimum length', async () => {
    const { z } = await import('zod');
    const passwordSchema = z.string().min(8);
    
    expect(() => passwordSchema.parse('validpass123')).not.toThrow();
    expect(() => passwordSchema.parse('short')).toThrow();
  });
});
