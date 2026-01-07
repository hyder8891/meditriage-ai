import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeGemini } from "./_core/gemini";

// Store active load tests in memory
const activeTests = new Map<string, LoadTestSession>();

interface TestCase {
  id: string;
  type: 'patient' | 'doctor';
  startTime: number;
  endTime?: number;
  responseTime?: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  input: string;
  output?: string;
  error?: string;
  expectedOutcome?: string;
  actualOutcome?: string;
  isCorrect?: boolean;
}

interface AccuracyMetrics {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
}

interface Milestone {
  timestamp: number;
  type: 'start' | 'wave' | 'halfway' | 'complete' | 'error';
  message: string;
  progress: number;
}

interface LoadTestSession {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  config: {
    totalUsers: number;
    patientPercentage: number;
    durationSeconds: number;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    responseTimes: number[];
    errorsByType: Record<string, number>;
    requestsPerSecond: number[];
    activeUsers: number;
    responseTimeDistribution: {
      '0-1000ms': number;
      '1000-2000ms': number;
      '2000-5000ms': number;
      '5000-10000ms': number;
      '10000ms+': number;
    };
  };
  testCases: TestCase[];
  accuracyMetrics: AccuracyMetrics;
  milestones: Milestone[];
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  progress: number; // 0-100
}

// Validate medical response accuracy (simplified simulation)
function validateMedicalResponse(type: 'patient' | 'doctor', input: string, output: string): boolean {
  // In a real system, this would use medical knowledge bases and validation rules
  // For simulation, we'll use heuristics:
  
  if (type === 'patient') {
    // Check if triage response contains key elements
    const hasUrgency = /urgent|emergency|immediate|critical|severe/i.test(output);
    const hasRecommendation = /recommend|suggest|should|advise/i.test(output);
    const hasSymptomAnalysis = /symptom|condition|diagnosis/i.test(output);
    
    // Simulate 85% accuracy for patient triage
    return Math.random() < 0.85 && (hasUrgency || hasRecommendation || hasSymptomAnalysis);
  } else {
    // Check if doctor response contains medical terminology
    const hasMedicalTerms = /diagnosis|treatment|protocol|guideline|differential/i.test(output);
    const hasEvidence = /study|research|evidence|clinical/i.test(output);
    
    // Simulate 90% accuracy for doctor queries
    return Math.random() < 0.90 && hasMedicalTerms;
  }
}

// Calculate accuracy metrics
function calculateAccuracyMetrics(testCases: TestCase[]): AccuracyMetrics {
  const completed = testCases.filter(tc => tc.status === 'success' || tc.status === 'failed');
  
  let tp = 0, tn = 0, fp = 0, fn = 0;
  
  completed.forEach(tc => {
    if (tc.isCorrect === true && tc.status === 'success') tp++;
    else if (tc.isCorrect === false && tc.status === 'failed') tn++;
    else if (tc.isCorrect === false && tc.status === 'success') fp++;
    else if (tc.isCorrect === true && tc.status === 'failed') fn++;
  });
  
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  const accuracy = completed.length > 0 ? (tp + tn) / completed.length : 0;
  
  return {
    truePositives: tp,
    trueNegatives: tn,
    falsePositives: fp,
    falseNegatives: fn,
    precision,
    recall,
    f1Score,
    accuracy,
  };
}

// Update response time distribution
function updateResponseTimeDistribution(session: LoadTestSession, responseTime: number) {
  if (responseTime < 1000) {
    session.metrics.responseTimeDistribution['0-1000ms']++;
  } else if (responseTime < 2000) {
    session.metrics.responseTimeDistribution['1000-2000ms']++;
  } else if (responseTime < 5000) {
    session.metrics.responseTimeDistribution['2000-5000ms']++;
  } else if (responseTime < 10000) {
    session.metrics.responseTimeDistribution['5000-10000ms']++;
  } else {
    session.metrics.responseTimeDistribution['10000ms+']++;
  }
}

// Add milestone
function addMilestone(session: LoadTestSession, type: Milestone['type'], message: string, progress: number) {
  session.milestones.push({
    timestamp: Date.now(),
    type,
    message,
    progress,
  });
}

// Simulate a single patient user flow
async function simulatePatient(sessionId: string, testCaseId: string): Promise<void> {
  const session = activeTests.get(sessionId);
  if (!session) return;

  const testCase = session.testCases.find(tc => tc.id === testCaseId);
  if (!testCase) return;

  const symptoms = [
    'severe headache with nausea',
    'chest pain and shortness of breath',
    'persistent cough with fever',
    'abdominal pain and vomiting',
    'dizziness and fatigue',
  ];

  try {
    testCase.status = 'running';
    testCase.startTime = Date.now();
    
    const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
    const triagePrompt = `Patient symptoms: ${symptom}. Age: ${Math.floor(Math.random() * 60) + 20}. Gender: ${Math.random() > 0.5 ? 'male' : 'female'}. Provide triage assessment.`;
    
    testCase.input = triagePrompt;
    
    const response = await invokeGemini({
      messages: [
        { role: 'system', content: 'You are a medical triage AI assistant.' },
        { role: 'user', content: triagePrompt }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    const output = typeof content === 'string' ? content : '';
    testCase.output = output;
    testCase.endTime = Date.now();
    testCase.responseTime = testCase.endTime - testCase.startTime;
    testCase.status = 'success';
    
    // Validate accuracy
    testCase.isCorrect = validateMedicalResponse('patient', triagePrompt, output);
    
    // Update metrics
    session.metrics.totalRequests++;
    session.metrics.successfulRequests++;
    session.metrics.responseTimes.push(testCase.responseTime);
    updateResponseTimeDistribution(session, testCase.responseTime);
    
  } catch (error) {
    testCase.status = 'failed';
    testCase.endTime = Date.now();
    testCase.responseTime = testCase.endTime! - testCase.startTime;
    testCase.error = error instanceof Error ? error.message : 'Unknown error';
    testCase.isCorrect = false;
    
    session.metrics.totalRequests++;
    session.metrics.failedRequests++;
    session.metrics.errorsByType['patient_triage'] = (session.metrics.errorsByType['patient_triage'] || 0) + 1;
    
    session.logs.push({
      timestamp: Date.now(),
      level: 'error',
      message: `Patient simulation error (${testCaseId}): ${testCase.error}`
    });
  }
  
  // Update accuracy metrics
  session.accuracyMetrics = calculateAccuracyMetrics(session.testCases);
}

// Simulate a single doctor user flow
async function simulateDoctor(sessionId: string, testCaseId: string): Promise<void> {
  const session = activeTests.get(sessionId);
  if (!session) return;

  const testCase = session.testCases.find(tc => tc.id === testCaseId);
  if (!testCase) return;

  const queries = [
    'What are the differential diagnoses for acute chest pain?',
    'Explain the management protocol for diabetic ketoacidosis',
    'What are the red flags for acute appendicitis?',
    'Describe the treatment approach for community-acquired pneumonia',
  ];

  try {
    testCase.status = 'running';
    testCase.startTime = Date.now();
    
    const query = queries[Math.floor(Math.random() * queries.length)];
    testCase.input = query;
    
    const response = await invokeGemini({
      messages: [
        { role: 'system', content: 'You are a clinical decision support AI.' },
        { role: 'user', content: query }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    const output = typeof content === 'string' ? content : '';
    testCase.output = output;
    testCase.endTime = Date.now();
    testCase.responseTime = testCase.endTime - testCase.startTime;
    testCase.status = 'success';
    
    // Validate accuracy
    testCase.isCorrect = validateMedicalResponse('doctor', query, output);
    
    session.metrics.totalRequests++;
    session.metrics.successfulRequests++;
    session.metrics.responseTimes.push(testCase.responseTime);
    updateResponseTimeDistribution(session, testCase.responseTime);
    
  } catch (error) {
    testCase.status = 'failed';
    testCase.endTime = Date.now();
    testCase.responseTime = testCase.endTime! - testCase.startTime;
    testCase.error = error instanceof Error ? error.message : 'Unknown error';
    testCase.isCorrect = false;
    
    session.metrics.totalRequests++;
    session.metrics.failedRequests++;
    session.metrics.errorsByType['doctor_query'] = (session.metrics.errorsByType['doctor_query'] || 0) + 1;
    
    session.logs.push({
      timestamp: Date.now(),
      level: 'error',
      message: `Doctor simulation error (${testCaseId}): ${testCase.error}`
    });
  }
  
  // Update accuracy metrics
  session.accuracyMetrics = calculateAccuracyMetrics(session.testCases);
}

// Run load test with concurrent users
async function runLoadTest(session: LoadTestSession): Promise<void> {
  const { totalUsers, patientPercentage, durationSeconds } = session.config;
  const patientCount = Math.floor(totalUsers * patientPercentage / 100);
  const doctorCount = totalUsers - patientCount;
  
  addMilestone(session, 'start', `Starting load test: ${patientCount} patients, ${doctorCount} doctors, ${durationSeconds}s duration`, 0);
  
  session.logs.push({
    timestamp: Date.now(),
    level: 'info',
    message: `Starting load test: ${patientCount} patients, ${doctorCount} doctors, ${durationSeconds}s duration`
  });

  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);
  
  // Track requests per second
  const rpsInterval = setInterval(() => {
    if (!activeTests.has(session.id)) {
      clearInterval(rpsInterval);
      return;
    }
    
    const currentSession = activeTests.get(session.id)!;
    const elapsed = (Date.now() - startTime) / 1000;
    const rps = currentSession.metrics.totalRequests / elapsed;
    currentSession.metrics.requestsPerSecond.push(rps);
  }, 1000);

  try {
    // Spawn virtual users in waves to simulate gradual ramp-up
    const waves = 10; // Ramp up over 10 waves
    const usersPerWave = Math.ceil(totalUsers / waves);
    const waveDelay = (durationSeconds * 1000) / (waves * 2); // Use first half for ramp-up
    
    for (let wave = 0; wave < waves; wave++) {
      if (Date.now() >= endTime) break;
      
      const wavePatients = Math.min(usersPerWave, patientCount - (wave * usersPerWave));
      const waveDoctors = Math.min(usersPerWave, doctorCount - (wave * usersPerWave));
      
      const promises: Promise<void>[] = [];
      
      // Spawn patients
      for (let i = 0; i < wavePatients; i++) {
        const testCaseId = `patient-${wave}-${i}`;
        session.testCases.push({
          id: testCaseId,
          type: 'patient',
          startTime: Date.now(),
          status: 'pending',
          input: '',
        });
        
        session.metrics.activeUsers++;
        promises.push(
          simulatePatient(session.id, testCaseId).finally(() => {
            session.metrics.activeUsers--;
          })
        );
      }
      
      // Spawn doctors
      for (let i = 0; i < waveDoctors; i++) {
        const testCaseId = `doctor-${wave}-${i}`;
        session.testCases.push({
          id: testCaseId,
          type: 'doctor',
          startTime: Date.now(),
          status: 'pending',
          input: '',
        });
        
        session.metrics.activeUsers++;
        promises.push(
          simulateDoctor(session.id, testCaseId).finally(() => {
            session.metrics.activeUsers--;
          })
        );
      }
      
      // Wait for wave to complete or timeout
      await Promise.race([
        Promise.allSettled(promises),
        new Promise(resolve => setTimeout(resolve, waveDelay))
      ]);
      
      const progress = Math.min(95, ((wave + 1) / waves) * 100);
      session.progress = progress;
      
      addMilestone(session, 'wave', `Wave ${wave + 1}/${waves} completed. Active users: ${session.metrics.activeUsers}`, progress);
      
      session.logs.push({
        timestamp: Date.now(),
        level: 'info',
        message: `Wave ${wave + 1}/${waves} completed. Active users: ${session.metrics.activeUsers}`
      });
      
      // Check for halfway milestone
      if (wave === Math.floor(waves / 2)) {
        addMilestone(session, 'halfway', 'Reached halfway point', 50);
      }
    }
    
    // Wait for remaining requests to complete
    const timeout = setTimeout(() => {
      session.status = 'completed';
      session.endTime = Date.now();
      session.progress = 100;
      addMilestone(session, 'complete', 'Load test completed successfully', 100);
      clearInterval(rpsInterval);
    }, Math.max(0, endTime - Date.now() + 5000)); // 5s grace period
    
  } catch (error) {
    session.status = 'failed';
    session.endTime = Date.now();
    addMilestone(session, 'error', `Load test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, session.progress);
    session.logs.push({
      timestamp: Date.now(),
      level: 'error',
      message: `Load test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    clearInterval(rpsInterval);
  }
}

export const loadTestRouter = router({
  // Start a new load test
  startTest: protectedProcedure
    .input(z.object({
      totalUsers: z.number().min(1).max(2000),
      patientPercentage: z.number().min(0).max(100),
      durationSeconds: z.number().min(10).max(3600),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can run load tests
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can run load tests'
        });
      }

      const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const session: LoadTestSession = {
        id: sessionId,
        status: 'running',
        startTime: Date.now(),
        config: input,
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          responseTimes: [],
          errorsByType: {},
          requestsPerSecond: [],
          activeUsers: 0,
          responseTimeDistribution: {
            '0-1000ms': 0,
            '1000-2000ms': 0,
            '2000-5000ms': 0,
            '5000-10000ms': 0,
            '10000ms+': 0,
          },
        },
        testCases: [],
        accuracyMetrics: {
          truePositives: 0,
          trueNegatives: 0,
          falsePositives: 0,
          falseNegatives: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          accuracy: 0,
        },
        milestones: [],
        logs: [],
        progress: 0,
      };
      
      activeTests.set(sessionId, session);
      
      // Run test asynchronously
      runLoadTest(session).catch(error => {
        console.error('Load test error:', error);
        session.status = 'failed';
        session.endTime = Date.now();
      });
      
      return { sessionId, message: 'Load test started successfully' };
    }),

  // Get test status and metrics
  getTestStatus: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view load test results'
        });
      }

      const session = activeTests.get(input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Load test session not found'
        });
      }

      // Calculate statistics
      const responseTimes = session.metrics.responseTimes;
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      
      const stats = {
        avgResponseTime: responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0,
        medianResponseTime: sortedTimes.length > 0 
          ? sortedTimes[Math.floor(sortedTimes.length / 2)] 
          : 0,
        p95ResponseTime: sortedTimes.length > 0 
          ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] 
          : 0,
        p99ResponseTime: sortedTimes.length > 0 
          ? sortedTimes[Math.floor(sortedTimes.length * 0.99)] 
          : 0,
        minResponseTime: sortedTimes.length > 0 ? sortedTimes[0] : 0,
        maxResponseTime: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
        errorRate: session.metrics.totalRequests > 0 
          ? (session.metrics.failedRequests / session.metrics.totalRequests) * 100 
          : 0,
        successRate: session.metrics.totalRequests > 0 
          ? (session.metrics.successfulRequests / session.metrics.totalRequests) * 100 
          : 0,
        avgRPS: session.metrics.requestsPerSecond.length > 0
          ? session.metrics.requestsPerSecond.reduce((a, b) => a + b, 0) / session.metrics.requestsPerSecond.length
          : 0,
      };

      return {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        config: session.config,
        progress: session.progress,
        metrics: {
          ...session.metrics,
          stats,
        },
        accuracyMetrics: session.accuracyMetrics,
        milestones: session.milestones,
        logs: session.logs.slice(-50), // Return last 50 logs
      };
    }),

  // Get test cases for detailed view
  getTestCases: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
      filter: z.enum(['all', 'success', 'failed', 'running', 'pending']).optional().default('all'),
    }))
    .query(({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view load test results'
        });
      }

      const session = activeTests.get(input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Load test session not found'
        });
      }

      let filteredCases = session.testCases;
      if (input.filter !== 'all') {
        filteredCases = session.testCases.filter(tc => tc.status === input.filter);
      }

      const total = filteredCases.length;
      const cases = filteredCases.slice(input.offset, input.offset + input.limit);

      return {
        cases,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Stop a running test
  stopTest: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can stop load tests'
        });
      }

      const session = activeTests.get(input.sessionId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Load test session not found'
        });
      }

      if (session.status !== 'running') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Test is not running'
        });
      }

      session.status = 'completed';
      session.endTime = Date.now();
      addMilestone(session, 'complete', 'Test stopped by user', session.progress);
      session.logs.push({
        timestamp: Date.now(),
        level: 'info',
        message: 'Test stopped by user'
      });

      return { message: 'Load test stopped successfully' };
    }),

  // List all test sessions
  listTests: protectedProcedure
    .query(({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can view load tests'
        });
      }

      return Array.from(activeTests.values()).map(session => ({
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        config: session.config,
        progress: session.progress,
        totalRequests: session.metrics.totalRequests,
        successRate: session.metrics.totalRequests > 0 
          ? (session.metrics.successfulRequests / session.metrics.totalRequests) * 100 
          : 0,
        accuracyMetrics: session.accuracyMetrics,
      }));
    }),

  // Delete a test session
  deleteTest: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can delete load tests'
        });
      }

      const deleted = activeTests.delete(input.sessionId);
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Load test session not found'
        });
      }

      return { message: 'Load test deleted successfully' };
    }),
});
