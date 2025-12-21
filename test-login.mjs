// Test login API endpoint with correct tRPC batch format
const baseUrl = 'http://localhost:3000';

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/trpc/auth.login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        0: {
          json: {
            email,
            password,
          },
        },
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok && data[0]?.result?.data) {
      console.log('✅ Login successful!');
      console.log('User:', data[0].result.data.user);
      console.log('Token:', data[0].result.data.token ? 'Present' : 'Missing');
      return true;
    } else {
      console.log('❌ Login failed');
      if (data[0]?.error) {
        console.log('Error:', data[0].error.json.message);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing login endpoints...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await testLogin('patient.test@meditriage.com', 'test123');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await testLogin('doctor.test@meditriage.com', 'test123');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✅ Test complete!');
}

main().catch(console.error);
