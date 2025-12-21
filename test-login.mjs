import { signInWithEmailAndPassword } from 'firebase/auth';
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

console.log('Testing login with doctor.test@meditriage.com...');

try {
  const result = await signInWithEmailAndPassword(auth, 'doctor.test@meditriage.com', 'Doctor123!');
  console.log('✅ Firebase login successful!');
  console.log('User ID:', result.user.uid);
  console.log('Email:', result.user.email);
  
  const idToken = await result.user.getIdToken();
  console.log('ID Token (first 50 chars):', idToken.substring(0, 50) + '...');
  
  // Now test backend verification
  console.log('\nTesting backend verification...');
  const response = await fetch('http://localhost:3000/api/trpc/oauth.verifyFirebaseToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken,
      provider: 'email',
      role: 'clinician',
      email: 'doctor.test@meditriage.com',
      name: 'Test Doctor',
    }),
  });
  
  const data = await response.json();
  console.log('Backend response:', JSON.stringify(data, null, 2));
  
  if (data.result?.data) {
    console.log('\n✅ Backend verification successful!');
    console.log('JWT Token received:', data.result.data.token ? 'YES' : 'NO');
    console.log('Refresh Token received:', data.result.data.refreshToken ? 'YES' : 'NO');
    console.log('User data:', data.result.data.user);
  } else {
    console.log('\n❌ Backend verification failed');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

process.exit(0);
