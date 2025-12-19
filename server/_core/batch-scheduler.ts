/**
 * Automated Batch Processing Scheduler
 * Runs nightly, weekly, and monthly batch jobs for BRAIN training
 */

import cron from 'node-cron';
import { 
  batchGenerateTrainingData, 
  batchRetrospectiveAnalysis, 
  batchProcessHistoricalCases 
} from './gemini-batch';
import { notifyOwner } from './notification';

// Job status tracking
interface JobRun {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed';
  results?: any;
  error?: string;
}

const jobHistory: JobRun[] = [];
const MAX_HISTORY = 100;

/**
 * Log job execution
 */
function logJob(run: JobRun) {
  jobHistory.unshift(run);
  if (jobHistory.length > MAX_HISTORY) {
    jobHistory.pop();
  }
  console.log(`[Batch Scheduler] ${run.jobName}: ${run.status}`, run.error || run.results);
}

/**
 * Get job history
 */
export function getJobHistory(limit = 20): JobRun[] {
  return jobHistory.slice(0, limit);
}

/**
 * Nightly Training Data Generation
 * Runs at 2:00 AM every day
 * Extracts successful diagnoses from the past 24 hours
 */
export function scheduleNightlyTraining() {
  // Run at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    const run: JobRun = {
      jobName: 'Nightly Training Data Generation',
      startTime: new Date(),
      status: 'running'
    };

    try {
      console.log('[Batch Scheduler] Starting nightly training data generation...');

      // Get yesterday's date range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);

      // Generate training data from successful cases
      const batchJob = await batchGenerateTrainingData(startDate, endDate);

      run.endTime = new Date();
      run.status = 'success';
      run.results = {
        jobId: batchJob.id,
        status: batchJob.status,
        totalItems: batchJob.totalItems,
        processedItems: batchJob.processedItems,
        results: batchJob.results.length
      };

      logJob(run);

      // Notify owner of completion
      await notifyOwner({
        title: '🎓 Nightly Training Complete',
        content: `Processed ${run.results.processedItems} of ${run.results.totalItems} cases.\nStatus: ${run.results.status}\nResults: ${run.results.results} items generated.`
      });

      console.log('[Batch Scheduler] Nightly training completed successfully');

    } catch (error) {
      run.endTime = new Date();
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : 'Unknown error';
      logJob(run);

      // Notify owner of failure
      await notifyOwner({
        title: '⚠️ Nightly Training Failed',
        content: `Error: ${run.error}`
      });

      console.error('[Batch Scheduler] Nightly training failed:', error);
    }
  });

  console.log('[Batch Scheduler] Nightly training job scheduled (2:00 AM daily)');
}

/**
 * Weekly Retrospective Analysis
 * Runs at 3:00 AM every Sunday
 * Analyzes diagnostic accuracy over the past week
 */
export function scheduleWeeklyRetrospective() {
  // Run at 3:00 AM every Sunday
  cron.schedule('0 3 * * 0', async () => {
    const run: JobRun = {
      jobName: 'Weekly Retrospective Analysis',
      startTime: new Date(),
      status: 'running'
    };

    try {
      console.log('[Batch Scheduler] Starting weekly retrospective analysis...');

      // Get past week's date range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      // Run retrospective analysis
      const batchJob = await batchRetrospectiveAnalysis({ start: startDate, end: endDate });

      run.endTime = new Date();
      run.status = 'success';
      run.results = {
        jobId: batchJob.id,
        status: batchJob.status,
        totalItems: batchJob.totalItems,
        processedItems: batchJob.processedItems,
        results: batchJob.results.length
      };

      logJob(run);

      // Notify owner with insights
      await notifyOwner({
        title: '📊 Weekly Retrospective Complete',
        content: `Analyzed ${run.results.totalItems} cases from the past week.\n\nProcessed: ${run.results.processedItems}\nResults: ${run.results.results} insights generated\n\nView detailed insights in the training dashboard.`
      });

      console.log('[Batch Scheduler] Weekly retrospective completed successfully');

    } catch (error) {
      run.endTime = new Date();
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : 'Unknown error';
      logJob(run);

      await notifyOwner({
        title: '⚠️ Weekly Retrospective Failed',
        content: `Error: ${run.error}`
      });

      console.error('[Batch Scheduler] Weekly retrospective failed:', error);
    }
  });

  console.log('[Batch Scheduler] Weekly retrospective job scheduled (3:00 AM Sundays)');
}

/**
 * Monthly Pattern Extraction
 * Runs at 4:00 AM on the 1st of each month
 * Extracts diagnostic patterns and trends from the past month
 */
export function scheduleMonthlyPatternExtraction() {
  // Run at 4:00 AM on the 1st of each month
  cron.schedule('0 4 1 * *', async () => {
    const run: JobRun = {
      jobName: 'Monthly Pattern Extraction',
      startTime: new Date(),
      status: 'running'
    };

    try {
      console.log('[Batch Scheduler] Starting monthly pattern extraction...');

      // Get past month's date range
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);

      // Extract patterns from historical cases - need to get case IDs first
      // For now, use a placeholder implementation
      console.log('Monthly pattern extraction: Implementation pending - need to query case IDs from date range');
      
      run.endTime = new Date();
      run.status = 'success';
      run.results = {
        message: 'Pattern extraction scheduled but implementation pending',
        note: 'Need to implement case ID query from date range'
      };

      logJob(run);

      // Notify owner with summary
      await notifyOwner({
        title: '🔍 Monthly Pattern Extraction Scheduled',
        content: `Pattern extraction job scheduled for ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.\n\nNote: Full implementation pending.`
      });

      console.log('[Batch Scheduler] Monthly pattern extraction completed successfully');

    } catch (error) {
      run.endTime = new Date();
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : 'Unknown error';
      logJob(run);

      await notifyOwner({
        title: '⚠️ Monthly Pattern Extraction Failed',
        content: `Error: ${run.error}`
      });

      console.error('[Batch Scheduler] Monthly pattern extraction failed:', error);
    }
  });

  console.log('[Batch Scheduler] Monthly pattern extraction job scheduled (4:00 AM, 1st of month)');
}

/**
 * Initialize all scheduled jobs
 */
export function initializeBatchScheduler() {
  console.log('[Batch Scheduler] Initializing automated batch processing...');
  
  scheduleNightlyTraining();
  scheduleWeeklyRetrospective();
  scheduleMonthlyPatternExtraction();
  
  console.log('[Batch Scheduler] All batch jobs initialized successfully');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    jobs: [
      {
        name: 'Nightly Training Data Generation',
        schedule: '2:00 AM daily',
        description: 'Extracts training data from successful diagnoses',
        lastRun: jobHistory.find(j => j.jobName === 'Nightly Training Data Generation')
      },
      {
        name: 'Weekly Retrospective Analysis',
        schedule: '3:00 AM Sundays',
        description: 'Analyzes diagnostic accuracy over the past week',
        lastRun: jobHistory.find(j => j.jobName === 'Weekly Retrospective Analysis')
      },
      {
        name: 'Monthly Pattern Extraction',
        schedule: '4:00 AM, 1st of month',
        description: 'Extracts diagnostic patterns and trends',
        lastRun: jobHistory.find(j => j.jobName === 'Monthly Pattern Extraction')
      }
    ],
    recentRuns: getJobHistory(10)
  };
}
