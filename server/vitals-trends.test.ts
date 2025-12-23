import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

describe('Vitals Trends & Finger Detection Features', () => {
  const mockContext: TrpcContext = {
    user: {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'patient',
      openId: 'test-open-id',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const caller = appRouter.createCaller(mockContext);

  describe('getTrends endpoint', () => {
    it('should accept timeRange parameter (24h, 7d, 30d, all)', async () => {
      const result = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'heartRate',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept metric parameter (heartRate, stress, rmssd, sdnn)', async () => {
      const heartRateResult = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'heartRate',
      });

      const stressResult = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'stress',
      });

      const rmssdResult = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'rmssd',
      });

      const sdnnResult = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'sdnn',
      });

      expect(heartRateResult).toBeDefined();
      expect(stressResult).toBeDefined();
      expect(rmssdResult).toBeDefined();
      expect(sdnnResult).toBeDefined();
    });

    it('should return data with timestamp, value, and confidence', async () => {
      const result = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'heartRate',
      });

      if (result.length > 0) {
        const item = result[0];
        expect(item).toHaveProperty('timestamp');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('confidence');
      }
    });

    it('should filter out null values', async () => {
      const result = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'heartRate',
      });

      // All returned values should be non-null
      result.forEach(item => {
        expect(item.value).not.toBeNull();
      });
    });
  });

  describe('getStats endpoint', () => {
    it('should return updated stats structure with avgHeartRate, avgStress, avgRMSSD, avgSDNN, totalReadings', async () => {
      const stats = await caller.vitals.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('avgHeartRate');
      expect(stats).toHaveProperty('avgStress');
      expect(stats).toHaveProperty('avgRMSSD');
      expect(stats).toHaveProperty('avgSDNN');
      expect(stats).toHaveProperty('totalReadings');
    });

    it('should return 0 values when no data exists', async () => {
      const stats = await caller.vitals.getStats();

      // If no vitals exist, all should be 0
      if (stats.totalReadings === 0) {
        expect(stats.avgHeartRate).toBe(0);
        expect(stats.avgStress).toBe(0);
        expect(stats.avgRMSSD).toBe(0);
        expect(stats.avgSDNN).toBe(0);
      }
    });

    it('should calculate averages correctly when data exists', async () => {
      // First, log a vital to ensure data exists
      await caller.vitals.logVital({
        heartRate: 75,
        confidence: 85,
        stress: 'NORMAL',
        measurementDuration: 15,
        hrvRmssd: 45.5,
        hrvSdnn: 55.2,
        hrvPnn50: 25.3,
        hrvLfHfRatio: 1.2,
        hrvStressScore: 35,
        hrvAnsBalance: 'BALANCED',
      });

      const stats = await caller.vitals.getStats();

      expect(stats.totalReadings).toBeGreaterThan(0);
      expect(stats.avgHeartRate).toBeGreaterThan(0);
      expect(stats.avgStress).toBeGreaterThanOrEqual(0);
      expect(stats.avgRMSSD).toBeGreaterThanOrEqual(0);
      expect(stats.avgSDNN).toBeGreaterThanOrEqual(0);
    });
  });

  describe('logVital endpoint (finger detection support)', () => {
    it('should accept and store HRV metrics from finger-based detection', async () => {
      const result = await caller.vitals.logVital({
        heartRate: 72,
        confidence: 90, // Higher confidence expected from finger mode
        stress: 'LOW',
        measurementDuration: 15,
        hrvRmssd: 52.3,
        hrvSdnn: 62.1,
        hrvPnn50: 30.5,
        hrvLfHfRatio: 0.9,
        hrvStressScore: 25,
        hrvAnsBalance: 'PARASYMPATHETIC',
        deviceInfo: {
          browser: 'Chrome',
          cameraResolution: '640x480',
          userAgent: 'Test User Agent',
        },
        environmentalFactors: {
          lightingQuality: 'excellent',
          movementDetected: false,
          faceDetectionConfidence: 95,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Vital signs recorded successfully');
    });

    it('should validate heart rate range (30-250 BPM)', async () => {
      // Should reject heart rate below 30
      await expect(
        caller.vitals.logVital({
          heartRate: 25,
          confidence: 80,
          stress: 'LOW',
        })
      ).rejects.toThrow();

      // Should reject heart rate above 250
      await expect(
        caller.vitals.logVital({
          heartRate: 260,
          confidence: 80,
          stress: 'NORMAL',
        })
      ).rejects.toThrow();

      // Should accept valid heart rate
      const result = await caller.vitals.logVital({
        heartRate: 75,
        confidence: 85,
        stress: 'NORMAL',
      });

      expect(result.success).toBe(true);
    });

    it('should validate confidence range (0-100)', async () => {
      // Should reject confidence below 0
      await expect(
        caller.vitals.logVital({
          heartRate: 75,
          confidence: -5,
          stress: 'NORMAL',
        })
      ).rejects.toThrow();

      // Should reject confidence above 100
      await expect(
        caller.vitals.logVital({
          heartRate: 75,
          confidence: 105,
          stress: 'NORMAL',
        })
      ).rejects.toThrow();

      // Should accept valid confidence
      const result = await caller.vitals.logVital({
        heartRate: 75,
        confidence: 85,
        stress: 'NORMAL',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Time range filtering', () => {
    it('should filter vitals by 24h time range', async () => {
      const result = await caller.vitals.getTrends({
        timeRange: '24h',
        metric: 'heartRate',
      });

      // All results should be within last 24 hours
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      result.forEach(item => {
        const timestamp = new Date(item.timestamp);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(oneDayAgo.getTime());
      });
    });

    it('should filter vitals by 7d time range', async () => {
      const result = await caller.vitals.getTrends({
        timeRange: '7d',
        metric: 'heartRate',
      });

      // All results should be within last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      result.forEach(item => {
        const timestamp = new Date(item.timestamp);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
      });
    });

    it('should return all vitals when timeRange is "all"', async () => {
      const result = await caller.vitals.getTrends({
        timeRange: 'all',
        metric: 'heartRate',
      });

      // Should not filter by date
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
