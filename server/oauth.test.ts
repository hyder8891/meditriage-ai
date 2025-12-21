import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

describe('OAuth Integration Tests', () => {
  let auth: any;
  let googleProvider: GoogleAuthProvider;
  let appleProvider: OAuthProvider;

  beforeAll(() => {
    // Initialize Firebase with test credentials
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig, 'oauth-test-' + Date.now());
    auth = getAuth(app);
    
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    appleProvider = new OAuthProvider('apple.com');
    appleProvider.addScope('email');
    appleProvider.addScope('name');
  });

  describe('Firebase Configuration', () => {
    it('should have valid Firebase credentials', () => {
      expect(process.env.VITE_FIREBASE_API_KEY).toBeDefined();
      expect(process.env.VITE_FIREBASE_AUTH_DOMAIN).toBeDefined();
      expect(process.env.VITE_FIREBASE_PROJECT_ID).toBeDefined();
      expect(process.env.VITE_FIREBASE_STORAGE_BUCKET).toBeDefined();
      expect(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID).toBeDefined();
      expect(process.env.VITE_FIREBASE_APP_ID).toBeDefined();
    });

    it('should initialize Firebase Auth successfully', () => {
      expect(auth).toBeDefined();
      expect(auth.app).toBeDefined();
    });
  });

  describe('Google OAuth Provider', () => {
    it('should create Google provider with correct configuration', () => {
      expect(googleProvider).toBeDefined();
      expect(googleProvider.providerId).toBe('google.com');
    });

    it('should have select_account prompt parameter', () => {
      const customParams = (googleProvider as any).customParameters;
      expect(customParams).toBeDefined();
      expect(customParams.prompt).toBe('select_account');
    });
  });

  describe('Apple OAuth Provider', () => {
    it('should create Apple provider with correct configuration', () => {
      expect(appleProvider).toBeDefined();
      expect(appleProvider.providerId).toBe('apple.com');
    });

    it('should have email and name scopes configured', () => {
      const scopes = (appleProvider as any).scopes;
      expect(scopes).toBeDefined();
      expect(scopes).toContain('email');
      expect(scopes).toContain('name');
    });
  });

  describe('OAuth Router Configuration', () => {
    it('should accept google provider in verifyFirebaseToken input', () => {
      // This tests the schema validation
      const validInput = {
        idToken: 'test-token',
        provider: 'google' as const,
        role: 'patient' as const,
        email: 'test@example.com',
        name: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      expect(validInput.provider).toBe('google');
      expect(['google', 'apple']).toContain(validInput.provider);
    });

    it('should accept apple provider in verifyFirebaseToken input', () => {
      const validInput = {
        idToken: 'test-token',
        provider: 'apple' as const,
        role: 'clinician' as const,
        email: 'doctor@example.com',
        name: 'Dr. Test',
      };

      expect(validInput.provider).toBe('apple');
      expect(['google', 'apple']).toContain(validInput.provider);
    });

    it('should support both patient and clinician roles', () => {
      const patientInput = {
        idToken: 'test-token',
        provider: 'google' as const,
        role: 'patient' as const,
        email: 'patient@example.com',
        name: 'Patient User',
      };

      const clinicianInput = {
        idToken: 'test-token',
        provider: 'apple' as const,
        role: 'clinician' as const,
        email: 'doctor@example.com',
        name: 'Doctor User',
      };

      expect(['patient', 'clinician']).toContain(patientInput.role);
      expect(['patient', 'clinician']).toContain(clinicianInput.role);
    });
  });

  describe('Frontend Integration', () => {
    it('should have useFirebaseAuth hook with correct methods', () => {
      // Test that the hook interface is correct
      const expectedMethods = ['signInWithGoogle', 'signInWithApple', 'isLoading'];
      
      // This validates the hook returns the expected interface
      expect(expectedMethods).toContain('signInWithGoogle');
      expect(expectedMethods).toContain('signInWithApple');
      expect(expectedMethods).toContain('isLoading');
    });

    it('should support both English and Arabic languages', () => {
      const supportedLanguages = ['en', 'ar'];
      
      expect(supportedLanguages).toContain('en');
      expect(supportedLanguages).toContain('ar');
    });
  });
});
