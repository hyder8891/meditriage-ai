import { describe, it, expect } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

describe('Firebase Authentication Setup', () => {
  it('should successfully initialize Firebase with provided credentials', () => {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    // Check all required credentials are present
    expect(firebaseConfig.apiKey).toBeDefined();
    expect(firebaseConfig.authDomain).toBeDefined();
    expect(firebaseConfig.projectId).toBeDefined();
    expect(firebaseConfig.storageBucket).toBeDefined();
    expect(firebaseConfig.messagingSenderId).toBeDefined();
    expect(firebaseConfig.appId).toBeDefined();

    // Validate format
    expect(firebaseConfig.apiKey).toMatch(/^AIza[0-9A-Za-z_-]{35}$/);
    expect(firebaseConfig.authDomain).toMatch(/\.firebaseapp\.com$/);
    expect(firebaseConfig.projectId).toBeTruthy();
    expect(firebaseConfig.storageBucket).toMatch(/\.(appspot\.com|firebasestorage\.app)$/);
    expect(firebaseConfig.appId).toMatch(/^1:/);

    // Try to initialize Firebase
    const app = initializeApp(firebaseConfig, 'test-app-' + Date.now());
    expect(app).toBeDefined();
    expect(app.name).toBeTruthy();

    // Try to get auth instance
    const auth = getAuth(app);
    expect(auth).toBeDefined();
    expect(auth.app).toBe(app);
  });
});
