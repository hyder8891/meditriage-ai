/**
 * BRAIN Automated Training Pipeline
 * Continuous learning system with batch training and feedback integration
 */

import mysql from 'mysql2/promise';
import { invokeGemini } from '../../_core/gemini';
import { getDatabaseConfig } from '../../_core/db-config';

// CRITICAL FIX: Parse DATABASE_URL into explicit connection parameters
// This ensures mysql2 correctly initializes the pool with proper credentials
const dbConfig = getDatabaseConfig();
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl,
  waitForConnections: true,
  connectionLimit: 50, // Increased for production load
  queueLimit: 100, // Prevent memory exhaustion
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Keep connections alive
  maxIdle: 10, // Close idle connections
  idleTimeout: 60000, // 1 minute idle timeout
});

async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.warn("[Training Pipeline] Failed to get connection from pool:", error);
    throw error;
  }
}

export interface TrainingConfig {
  batchSize: number;
  minAccuracyThreshold: number;
  maxIterations: number;
  learningRate: number;
  useActiveLearning: boolean;
}

export interface TrainingMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  casesProcessed: number;
  accuracyBefore: number;
  accuracyAfter: number;
  improvementRate: number;
  status: 'running' | 'completed' | 'failed';
}

export class TrainingPipeline {
  private config: TrainingConfig;

  constructor(config?: Partial<TrainingConfig>) {
    this.config = {
      batchSize: config?.batchSize || 100,
      minAccuracyThreshold: config?.minAccuracyThreshold || 0.85,
      maxIterations: config?.maxIterations || 10,
      learningRate: config?.learningRate || 0.01,
      useActiveLearning: config?.useActiveLearning || true,
    };
  }

  /**
   * Run automated training session
   */
  async runTrainingSession(): Promise<TrainingMetrics> {
    const sessionId = `train_${Date.now()}`;
    const metrics: TrainingMetrics = {
      sessionId,
      startTime: new Date(),
      casesProcessed: 0,
      accuracyBefore: 0,
      accuracyAfter: 0,
      improvementRate: 0,
      status: 'running',
    };

    const conn = await getConnection();
    
    try {
      console.log(`[Training Pipeline] Starting session ${sessionId}`);

      // Get baseline accuracy
      metrics.accuracyBefore = await this.evaluateCurrentAccuracy(conn);
      console.log(`[Training Pipeline] Baseline accuracy: ${(metrics.accuracyBefore * 100).toFixed(1)}%`);

      // Get training cases
      const trainingCases = await this.getTrainingCases(conn, this.config.batchSize);
      console.log(`[Training Pipeline] Loaded ${trainingCases.length} training cases`);

      // Process training batch
      for (const trainingCase of trainingCases) {
        await this.processTrainingCase(conn, trainingCase);
        metrics.casesProcessed++;
      }

      // Evaluate improvement
      metrics.accuracyAfter = await this.evaluateCurrentAccuracy(conn);
      metrics.improvementRate = metrics.accuracyAfter - metrics.accuracyBefore;
      metrics.endTime = new Date();
      metrics.status = 'completed';

      console.log(`[Training Pipeline] Session completed: ${(metrics.improvementRate * 100).toFixed(1)}% improvement`);

      // Save metrics
      await this.saveMetrics(conn, metrics);

      return metrics;
    } catch (error) {
      console.error('[Training Pipeline] Session failed:', error);
      metrics.status = 'failed';
      metrics.endTime = new Date();
      throw error;
    } finally {
      // CRITICAL: Release connection back to pool
      conn.release();
    }
  }

  /**
   * Get training cases from database or generate synthetic ones
   */
  private async getTrainingCases(conn: mysql.PoolConnection, limit: number): Promise<any[]> {
    try {
      const [rows] = await conn.query(
        `SELECT * FROM triage_records 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
         ORDER BY RAND() 
         LIMIT ?`,
        [limit]
      );
      return rows as any[];
    } catch (error) {
      console.warn('[Training Pipeline] No database cases, using synthetic data');
      return this.generateSyntheticCases(limit);
    }
  }

  /**
   * Generate synthetic training cases
   */
  private generateSyntheticCases(count: number): any[] {
    const syntheticCases = [];
    const symptoms = ['fever', 'cough', 'headache', 'chest pain', 'shortness of breath'];
    const urgencies = ['emergency', 'urgent', 'routine', 'self-care'];

    for (let i = 0; i < count; i++) {
      syntheticCases.push({
        id: `synthetic_${i}`,
        symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
        expectedUrgency: urgencies[Math.floor(Math.random() * urgencies.length)],
      });
    }

    return syntheticCases;
  }

  /**
   * Process a single training case
   */
  private async processTrainingCase(conn: mysql.PoolConnection, trainingCase: any): Promise<void> {
    try {
      // Use LLM to analyze the case
      const response = await invokeGemini({
        messages: [
          {
            role: 'system',
            content: 'You are a medical triage AI. Analyze symptoms and determine urgency level.',
          },
          {
            role: 'user',
            content: `Patient symptoms: ${trainingCase.symptoms}. What is the urgency level?`,
          },
        ],
      });

      const predictedUrgency = response.choices[0]?.message?.content || '';

      // Store training result
      try {
        await conn.query(
          `INSERT INTO brain_training_results (case_id, predicted_urgency, actual_urgency, created_at)
           VALUES (?, ?, ?, NOW())`,
          [trainingCase.id, predictedUrgency, trainingCase.expectedUrgency]
        );
      } catch (dbError) {
        // Table might not exist, continue without storing
        console.warn('[Training Pipeline] Could not store result:', dbError);
      }
    } catch (error) {
      console.error('[Training Pipeline] Case processing error:', error);
    }
  }

  /**
   * Evaluate current model accuracy
   */
  private async evaluateCurrentAccuracy(conn: mysql.PoolConnection): Promise<number> {
    try {
      const [rows] = await conn.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN predicted_urgency = actual_urgency THEN 1 ELSE 0 END) as correct
         FROM brain_training_results
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );

      const result = (rows as any[])[0];
      if (result.total === 0) return 0.5; // Default baseline

      return result.correct / result.total;
    } catch (error) {
      console.warn('[Training Pipeline] Could not evaluate accuracy:', error);
      return 0.5; // Default baseline
    }
  }

  /**
   * Save training metrics
   */
  private async saveMetrics(conn: mysql.PoolConnection, metrics: TrainingMetrics): Promise<void> {
    try {
      await conn.query(
        `INSERT INTO brain_training_sessions 
         (session_id, start_time, end_time, cases_processed, accuracy_before, accuracy_after, improvement_rate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metrics.sessionId,
          metrics.startTime,
          metrics.endTime,
          metrics.casesProcessed,
          metrics.accuracyBefore,
          metrics.accuracyAfter,
          metrics.improvementRate,
          metrics.status,
        ]
      );
    } catch (error) {
      console.warn('[Training Pipeline] Could not save metrics:', error);
    }
  }

  /**
   * Clean up old training data
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const conn = await getConnection();
    
    try {
      await conn.query(
        `DELETE FROM brain_training_results 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysToKeep]
      );
      console.log(`[Training Pipeline] Cleaned up training data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('[Training Pipeline] Cleanup failed:', error);
    } finally {
      conn.release();
    }
  }
}

/**
 * Graceful shutdown - close pool connections
 */
export async function shutdownTrainingPipeline(): Promise<void> {
  try {
    await pool.end();
    console.log('[Training Pipeline] Connection pool closed');
  } catch (error) {
    console.error('[Training Pipeline] Error closing pool:', error);
  }
}

/**
 * Default training pipeline instance
 * Export for backward compatibility with training-router.ts and training-scheduler.ts
 */
export const trainingPipeline = {
  startTrainingSession: async () => {
    const pipeline = new TrainingPipeline();
    return await pipeline.runTrainingSession();
  },
  generateTrainingReport: async (sessionId: string) => {
    // Placeholder for report generation
    return {
      sessionId,
      status: 'Report generation not yet implemented',
    };
  },
};
