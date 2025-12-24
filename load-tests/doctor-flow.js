import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 doctors
    { duration: '3m', target: 200 },   // Ramp up to 200 doctors
    { duration: '5m', target: 500 },   // Ramp up to 500 doctors
    { duration: '5m', target: 500 },   // Stay at 500 doctors
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://3000-ipikazuzldtae1sxeriaq-ef606395.manus-asia.computer';

export default function () {
  // Simulate doctor consultation flow
  
  // 1. Check authentication
  const meRes = http.get(`${BASE_URL}/api/trpc/auth.me`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(meRes, {
    'doctor auth.me status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // 2. Get consultation queue
  const queueRes = http.get(`${BASE_URL}/api/trpc/consultation.getQueue`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(queueRes, {
    'consultation queue status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(2);
  
  // 3. Access patient records (admin/doctor functionality)
  const patientsRes = http.get(`${BASE_URL}/api/trpc/admin.getAllTriageRecords`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(patientsRes, {
    'patient records status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(2);
  
  // 4. Check brain/AI assistant endpoints
  const brainQueryPayload = {
    query: 'What are the differential diagnoses for chest pain?',
    context: 'emergency'
  };
  
  const brainRes = http.post(
    `${BASE_URL}/api/trpc/brain.query`,
    JSON.stringify(brainQueryPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  check(brainRes, {
    'brain query status is 200': (r) => r.status === 200,
    'brain query response time < 20s': (r) => r.timings.duration < 20000,
  }) || errorRate.add(1);
  
  sleep(3);
  
  // 5. Access lab results
  const labRes = http.get(`${BASE_URL}/api/trpc/lab.getResults`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(labRes, {
    'lab results status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-tests/doctor-flow-summary.json': JSON.stringify(data, null, 2),
  };
}
