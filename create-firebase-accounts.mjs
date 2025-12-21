import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const accounts = [
  { email: 'doctor.test@meditriage.com', password: 'Doctor123!', name: 'Test Doctor', role: 'clinician' },
  { email: 'patient@test.com', password: 'Patient123!', name: 'Test Patient', role: 'patient' },
  { email: 'admin@admin.com', password: 'Admin123!', name: 'Admin User', role: 'admin' }
];

console.log('Creating Firebase test accounts...\n');

for (const account of accounts) {
  try {
    console.log(`Creating ${account.email}...`);
    const result = await createUserWithEmailAndPassword(auth, account.email, account.password);
    console.log(`✅ Created ${account.email} (UID: ${result.user.uid})`);
    
    // Get ID token and verify with backend
    const idToken = await result.user.getIdToken();
    const response = await fetch('http://localhost:3000/api/trpc/oauth.verifyFirebaseToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        provider: 'email',
        role: account.role,
        email: account.email,
        name: account.name,
      }),
    });
    
    const data = await response.json();
    if (data.result?.data?.token) {
      console.log(`✅ Backend account created for ${account.email}`);
    } else {
      console.log(`⚠️  Backend verification issue for ${account.email}`);
    }
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️  ${account.email} already exists in Firebase`);
      
      // Try to sign in to verify password works
      try {
        await signInWithEmailAndPassword(auth, account.email, account.password);
        console.log(`✅ Password verified for ${account.email}`);
      } catch (loginError) {
        console.log(`❌ Password doesn't match for ${account.email} - needs reset in Firebase Console`);
      }
    } else {
      console.log(`❌ Error creating ${account.email}:`, error.message);
    }
  }
  console.log('');
}

console.log('\n=== TEST CREDENTIALS ===');
console.log('Doctor: doctor.test@meditriage.com / Doctor123!');
console.log('Patient: patient@test.com / Patient123!');
console.log('Admin: admin@admin.com / Admin123!');

process.exit(0);
