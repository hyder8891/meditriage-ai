import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const patientRequests = new Counter('patient_requests');
const doctorRequests = new Counter('doctor_requests');
const triageResponseTime = new Trend('triage_response_time');
const consultationResponseTime = new Trend('consultation_response_time');

export const options = {
  scenarios: {
    patients: {
      executor: 'ramping-vus',
      exec: 'patientScenario',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '3m', target: 400 },
        { duration: '5m', target: 700 },
        { duration: '5m', target: 700 },
        { duration: '2m', target: 0 },
      ],
    },
    doctors: {
      executor: 'ramping-vus',
      exec: 'doctorScenario',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 30 },
        { duration: '3m', target: 100 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate<0.15'],
    errors: ['rate<0.15'],
    triage_response_time: ['p(95)<12000'],
    consultation_response_time: ['p(95)<15000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://3000-ipikazuzldtae1sxeriaq-ef606395.manus-asia.computer';

const symptoms = [
  'severe headache with visual disturbances',
  'chest pain radiating to left arm',
  'difficulty breathing and wheezing',
  'high fever with chills',
  'persistent abdominal pain',
  'sudden onset dizziness',
  'severe back pain',
  'unexplained weight loss and fatigue'
];

export function patientScenario() {
  patientRequests.add(1);
  
  // Patient authentication check
  const meRes = http.get(`${BASE_URL}/api/trpc/auth.me`);
  check(meRes, { 'patient auth ok': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(0.5);
  
  // Submit triage
  const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
  const triagePayload = {
    symptoms: symptom,
    age: Math.floor(Math.random() * 60) + 20,
    gender: Math.random() > 0.5 ? 'male' : 'female',
    medicalHistory: 'Hypertension, Type 2 Diabetes',
    currentMedications: 'Metformin, Lisinopril',
    allergies: 'Penicillin'
  };
  
  const triageStart = Date.now();
  const triageRes = http.post(
    `${BASE_URL}/api/trpc/triage`,
    JSON.stringify(triagePayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const triageDuration = Date.now() - triageStart;
  triageResponseTime.add(triageDuration);
  
  check(triageRes, {
    'triage success': (r) => r.status === 200,
    'triage has response': (r) => r.body && r.body.length > 0,
  }) || errorRate.add(1);
  
  sleep(2);
  
  // Check orchestration endpoint (multi-agent system)
  const orchestrationPayload = {
    symptoms: symptom,
    patientData: triagePayload
  };
  
  const orchestrationRes = http.post(
    `${BASE_URL}/api/trpc/orchestration.analyze`,
    JSON.stringify(orchestrationPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(orchestrationRes, {
    'orchestration status ok': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Check vitals endpoint
  const vitalsRes = http.get(`${BASE_URL}/api/trpc/vitals.getLatest`);
  check(vitalsRes, { 'vitals status ok': (r) => r.status === 200 || r.status === 401 }) || errorRate.add(1);
  
  sleep(1);
}

export function doctorScenario() {
  doctorRequests.add(1);
  
  // Doctor authentication
  const meRes = http.get(`${BASE_URL}/api/trpc/auth.me`);
  check(meRes, { 'doctor auth ok': (r) => r.status === 200 }) || errorRate.add(1);
  sleep(0.5);
  
  // Get consultation queue
  const consultStart = Date.now();
  const queueRes = http.get(`${BASE_URL}/api/trpc/consultation.getQueue`);
  const consultDuration = Date.now() - consultStart;
  consultationResponseTime.add(consultDuration);
  
  check(queueRes, { 'queue status ok': (r) => r.status === 200 || r.status === 401 }) || errorRate.add(1);
  sleep(1);
  
  // Access patient records
  const recordsRes = http.get(`${BASE_URL}/api/trpc/admin.getAllTriageRecords`);
  check(recordsRes, { 'records status ok': (r) => r.status === 200 || r.status === 401 }) || errorRate.add(1);
  sleep(1.5);
  
  // Query Brain AI assistant
  const brainPayload = {
    query: 'Differential diagnosis for ' + symptoms[Math.floor(Math.random() * symptoms.length)],
    context: 'clinical'
  };
  
  const brainRes = http.post(
    `${BASE_URL}/api/trpc/brain.query`,
    JSON.stringify(brainPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(brainRes, {
    'brain query ok': (r) => r.status === 200,
    'brain response time acceptable': (r) => r.timings.duration < 25000,
  }) || errorRate.add(1);
  
  sleep(2);
  
  // Check Avicenna X system
  const avicennaRes = http.post(
    `${BASE_URL}/api/trpc/avicenna.analyze`,
    JSON.stringify({ patientId: 'test-' + __VU }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(avicennaRes, { 'avicenna status ok': (r) => r.status === 200 || r.status === 401 }) || errorRate.add(1);
  sleep(1);
  
  // Check lab results
  const labRes = http.get(`${BASE_URL}/api/trpc/lab.getResults`);
  check(labRes, { 'lab status ok': (r) => r.status === 200 || r.status === 401 }) || errorRate.add(1);
  sleep(1);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_duration: (data.state && data.state.testRunDurationMs ? data.state.testRunDurationMs / 1000 : 0) + 's',
    metrics: {},
  };
  
  // Extract key metrics
  if (data.metrics) {
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        summary.metrics[name] = metric.values;
      }
    }
  }
  
  return {
    'load-tests/mixed-flow-summary.json': JSON.stringify(summary, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  let output = '\n╔═══════════════════════════════════════════════════════════╗\n';
  output += '║         MediTriage AI - Load Test Results               ║\n';
  output += '╚═══════════════════════════════════════════════════════════╝\n\n';
  
  if (data.metrics) {
    output += '📊 Key Metrics:\n\n';
    
    const metrics = data.metrics;
    
    if (metrics.http_reqs) {
      output += `  Total Requests: ${metrics.http_reqs.values.count}\n`;
      output += `  Request Rate: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
    }
    
    if (metrics.http_req_duration) {
      output += '  Response Times:\n';
      output += `    Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
      output += `    Median: ${metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
      output += `    95th Percentile: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
      output += `    99th Percentile: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
      output += `    Max: ${metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
    }
    
    if (metrics.http_req_failed) {
      const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
      output += `  ❌ Failed Requests: ${failRate}%\n\n`;
    }
    
    if (metrics.errors) {
      const errorRateVal = (metrics.errors.values.rate * 100).toFixed(2);
      output += `  ⚠️  Error Rate: ${errorRateVal}%\n\n`;
    }
    
    if (metrics.patient_requests) {
      output += `  👤 Patient Requests: ${metrics.patient_requests.values.count}\n`;
    }
    
    if (metrics.doctor_requests) {
      output += `  👨‍⚕️ Doctor Requests: ${metrics.doctor_requests.values.count}\n\n`;
    }
    
    if (metrics.triage_response_time) {
      output += '  🏥 Triage Response Times:\n';
      output += `    Average: ${metrics.triage_response_time.values.avg.toFixed(2)}ms\n`;
      output += `    95th Percentile: ${metrics.triage_response_time.values['p(95)'].toFixed(2)}ms\n\n`;
    }
    
    if (metrics.consultation_response_time) {
      output += '  💬 Consultation Response Times:\n';
      output += `    Average: ${metrics.consultation_response_time.values.avg.toFixed(2)}ms\n`;
      output += `    95th Percentile: ${metrics.consultation_response_time.values['p(95)'].toFixed(2)}ms\n\n`;
    }
  }
  
  output += '═══════════════════════════════════════════════════════════\n';
  
  return output;
}
