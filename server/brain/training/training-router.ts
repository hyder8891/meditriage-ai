/**
 * BRAIN Training System tRPC Router
 * API endpoints for training management and monitoring
 */

import { router, protectedProcedure } from '../../_core/trpc';
import { z } from 'zod';
import { trainingPipeline } from './training-pipeline';
import { trainingScheduler } from './training-scheduler';
import { performanceMonitor } from './performance-monitor';

export const trainingRouter = router({
  /**
   * Start manual training session
   */
  startTraining: protectedProcedure
    .mutation(async () => {
      const metrics = await trainingPipeline.startTrainingSession();
      return {
        success: true,
        metrics
      };
    }),

  /**
   * Get training history
   */
  getTrainingHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10)
    }))
    .query(async ({ input }) => {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection(process.env.DATABASE_URL!);
      try {
        const [rows] = await conn.execute(`
          SELECT * FROM brain_training_sessions
          ORDER BY start_time DESC
          LIMIT ?
        `, [input.limit]);
        return rows;
      } finally {
        await conn.end();
      }
    }),

  /**
   * Get training session details
   */
  getTrainingSession: protectedProcedure
    .input(z.object({
      sessionId: z.string()
    }))
    .query(async ({ input }) => {
      const report = await trainingPipeline.generateTrainingReport(input.sessionId);
      return report;
    }),

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'all']).optional().default('month')
    }))
    .query(async ({ input }) => {
      const metrics = await performanceMonitor.getPerformanceMetrics(input.period);
      return metrics;
    }),

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations: protectedProcedure
    .query(async () => {
      const recommendations = await performanceMonitor.generateOptimizationRecommendations();
      return recommendations;
    }),

  /**
   * Export performance report
   */
  exportPerformanceReport: protectedProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'all']).optional().default('month')
    }))
    .query(async ({ input }) => {
      const report = await performanceMonitor.exportPerformanceReport(input.period);
      return { report };
    }),

  /**
   * Get scheduler status
   */
  getSchedulerStatus: protectedProcedure
    .query(async () => {
      const status = trainingScheduler.getStatus();
      return status;
    }),

  /**
   * Update scheduler configuration
   */
  updateSchedulerConfig: protectedProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      minNewCases: z.number().optional(),
      autoApprove: z.boolean().optional()
    }))
    .mutation(async ({ input }) => {
      // Stop current scheduler
      trainingScheduler.stop();
      
      // Create new scheduler with updated config
      const newScheduler = new (trainingScheduler.constructor as any)(input);
      
      // Start if enabled
      if (input.enabled !== false) {
        newScheduler.start();
      }

      return {
        success: true,
        status: newScheduler.getStatus()
      };
    }),

  /**
   * Trigger manual training
   */
  triggerManualTraining: protectedProcedure
    .mutation(async () => {
      const metrics = await trainingScheduler.triggerManualTraining();
      return {
        success: true,
        metrics
      };
    }),

  /**
   * Get training statistics
   */
  getTrainingStats: protectedProcedure
    .query(async () => {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection(process.env.DATABASE_URL!);
      try {
        const [rows] = await conn.execute(`
          SELECT 
            COUNT(*) as total_sessions,
            SUM(cases_processed) as total_cases_processed,
            AVG(accuracy_after) as avg_accuracy,
            AVG(improvement_rate) as avg_improvement
          FROM brain_training_sessions
          WHERE status = 'completed'
        `);
        return (rows as any[])[0];
      } finally {
        await conn.end();
      }
    })
});
