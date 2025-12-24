import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

// Store active load tests in memory
const activeTests = new Map<string, LoadTestSession>();

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
  };
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

// Simulate a single patient user flow
async function simulatePatient(sessionId: string): Promise<void> {
  const session = activeTests.get(sessionId);
  if (!session) return;

  const symptoms = [
    'severe headache with nausea',
    'chest pain and shortness of breath',
    'persistent cough with fever',
    'abdominal pain and vomiting',
    'dizziness and fatigue',
  ];

  try {
    // Simulate triage request
    const startTime = Date.now();
    
    const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
    const triagePrompt = `Patient symptoms: ${symptom}. Age: ${Math.floor(Math.random() * 60) + 20}. Gender: ${Math.random() > 0.5 ? 'male' : 'female'}. Provide triage assessment.`;
    
    await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a medical triage AI assistant.' },
        { role: 'user', content: triagePrompt }
      ]
    });
    
    const responseTime = Date.now() - startTime;
    
    // Update metrics
    session.metrics.totalRequests++;
    session.metrics.successfulRequests++;
    session.metrics.responseTimes.push(responseTime);
    
  } catch (error) {
    session.metrics.totalRequests++;
    session.metrics.failedRequests++;
    session.metrics.errorsByType['patient_triage'] = (session.metrics.errorsByType['patient_triage'] || 0) + 1;
    
    session.logs.push({
      timestamp: Date.now(),
      level: 'error',
      message: `Patient simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Simulate a single doctor user flow
async function simulateDoctor(sessionId: string): Promise<void> {
  const session = activeTests.get(sessionId);
  if (!session) return;

  const queries = [
    'What are the differential diagnoses for acute chest pain?',
    'Explain the management protocol for diabetic ketoacidosis',
    'What are the red flags for acute appendicitis?',
    'Describe the treatment approach for community-acquired pneumonia',
  ];

  try {
    const startTime = Date.now();
    
    const query = queries[Math.floor(Math.random() * queries.length)];
    
    await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a clinical decision support AI.' },
        { role: 'user', content: query }
      ]
    });
    
    const responseTime = Date.now() - startTime;
    
    session.metrics.totalRequests++;
    session.metrics.successfulRequests++;
    session.metrics.responseTimes.push(responseTime);
    
  } catch (error) {
    session.metrics.totalRequests++;
    session.metrics.failedRequests++;
    session.metrics.errorsByType['doctor_query'] = (session.metrics.errorsByType['doctor_query'] || 0) + 1;
    
    session.logs.push({
      timestamp: Date.now(),
      level: 'error',
      message: `Doctor simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Run load test with concurrent users
async function runLoadTest(session: LoadTestSession): Promise<void> {
  const { totalUsers, patientPercentage, durationSeconds } = session.config;
  const patientCount = Math.floor(totalUsers * patientPercentage / 100);
  const doctorCount = totalUsers - patientCount;
  
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
        session.metrics.activeUsers++;
        promises.push(
          simulatePatient(session.id).finally(() => {
            session.metrics.activeUsers--;
          })
        );
      }
      
      // Spawn doctors
      for (let i = 0; i < waveDoctors; i++) {
        session.metrics.activeUsers++;
        promises.push(
          simulateDoctor(session.id).finally(() => {
            session.metrics.activeUsers--;
          })
        );
      }
      
      // Wait for wave to complete or timeout
      await Promise.race([
        Promise.allSettled(promises),
        new Promise(resolve => setTimeout(resolve, waveDelay))
      ]);
      
      session.logs.push({
        timestamp: Date.now(),
        level: 'info',
        message: `Wave ${wave + 1}/${waves} completed. Active users: ${session.metrics.activeUsers}`
      });
    }
    
    // Wait for remaining requests to complete
    const timeout = setTimeout(() => {
      session.status = 'completed';
      session.endTime = Date.now();
      clearInterval(rpsInterval);
    }, Math.max(0, endTime - Date.now() + 5000)); // 5s grace period
    
  } catch (error) {
    session.status = 'failed';
    session.endTime = Date.now();
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
        },
        logs: [],
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
        metrics: {
          ...session.metrics,
          stats,
        },
        logs: session.logs.slice(-50), // Return last 50 logs
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
        totalRequests: session.metrics.totalRequests,
        successRate: session.metrics.totalRequests > 0 
          ? (session.metrics.successfulRequests / session.metrics.totalRequests) * 100 
          : 0,
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
