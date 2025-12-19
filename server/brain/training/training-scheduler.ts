/**
 * BRAIN Training Scheduler
 * Automated periodic training and model updates
 */

import { trainingPipeline, TrainingMetrics } from './training-pipeline';
import mysql from 'mysql2/promise';

let _connection: mysql.Connection | null = null;

async function getConnection() {
  if (!_connection && process.env.DATABASE_URL) {
    try {
      _connection = await mysql.createConnection(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Training Scheduler] Failed to connect to database:", error);
      _connection = null;
    }
  }
  return _connection;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  minNewCases: number; // Minimum new cases before triggering training
  autoApprove: boolean; // Automatically apply model updates
}

export class TrainingScheduler {
  private config: ScheduleConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config?: Partial<ScheduleConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      frequency: config?.frequency || 'weekly',
      minNewCases: config?.minNewCases || 50,
      autoApprove: config?.autoApprove || false
    };
  }

  /**
   * Start the training scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('⏰ Training scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('⏰ Training scheduler is disabled');
      return;
    }

    console.log(`⏰ Starting training scheduler (${this.config.frequency})`);
    this.isRunning = true;

    // Set interval based on frequency
    const intervalMs = this.getIntervalMs();
    this.intervalId = setInterval(() => {
      this.checkAndTrain().catch(error => {
        console.error('[Training Scheduler] Error during scheduled training:', error);
      });
    }, intervalMs);

    // Run initial check
    this.checkAndTrain().catch(error => {
      console.error('[Training Scheduler] Error during initial training check:', error);
    });
  }

  /**
   * Stop the training scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏰ Training scheduler stopped');
  }

  /**
   * Check if training is needed and execute
   */
  private async checkAndTrain(): Promise<void> {
    console.log('⏰ Checking if training is needed...');

    const conn = await getConnection();
    if (!conn) {
      console.log('⏰ Database not available, skipping training check');
      return;
    }

    try {
      // Check when last training occurred
      const [lastTraining] = await conn.execute(`
        SELECT start_time, cases_processed
        FROM brain_training_sessions
        WHERE status = 'completed'
        ORDER BY start_time DESC
        LIMIT 1
      `);

      const lastTrainingTime = (lastTraining as any[])[0]?.start_time;
      
      // Check how many new cases since last training
      const [newCases] = await conn.execute(`
        SELECT COUNT(*) as new_cases
        FROM brain_learning_feedback
        WHERE created_at > COALESCE(?, '2000-01-01')
      `, [lastTrainingTime || null]);

      const newCaseCount = (newCases as any[])[0]?.new_cases || 0;

      console.log(`⏰ Found ${newCaseCount} new cases since last training`);

      if (newCaseCount >= this.config.minNewCases) {
        console.log('⏰ Training threshold met, starting training session...');
        const metrics = await trainingPipeline.startTrainingSession();
        
        console.log(`⏰ Training completed: ${metrics.casesProcessed} cases, accuracy improved by ${metrics.improvementRate.toFixed(2)}%`);

        // Send notification about training completion
        await this.notifyTrainingComplete(metrics);

        // Auto-approve if configured
        if (this.config.autoApprove && metrics.improvementRate > 0) {
          await this.approveModelUpdate(metrics.sessionId);
        }
      } else {
        console.log(`⏰ Not enough new cases (${newCaseCount}/${this.config.minNewCases}), skipping training`);
      }
    } catch (error) {
      console.error('[Training Scheduler] Error checking training status:', error);
    }
  }

  /**
   * Get interval in milliseconds based on frequency
   */
  private getIntervalMs(): number {
    switch (this.config.frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default to weekly
    }
  }

  /**
   * Notify about training completion
   */
  private async notifyTrainingComplete(metrics: TrainingMetrics): Promise<void> {
    const conn = await getConnection();
    if (!conn) return;

    try {
      // Store notification
      await conn.execute(`
        INSERT INTO brain_training_notifications 
        (session_id, notification_type, message, created_at)
        VALUES (?, 'training_complete', ?, NOW())
      `, [
        metrics.sessionId,
        `Training completed: ${metrics.casesProcessed} cases processed, accuracy improved by ${metrics.improvementRate.toFixed(2)}%`
      ]);

      console.log('✓ Training notification sent');
    } catch (error) {
      console.warn('[Training Scheduler] Error sending notification:', error);
    }
  }

  /**
   * Approve model update
   */
  private async approveModelUpdate(sessionId: string): Promise<void> {
    const conn = await getConnection();
    if (!conn) return;

    try {
      await conn.execute(`
        UPDATE brain_training_sessions 
        SET approved = TRUE, approved_at = NOW()
        WHERE session_id = ?
      `, [sessionId]);

      console.log(`✓ Model update approved for session ${sessionId}`);
    } catch (error) {
      console.warn('[Training Scheduler] Error approving model update:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    config: ScheduleConfig;
    nextTrainingCheck: Date | null;
  } {
    const nextCheck = this.isRunning && this.intervalId
      ? new Date(Date.now() + this.getIntervalMs())
      : null;

    return {
      isRunning: this.isRunning,
      config: this.config,
      nextTrainingCheck: nextCheck
    };
  }

  /**
   * Trigger manual training
   */
  async triggerManualTraining(): Promise<TrainingMetrics> {
    console.log('🎓 Manual training triggered');
    return await trainingPipeline.startTrainingSession();
  }
}

// Export singleton instance
export const trainingScheduler = new TrainingScheduler();

// Auto-start scheduler if enabled
if (process.env.NODE_ENV === 'production') {
  trainingScheduler.start();
}
