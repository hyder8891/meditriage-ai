import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
    http_req_failed: ['rate<0.1'],     // Error rate should be less than 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://3000-ipikazuzldtae1sxeriaq-ef606395.manus-asia.computer';

// Sample symptom data for testing
const symptoms = [
  'headache and fever',
  'chest pain and shortness of breath',
  'abdominal pain and nausea',
  'cough and sore throat',
  'dizziness and fatigue',
  'back pain and muscle aches',
  'skin rash and itching',
  'joint pain and swelling'
];

const ages = [25, 35, 45, 55, 65, 75];
const genders = ['male', 'female'];

export default function () {
  // Simulate patient triage flow
  
  // 1. Check authentication status
  const meRes = http.get(`${BASE_URL}/api/trpc/auth.me`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(meRes, {
    'auth.me status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // 2. Submit symptom analysis (main triage endpoint)
  const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
  const age = ages[Math.floor(Math.random() * ages.length)];
  const gender = genders[Math.floor(Math.random() * genders.length)];
  
  const triagePayload = {
    symptoms: symptom,
    age: age,
    gender: gender,
    medicalHistory: 'No significant medical history',
    currentMedications: 'None',
    allergies: 'None known'
  };
  
  const triageRes = http.post(
    `${BASE_URL}/api/trpc/triage`,
    JSON.stringify(triagePayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  const triageSuccess = check(triageRes, {
    'triage status is 200': (r) => r.status === 200,
    'triage response time < 10s': (r) => r.timings.duration < 10000,
  });
  
  if (!triageSuccess) {
    errorRate.add(1);
  }
  
  sleep(2);
  
  // 3. Get triage history (if authenticated)
  const historyRes = http.get(`${BASE_URL}/api/trpc/getTriageHistory`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(historyRes, {
    'history status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // 4. Check conversational endpoint
  const conversationPayload = {
    message: 'I have ' + symptom,
    conversationId: `test-${__VU}-${Date.now()}`
  };
  
  const conversationRes = http.post(
    `${BASE_URL}/api/trpc/conversational.chat`,
    JSON.stringify(conversationPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  check(conversationRes, {
    'conversation status is 200': (r) => r.status === 200,
    'conversation response time < 15s': (r) => r.timings.duration < 15000,
  }) || errorRate.add(1);
  
  sleep(2);
}

export function handleSummary(data) {
  return {
    'load-tests/patient-flow-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n' + indent + '=== Load Test Summary ===\n\n';
  
  if (data.metrics) {
    summary += indent + 'Metrics:\n';
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        summary += indent + `  ${name}:\n`;
        for (const [key, value] of Object.entries(metric.values)) {
          summary += indent + `    ${key}: ${value}\n`;
        }
      }
    }
  }
  
  return summary;
}
