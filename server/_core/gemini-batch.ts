/**
 * Gemini Flash Batch Processing API
 * 50% cost savings for historical data analysis and training data generation
 */

import { invokeGeminiFlash } from './gemini-dual';
import mysql from 'mysql2/promise';

interface BatchJob {
  id: string;
  type: 'historical_analysis' | 'training_data' | 'retrospective_review';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  results: any[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

interface BatchItem {
  id: string;
  jobId: string;
  input: any;
  output?: any;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

/**
 * Process historical cases in batches for training data generation
 */
export async function batchProcessHistoricalCases(
  caseIds: number[],
  analysisType: 'diagnosis_review' | 'outcome_analysis' | 'pattern_extraction'
): Promise<BatchJob> {
  const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: BatchJob = {
    id: jobId,
    type: 'historical_analysis',
    status: 'pending',
    totalItems: caseIds.length,
    processedItems: 0,
    results: [],
    createdAt: new Date(),
  };

  try {
    // Get database connection
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    // Process in batches of 50 for optimal performance
    const batchSize = 50;
    job.status = 'processing';

    for (let i = 0; i < caseIds.length; i += batchSize) {
      const batch = caseIds.slice(i, i + batchSize);
      
      // Fetch case data
      const [cases] = await connection.execute(
        `SELECT * FROM cases WHERE id IN (${batch.join(',')})` 
      );

      // Process each case with Gemini Flash (batch mode)
      const batchPromises = (cases as any[]).map(async (caseData) => {
        try {
          const prompt = buildAnalysisPrompt(caseData, analysisType);
          
          // Use Gemini Flash for fast batch processing
          const result = await invokeGeminiFlash(
            [
              { role: 'system', content: 'You are analyzing historical medical cases for training data generation.' },
              { role: 'user', content: prompt }
            ],
            {
              temperature: 0.2,
              thinkingLevel: 'low',
              systemInstruction: 'Extract structured insights from historical cases. Be concise and accurate.'
            }
          );

          return {
            caseId: caseData.id,
            analysis: result,
            status: 'completed'
          };
        } catch (error) {
          return {
            caseId: caseData.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      job.results.push(...batchResults);
      job.processedItems += batch.length;

      console.log(`[Batch] Processed ${job.processedItems}/${job.totalItems} cases`);
    }

    await connection.end();

    job.status = 'completed';
    job.completedAt = new Date();
    
    console.log(`[Batch] Job ${jobId} completed: ${job.processedItems} cases processed`);
    return job;

  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    
    console.error(`[Batch] Job ${jobId} failed:`, error);
    return job;
  }
}

/**
 * Generate training data from successful diagnoses
 */
export async function batchGenerateTrainingData(
  startDate: Date,
  endDate: Date
): Promise<BatchJob> {
  const jobId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: BatchJob = {
    id: jobId,
    type: 'training_data',
    status: 'pending',
    totalItems: 0,
    processedItems: 0,
    results: [],
    createdAt: new Date(),
  };

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    // Get successful cases with confirmed diagnoses
    const [cases] = await connection.execute(
      `SELECT c.*, d.diagnosis, d.probability, d.reasoning 
       FROM cases c 
       JOIN diagnoses d ON c.id = d.case_id 
       WHERE c.created_at BETWEEN ? AND ? 
       AND c.status = 'completed'
       AND d.probability > 0.8
       ORDER BY c.created_at DESC`,
      [startDate, endDate]
    );

    job.totalItems = (cases as any[]).length;
    job.status = 'processing';

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < (cases as any[]).length; i += batchSize) {
      const batch = (cases as any[]).slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (caseData: any) => {
        try {
          // Generate structured training example
          const prompt = `Convert this clinical case into a structured training example:

Case ID: ${caseData.id}
Chief Complaint: ${caseData.chief_complaint}
Diagnosis: ${caseData.diagnosis}
Confidence: ${caseData.probability}
Reasoning: ${caseData.reasoning}

Generate a JSON training example with:
1. Input symptoms and patient data
2. Expected diagnosis
3. Key reasoning steps
4. Confidence factors

Return ONLY valid JSON.`;

          const result = await invokeGeminiFlash(
            [
              { role: 'system', content: 'You are generating structured training data for medical AI.' },
              { role: 'user', content: prompt }
            ],
            {
              temperature: 0.1, // Very low for consistency
              thinkingLevel: 'low',
            }
          );

          return {
            caseId: caseData.id,
            trainingExample: result,
            status: 'completed'
          };
        } catch (error) {
          return {
            caseId: caseData.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      job.results.push(...batchResults);
      job.processedItems += batch.length;

      console.log(`[Training Batch] Generated ${job.processedItems}/${job.totalItems} examples`);
    }

    await connection.end();

    job.status = 'completed';
    job.completedAt = new Date();
    
    console.log(`[Training Batch] Job ${jobId} completed: ${job.processedItems} examples generated`);
    return job;

  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    
    console.error(`[Training Batch] Job ${jobId} failed:`, error);
    return job;
  }
}

/**
 * Retrospective analysis of diagnostic accuracy
 */
export async function batchRetrospectiveAnalysis(
  timeRange: { start: Date; end: Date }
): Promise<BatchJob> {
  const jobId = `retro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: BatchJob = {
    id: jobId,
    type: 'retrospective_review',
    status: 'pending',
    totalItems: 0,
    processedItems: 0,
    results: [],
    createdAt: new Date(),
  };

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    // Get cases with outcomes
    const [cases] = await connection.execute(
      `SELECT c.*, d.diagnosis as predicted_diagnosis, d.probability,
              f.feedback_type, f.correct_diagnosis
       FROM cases c
       LEFT JOIN diagnoses d ON c.id = d.case_id
       LEFT JOIN brain_feedback f ON c.id = f.case_id
       WHERE c.created_at BETWEEN ? AND ?
       AND c.status = 'completed'`,
      [timeRange.start, timeRange.end]
    );

    job.totalItems = (cases as any[]).length;
    job.status = 'processing';

    // Analyze accuracy patterns
    const batchSize = 50;
    for (let i = 0; i < (cases as any[]).length; i += batchSize) {
      const batch = (cases as any[]).slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (caseData: any) => {
        try {
          const prompt = `Analyze diagnostic accuracy for this case:

Predicted: ${caseData.predicted_diagnosis} (${caseData.probability}% confidence)
Actual: ${caseData.correct_diagnosis || 'Not provided'}
Feedback: ${caseData.feedback_type || 'None'}

Provide analysis:
1. Was the diagnosis correct?
2. What factors contributed to accuracy/error?
3. What can be learned?
4. Recommendations for improvement

Return JSON with: {accuracy: boolean, factors: string[], lessons: string[], recommendations: string[]}`;

          const result = await invokeGeminiFlash(
            [
              { role: 'system', content: 'You are analyzing diagnostic accuracy for quality improvement.' },
              { role: 'user', content: prompt }
            ],
            {
              temperature: 0.2,
              thinkingLevel: 'low',
            }
          );

          return {
            caseId: caseData.id,
            analysis: result,
            status: 'completed'
          };
        } catch (error) {
          return {
            caseId: caseData.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      job.results.push(...batchResults);
      job.processedItems += batch.length;

      console.log(`[Retrospective] Analyzed ${job.processedItems}/${job.totalItems} cases`);
    }

    await connection.end();

    job.status = 'completed';
    job.completedAt = new Date();
    
    console.log(`[Retrospective] Job ${jobId} completed: ${job.processedItems} cases analyzed`);
    return job;

  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    
    console.error(`[Retrospective] Job ${jobId} failed:`, error);
    return job;
  }
}

/**
 * Build analysis prompt based on type
 */
function buildAnalysisPrompt(caseData: any, analysisType: string): string {
  switch (analysisType) {
    case 'diagnosis_review':
      return `Review this historical diagnosis:
      
Case: ${caseData.chief_complaint}
Patient: Age ${caseData.patient_age}, ${caseData.patient_gender}
Urgency: ${caseData.urgency}

Analyze:
1. Was the triage level appropriate?
2. What diagnostic patterns are present?
3. What can be learned for future cases?

Return JSON with insights.`;

    case 'outcome_analysis':
      return `Analyze outcome for this case:
      
Case ID: ${caseData.id}
Status: ${caseData.status}
Created: ${caseData.created_at}

Evaluate:
1. Time to resolution
2. Treatment effectiveness indicators
3. Follow-up needs

Return JSON with outcome metrics.`;

    case 'pattern_extraction':
      return `Extract diagnostic patterns from this case:
      
Chief Complaint: ${caseData.chief_complaint}
Urgency: ${caseData.urgency}

Identify:
1. Symptom patterns
2. Demographic factors
3. Urgency indicators
4. Iraqi context factors

Return JSON with extracted patterns.`;

    default:
      return `Analyze case ${caseData.id}`;
  }
}

/**
 * Get batch job status
 */
export async function getBatchJobStatus(jobId: string): Promise<BatchJob | null> {
  // In production, this would query a database
  // For now, return null (jobs are in-memory)
  return null;
}

// Export types
export type { BatchJob, BatchItem };
