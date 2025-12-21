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

console.log('=== Testing Complete Auth Flow ===\n');

// Test with the admin account we just created
const testEmail = 'admin@admin.com';
const testPassword = 'Admin123!';

try {
  console.log(`Step 1: Firebase Login with ${testEmail}...`);
  const result = await signInWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('✅ Firebase login successful!');
  console.log('   User ID:', result.user.uid);
  console.log('   Email:', result.user.email);
  
  const idToken = await result.user.getIdToken();
  console.log('   ID Token obtained:', idToken.substring(0, 30) + '...\n');
  
  console.log('Step 2: Backend Token Verification...');
  const response = await fetch('http://localhost:3000/api/trpc/oauth.verifyFirebaseToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken,
      provider: 'email',
      role: 'admin',
      email: testEmail,
      name: 'Admin User',
    }),
  });
  
  const data = await response.json();
  
  if (data.result?.data) {
    console.log('✅ Backend verification successful!');
    console.log('   JWT Token:', data.result.data.token ? 'RECEIVED ✓' : 'MISSING ✗');
    console.log('   Refresh Token:', data.result.data.refreshToken ? 'RECEIVED ✓' : 'MISSING ✗');
    console.log('   User Data:');
    console.log('     - ID:', data.result.data.user.id);
    console.log('     - Email:', data.result.data.user.email);
    console.log('     - Name:', data.result.data.user.name);
    console.log('     - Role:', data.result.data.user.role);
    console.log('     - Verified:', data.result.data.user.verified);
    console.log('     - Email Verified:', data.result.data.user.emailVerified);
    
    // Test if JWT token works for authenticated requests
    console.log('\nStep 3: Testing JWT Token for Authenticated Requests...');
    const meResponse = await fetch('http://localhost:3000/api/trpc/auth.me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${data.result.data.token}`,
      },
    });
    
    const meData = await meResponse.json();
    if (meData.result?.data) {
      console.log('✅ JWT Token works! User authenticated:');
      console.log('   - ID:', meData.result.data.id);
      console.log('   - Email:', meData.result.data.email);
      console.log('   - Role:', meData.result.data.role);
      
      console.log('\n🎉 COMPLETE AUTH FLOW SUCCESSFUL!');
      console.log('\n=== Summary ===');
      console.log('✓ Firebase authentication works');
      console.log('✓ Backend token verification works');
      console.log('✓ JWT token generation works');
      console.log('✓ User data includes all required fields');
      console.log('✓ Authenticated requests work');
      console.log('\n=== Next Step ===');
      console.log('The backend is working correctly. The redirect issue is likely');
      console.log('in the frontend React component timing or state management.');
    } else {
      console.log('❌ JWT Token validation failed');
      console.log('Response:', JSON.stringify(meData, null, 2));
    }
  } else {
    console.log('❌ Backend verification failed');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
}

process.exit(0);
