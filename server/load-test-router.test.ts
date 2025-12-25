import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock the LLM invocation
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: 'This is a medical triage response with urgent recommendation and symptom analysis.'
      }
    }]
  })
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'admin-123',
    email: 'admin@test.com',
    name: 'Admin User',
    loginMethod: 'manus',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: 'user-456',
    email: 'user@test.com',
    name: 'Regular User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Load Test Router - Enhanced Features', () => {
  describe('Authorization', () => {
    it('should allow admin to start load test', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 70,
        durationSeconds: 30,
      });

      expect(result).toHaveProperty('sessionId');
      expect(result.message).toBe('Load test started successfully');
    });

    it('should prevent non-admin from starting load test', async () => {
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);

      await expect(
        userCaller.loadTest.startTest({
          totalUsers: 10,
          patientPercentage: 70,
          durationSeconds: 30,
        })
      ).rejects.toThrow('Only administrators can run load tests');
    });

    it('should prevent non-admin from viewing test status', async () => {
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);

      await expect(
        userCaller.loadTest.getTestStatus({ sessionId: 'test-123' })
      ).rejects.toThrow('Only administrators can view load test results');
    });

    it('should prevent non-admin from stopping test', async () => {
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);

      await expect(
        userCaller.loadTest.stopTest({ sessionId: 'test-123' })
      ).rejects.toThrow('Only administrators can stop load tests');
    });

    it('should prevent non-admin from deleting test', async () => {
      const userCtx = createUserContext();
      const userCaller = appRouter.createCaller(userCtx);

      await expect(
        userCaller.loadTest.deleteTest({ sessionId: 'test-123' })
      ).rejects.toThrow('Only administrators can delete load tests');
    });
  });

  describe('Test Session Creation', () => {
    it('should create test session with initial metrics', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 20,
        patientPercentage: 60,
        durationSeconds: 60,
      });

      expect(result.sessionId).toMatch(/^test-\d+-[a-z0-9]+$/);

      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.status).toBe('running');
      expect(status.config).toEqual({
        totalUsers: 20,
        patientPercentage: 60,
        durationSeconds: 60,
      });
      expect(status.metrics).toHaveProperty('totalRequests');
      expect(status.metrics).toHaveProperty('successfulRequests');
      expect(status.metrics).toHaveProperty('failedRequests');
      expect(status.metrics).toHaveProperty('responseTimeDistribution');
      expect(status.progress).toBeGreaterThanOrEqual(0);
    });

    it('should initialize accuracy metrics', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.accuracyMetrics).toBeDefined();
      expect(status.accuracyMetrics).toHaveProperty('truePositives');
      expect(status.accuracyMetrics).toHaveProperty('trueNegatives');
      expect(status.accuracyMetrics).toHaveProperty('falsePositives');
      expect(status.accuracyMetrics).toHaveProperty('falseNegatives');
      expect(status.accuracyMetrics).toHaveProperty('precision');
      expect(status.accuracyMetrics).toHaveProperty('recall');
      expect(status.accuracyMetrics).toHaveProperty('f1Score');
      expect(status.accuracyMetrics).toHaveProperty('accuracy');
    });

    it('should initialize milestones array', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.milestones).toBeDefined();
      expect(Array.isArray(status.milestones)).toBe(true);
      expect(status.milestones.length).toBeGreaterThan(0);
      expect(status.milestones[0]).toHaveProperty('timestamp');
      expect(status.milestones[0]).toHaveProperty('type');
      expect(status.milestones[0]).toHaveProperty('message');
      expect(status.milestones[0]).toHaveProperty('progress');
    });
  });

  describe('Response Time Distribution', () => {
    it('should track response time distribution', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      // Wait for some requests to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.metrics.responseTimeDistribution).toBeDefined();
      expect(status.metrics.responseTimeDistribution).toHaveProperty('0-1000ms');
      expect(status.metrics.responseTimeDistribution).toHaveProperty('1000-2000ms');
      expect(status.metrics.responseTimeDistribution).toHaveProperty('2000-5000ms');
      expect(status.metrics.responseTimeDistribution).toHaveProperty('5000-10000ms');
      expect(status.metrics.responseTimeDistribution).toHaveProperty('10000ms+');

      // At least some requests should be tracked
      const totalDistribution = Object.values(status.metrics.responseTimeDistribution).reduce((a, b) => a + b, 0);
      expect(totalDistribution).toBeGreaterThan(0);
    });
  });

  describe('Test Case Tracking', () => {
    it('should retrieve test cases', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      // Wait for some test cases to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      const testCases = await adminCaller.loadTest.getTestCases({
        sessionId: result.sessionId,
        limit: 50,
        offset: 0,
        filter: 'all',
      });

      expect(testCases).toBeDefined();
      expect(testCases).toHaveProperty('cases');
      expect(testCases).toHaveProperty('total');
      expect(testCases).toHaveProperty('hasMore');
      expect(Array.isArray(testCases.cases)).toBe(true);
    });

    it('should filter test cases by status', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const successCases = await adminCaller.loadTest.getTestCases({
        sessionId: result.sessionId,
        limit: 50,
        offset: 0,
        filter: 'success',
      });

      expect(successCases.cases.every(tc => tc.status === 'success')).toBe(true);
    });

    it('should track test case details', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 5,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const testCases = await adminCaller.loadTest.getTestCases({
        sessionId: result.sessionId,
        limit: 10,
        offset: 0,
        filter: 'all',
      });

      if (testCases.cases.length > 0) {
        const testCase = testCases.cases[0];
        expect(testCase).toHaveProperty('id');
        expect(testCase).toHaveProperty('type');
        expect(['patient', 'doctor']).toContain(testCase.type);
        expect(testCase).toHaveProperty('status');
        expect(testCase).toHaveProperty('input');
        
        if (testCase.status === 'success' || testCase.status === 'failed') {
          expect(testCase).toHaveProperty('responseTime');
          expect(testCase).toHaveProperty('isCorrect');
        }
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should track test progress', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const status1 = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });
      expect(status1.progress).toBeGreaterThanOrEqual(0);
      expect(status1.progress).toBeLessThanOrEqual(100);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const status2 = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });
      expect(status2.progress).toBeGreaterThanOrEqual(status1.progress);
    });
  });

  describe('Milestones', () => {
    it('should record start milestone', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      const startMilestone = status.milestones.find(m => m.type === 'start');
      expect(startMilestone).toBeDefined();
      expect(startMilestone?.progress).toBe(0);
      expect(startMilestone?.message).toContain('Starting load test');
    });

    it('should record wave milestones', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      const waveMilestones = status.milestones.filter(m => m.type === 'wave');
      expect(waveMilestones.length).toBeGreaterThan(0);
      expect(waveMilestones[0].message).toContain('Wave');
    });
  });

  describe('Accuracy Metrics Calculation', () => {
    it('should calculate precision correctly', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.accuracyMetrics.precision).toBeGreaterThanOrEqual(0);
      expect(status.accuracyMetrics.precision).toBeLessThanOrEqual(1);
    });

    it('should calculate recall correctly', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.accuracyMetrics.recall).toBeGreaterThanOrEqual(0);
      expect(status.accuracyMetrics.recall).toBeLessThanOrEqual(1);
    });

    it('should calculate F1 score correctly', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.accuracyMetrics.f1Score).toBeGreaterThanOrEqual(0);
      expect(status.accuracyMetrics.f1Score).toBeLessThanOrEqual(1);

      // F1 score should be harmonic mean of precision and recall
      const { precision, recall, f1Score } = status.accuracyMetrics;
      if (precision > 0 && recall > 0) {
        const expectedF1 = 2 * (precision * recall) / (precision + recall);
        expect(Math.abs(f1Score - expectedF1)).toBeLessThan(0.01);
      }
    });

    it('should calculate overall accuracy correctly', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.accuracyMetrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(status.accuracyMetrics.accuracy).toBeLessThanOrEqual(1);

      // Accuracy should be (TP + TN) / Total
      const { truePositives, trueNegatives, falsePositives, falseNegatives, accuracy } = status.accuracyMetrics;
      const total = truePositives + trueNegatives + falsePositives + falseNegatives;
      if (total > 0) {
        const expectedAccuracy = (truePositives + trueNegatives) / total;
        expect(Math.abs(accuracy - expectedAccuracy)).toBeLessThan(0.01);
      }
    });
  });

  describe('Test Management', () => {
    it('should list all tests', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result1 = await adminCaller.loadTest.startTest({
        totalUsers: 5,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      const result2 = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 60,
        durationSeconds: 60,
      });

      const tests = await adminCaller.loadTest.listTests();

      expect(tests.length).toBeGreaterThanOrEqual(2);
      expect(tests.some(t => t.id === result1.sessionId)).toBe(true);
      expect(tests.some(t => t.id === result2.sessionId)).toBe(true);
    });

    it('should include accuracy metrics in test list', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 5,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const tests = await adminCaller.loadTest.listTests();
      const test = tests.find(t => t.id === result.sessionId);

      expect(test).toBeDefined();
      expect(test?.accuracyMetrics).toBeDefined();
      expect(test?.progress).toBeGreaterThanOrEqual(0);
    });

    it('should stop running test', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 60,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const stopResult = await adminCaller.loadTest.stopTest({ sessionId: result.sessionId });
      expect(stopResult.message).toBe('Load test stopped successfully');

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });
      expect(status.status).toBe('completed');
      expect(status.endTime).toBeDefined();
    });

    it('should delete test session', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 5,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      const deleteResult = await adminCaller.loadTest.deleteTest({ sessionId: result.sessionId });
      expect(deleteResult.message).toBe('Load test deleted successfully');

      await expect(
        adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId })
      ).rejects.toThrow('Load test session not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid session ID', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      await expect(
        adminCaller.loadTest.getTestStatus({ sessionId: 'invalid-session-id' })
      ).rejects.toThrow('Load test session not found');
    });

    it('should validate input parameters', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      await expect(
        adminCaller.loadTest.startTest({
          totalUsers: 0, // Invalid: below minimum
          patientPercentage: 50,
          durationSeconds: 30,
        })
      ).rejects.toThrow();

      await expect(
        adminCaller.loadTest.startTest({
          totalUsers: 10,
          patientPercentage: 150, // Invalid: above maximum
          durationSeconds: 30,
        })
      ).rejects.toThrow();

      await expect(
        adminCaller.loadTest.startTest({
          totalUsers: 10,
          patientPercentage: 50,
          durationSeconds: 5, // Invalid: below minimum
        })
      ).rejects.toThrow();
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate response time statistics', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.metrics.stats).toBeDefined();
      expect(status.metrics.stats.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.medianResponseTime).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.p95ResponseTime).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.p99ResponseTime).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.minResponseTime).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.maxResponseTime).toBeGreaterThanOrEqual(status.metrics.stats.minResponseTime);
    });

    it('should calculate success and error rates', async () => {
      const adminCtx = createAdminContext();
      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.loadTest.startTest({
        totalUsers: 10,
        patientPercentage: 50,
        durationSeconds: 30,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await adminCaller.loadTest.getTestStatus({ sessionId: result.sessionId });

      expect(status.metrics.stats.successRate).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.successRate).toBeLessThanOrEqual(100);
      expect(status.metrics.stats.errorRate).toBeGreaterThanOrEqual(0);
      expect(status.metrics.stats.errorRate).toBeLessThanOrEqual(100);
      
      // Success rate + error rate should equal 100%
      const sum = status.metrics.stats.successRate + status.metrics.stats.errorRate;
      expect(Math.abs(sum - 100)).toBeLessThan(0.1);
    });
  });
});
