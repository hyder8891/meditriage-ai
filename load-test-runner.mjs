import https from 'https';
import http from 'http';

const BASE_URL = 'https://3000-ida5fhfewtpjvouxhb6j7-b8d73eb8.sg1.manus.computer';

const symptoms = [
  'severe headache with nausea',
  'chest pain and shortness of breath',
  'persistent cough with fever',
  'abdominal pain and vomiting',
  'dizziness and fatigue',
];

const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
};

function makeRequest(url, data) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false, // For self-signed certs
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        results.totalRequests++;
        results.responseTimes.push(responseTime);
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push(`Status ${res.statusCode}: ${url}`);
        }
        
        resolve({ statusCode: res.statusCode, responseTime, body });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      results.totalRequests++;
      results.failedRequests++;
      results.responseTimes.push(responseTime);
      results.errors.push(`Error: ${error.message}`);
      resolve({ error: error.message, responseTime });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function simulateUser(userId) {
  try {
    // Check auth
    await makeRequest(`${BASE_URL}/api/trpc/auth.me`);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Make a triage-like request (simulating the main workflow)
    const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
    await makeRequest(`${BASE_URL}/api/trpc/triage`, {
      symptoms: symptom,
      age: Math.floor(Math.random() * 60) + 20,
      gender: Math.random() > 0.5 ? 'male' : 'female',
    });
    
  } catch (error) {
    results.errors.push(`User ${userId} error: ${error.message}`);
  }
}

async function runLoadTest(concurrentUsers, waveDuration = 1000) {
  console.log(`\n🚀 Starting load test with ${concurrentUsers} concurrent users...\n`);
  
  const startTime = Date.now();
  const promises = [];
  
  // Spawn users in waves to simulate gradual ramp-up
  const waves = Math.min(10, concurrentUsers);
  const usersPerWave = Math.ceil(concurrentUsers / waves);
  
  for (let wave = 0; wave < waves; wave++) {
    const waveStart = Date.now();
    const wavePromises = [];
    
    for (let i = 0; i < usersPerWave && (wave * usersPerWave + i) < concurrentUsers; i++) {
      const userId = wave * usersPerWave + i;
      wavePromises.push(simulateUser(userId));
    }
    
    await Promise.allSettled(wavePromises);
    
    const waveTime = Date.now() - waveStart;
    console.log(`Wave ${wave + 1}/${waves} completed in ${waveTime}ms (${wavePromises.length} users)`);
    
    // Small delay between waves
    if (wave < waves - 1) {
      await new Promise(resolve => setTimeout(resolve, waveDuration));
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // Calculate statistics
  const sortedTimes = results.responseTimes.sort((a, b) => a - b);
  const avg = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
  const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
  const min = sortedTimes[0];
  const max = sortedTimes[sortedTimes.length - 1];
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Test Duration: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`👥 Concurrent Users: ${concurrentUsers}`);
  console.log(`📨 Total Requests: ${results.totalRequests}`);
  console.log(`✅ Successful: ${results.successfulRequests} (${(results.successfulRequests / results.totalRequests * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failedRequests} (${(results.failedRequests / results.totalRequests * 100).toFixed(1)}%)`);
  
  console.log('\n📈 Response Times:');
  console.log(`   Average: ${avg.toFixed(0)}ms`);
  console.log(`   Median:  ${median.toFixed(0)}ms`);
  console.log(`   Min:     ${min.toFixed(0)}ms`);
  console.log(`   Max:     ${max.toFixed(0)}ms`);
  console.log(`   P95:     ${p95.toFixed(0)}ms`);
  console.log(`   P99:     ${p99.toFixed(0)}ms`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors (showing first 10):');
    results.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more errors`);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  return {
    totalTime,
    totalRequests: results.totalRequests,
    successRate: (results.successfulRequests / results.totalRequests * 100).toFixed(1),
    avgResponseTime: avg.toFixed(0),
    p95ResponseTime: p95.toFixed(0),
    errorCount: results.failedRequests,
  };
}

// Run tests with increasing load
async function main() {
  console.log('🏥 MediTriage AI - Load Testing Suite\n');
  
  const testSuite = [
    { users: 10, name: 'Baseline Test' },
    { users: 100, name: 'Medium Load Test' },
    { users: 500, name: 'High Load Test' },
    { users: 1000, name: 'Stress Test' },
  ];
  
  const summaries = [];
  
  for (const test of testSuite) {
    // Reset results
    results.totalRequests = 0;
    results.successfulRequests = 0;
    results.failedRequests = 0;
    results.responseTimes = [];
    results.errors = [];
    
    console.log(`\n${'#'.repeat(60)}`);
    console.log(`# ${test.name.toUpperCase()} - ${test.users} CONCURRENT USERS`);
    console.log('#'.repeat(60));
    
    const summary = await runLoadTest(test.users);
    summaries.push({ ...test, ...summary });
    
    // Wait between tests
    if (test !== testSuite[testSuite.length - 1]) {
      console.log('⏸️  Waiting 10 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL SUMMARY - ALL TESTS');
  console.log('='.repeat(60) + '\n');
  
  console.log('Test Name              | Users | Requests | Success | Avg RT | P95 RT | Errors');
  console.log('-'.repeat(80));
  summaries.forEach(s => {
    console.log(
      `${s.name.padEnd(22)} | ${String(s.users).padStart(5)} | ${String(s.totalRequests).padStart(8)} | ${String(s.successRate + '%').padStart(7)} | ${String(s.avgResponseTime + 'ms').padStart(6)} | ${String(s.p95ResponseTime + 'ms').padStart(6)} | ${s.errorCount}`
    );
  });
  
  console.log('\n✅ Load testing complete!\n');
}

main().catch(console.error);
