import { describe, it, expect } from 'vitest';

describe('Firebase Credentials Validation', () => {
  it('should have all required Firebase environment variables', () => {
    // Check that all Firebase env vars are set
    expect(process.env.VITE_FIREBASE_API_KEY).toBeDefined();
    expect(process.env.VITE_FIREBASE_AUTH_DOMAIN).toBeDefined();
    expect(process.env.VITE_FIREBASE_PROJECT_ID).toBeDefined();
    expect(process.env.VITE_FIREBASE_STORAGE_BUCKET).toBeDefined();
    expect(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID).toBeDefined();
    expect(process.env.VITE_FIREBASE_APP_ID).toBeDefined();
  });

  it('should have valid Firebase API key format', () => {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^AIza[A-Za-z0-9_-]{35}$/);
  });

  it('should have valid Firebase auth domain', () => {
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
    expect(authDomain).toBeDefined();
    expect(authDomain).toContain('.firebaseapp.com');
  });

  it('should have valid Firebase project ID', () => {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    expect(projectId).toBeDefined();
    expect(projectId).toBe('mydoctor-40043');
  });

  it('should have valid Firebase storage bucket', () => {
    const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
    expect(storageBucket).toBeDefined();
    expect(storageBucket).toContain('mydoctor-40043');
  });

  it('should have valid Firebase messaging sender ID', () => {
    const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    expect(messagingSenderId).toBeDefined();
    expect(messagingSenderId).toMatch(/^\d+$/);
  });

  it('should have valid Firebase app ID format', () => {
    const appId = process.env.VITE_FIREBASE_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).toMatch(/^1:\d+:web:[a-f0-9]+$/);
  });
});
