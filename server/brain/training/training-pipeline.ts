/**
 * BRAIN Automated Training Pipeline
 * Continuous learning system with batch training and feedback integration
 */

import mysql from 'mysql2/promise';
import { invokeLLM } from '../../_core/llm';

let _connection: mysql.Connection | null = null;

async function getConnection() {
  if (!_connection && process.env.DATABASE_URL) {
    try {
      _connection = await mysql.createConnection(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Training Pipeline] Failed to connect to database:", error);
      _connection = null;
    }
  }
  return _connection;
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
      useActiveLearning: config?.useActiveLearning || true
    };
  }

  /**
   * Start automated training session
   */
  async startTrainingSession(): Promise<TrainingMetrics> {
    console.log('🎓 Starting BRAIN training session...');
    
    const sessionId = `train-${Date.now()}`;
    const startTime = new Date();
    
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    try {
      // Step 1: Calculate baseline accuracy
      const accuracyBefore = await this.calculateCurrentAccuracy();
      console.log(`✓ Baseline accuracy: ${(accuracyBefore * 100).toFixed(2)}%`);

      // Step 2: Collect training data from feedback
      const trainingData = await this.collectTrainingData();
      console.log(`✓ Collected ${trainingData.length} training cases`);

      // Step 3: Identify uncertain cases for active learning
      const uncertainCases = this.config.useActiveLearning 
        ? await this.identifyUncertainCases()
        : [];
      console.log(`✓ Identified ${uncertainCases.length} uncertain cases for focused training`);

      // Step 4: Process training batches
      let casesProcessed = 0;
      for (let i = 0; i < trainingData.length; i += this.config.batchSize) {
        const batch = trainingData.slice(i, i + this.config.batchSize);
        await this.processBatch(batch);
        casesProcessed += batch.length;
        console.log(`✓ Processed batch ${Math.floor(i / this.config.batchSize) + 1}: ${casesProcessed}/${trainingData.length} cases`);
      }

      // Step 5: Calculate post-training accuracy
      const accuracyAfter = await this.calculateCurrentAccuracy();
      const improvementRate = ((accuracyAfter - accuracyBefore) / accuracyBefore) * 100;
      console.log(`✓ Post-training accuracy: ${(accuracyAfter * 100).toFixed(2)}%`);
      console.log(`✓ Improvement: ${improvementRate > 0 ? '+' : ''}${improvementRate.toFixed(2)}%`);

      // Step 6: Store training session results
      await conn.execute(`
        INSERT INTO brain_training_sessions 
        (session_id, start_time, end_time, cases_processed, accuracy_before, accuracy_after, improvement_rate, status)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, 'completed')
      `, [sessionId, startTime, casesProcessed, accuracyBefore, accuracyAfter, improvementRate]);

      const endTime = new Date();
      console.log(`🎓 Training session completed in ${(endTime.getTime() - startTime.getTime()) / 1000}s`);

      return {
        sessionId,
        startTime,
        endTime,
        casesProcessed,
        accuracyBefore,
        accuracyAfter,
        improvementRate,
        status: 'completed'
      };
    } catch (error) {
      console.error('[Training Pipeline] Error during training:', error);
      
      // Log failed session
      await conn.execute(`
        INSERT INTO brain_training_sessions 
        (session_id, start_time, end_time, cases_processed, status, error_message)
        VALUES (?, ?, NOW(), 0, 'failed', ?)
      `, [sessionId, startTime, (error as Error).message]);

      throw error;
    }
  }

  /**
   * Calculate current model accuracy
   */
  private async calculateCurrentAccuracy(): Promise<number> {
    const conn = await getConnection();
    if (!conn) return 0;

    try {
      const [rows] = await conn.execute(`
        SELECT AVG(accuracy_score) as avg_accuracy
        FROM brain_learning_feedback
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      const result = (rows as any[])[0];
      return result?.avg_accuracy || 0;
    } catch (error) {
      console.warn('[Training Pipeline] Error calculating accuracy:', error);
      return 0;
    }
  }

  /**
   * Collect training data from feedback
   */
  private async collectTrainingData(): Promise<any[]> {
    const conn = await getConnection();
    if (!conn) return [];

    try {
      const [rows] = await conn.execute(`
        SELECT 
          f.case_id,
          f.brain_diagnosis,
          f.actual_diagnosis,
          f.clinician_correction,
          f.accuracy_score,
          c.symptoms,
          c.patient_demographics,
          c.vital_signs
        FROM brain_learning_feedback f
        JOIN brain_case_history c ON f.case_id = c.case_id
        WHERE f.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ORDER BY f.created_at DESC
      `);

      return rows as any[];
    } catch (error) {
      console.warn('[Training Pipeline] Error collecting training data:', error);
      return [];
    }
  }

  /**
   * Identify uncertain cases for active learning
   */
  private async identifyUncertainCases(): Promise<any[]> {
    const conn = await getConnection();
    if (!conn) return [];

    try {
      // Find cases where BRAIN had low confidence or was incorrect
      const [rows] = await conn.execute(`
        SELECT 
          c.case_id,
          c.symptoms,
          c.diagnosis,
          c.confidence_score,
          f.accuracy_score
        FROM brain_case_history c
        LEFT JOIN brain_learning_feedback f ON c.case_id = f.case_id
        WHERE c.confidence_score < 0.7 OR f.accuracy_score < 0.5
        ORDER BY c.created_at DESC
        LIMIT 50
      `);

      return rows as any[];
    } catch (error) {
      console.warn('[Training Pipeline] Error identifying uncertain cases:', error);
      return [];
    }
  }

  /**
   * Process a batch of training cases
   */
  private async processBatch(batch: any[]): Promise<void> {
    const conn = await getConnection();
    if (!conn) return;

    for (const case_ of batch) {
      try {
        // Extract patterns from correct diagnoses
        const patterns = await this.extractDiagnosticPatterns(case_);
        
        // Update knowledge base with learned patterns
        await this.updateKnowledgeBase(patterns);
        
        // If case was incorrect, analyze why
        if (case_.accuracy_score < 0.8) {
          await this.analyzeError(case_);
        }
      } catch (error) {
        console.warn(`[Training Pipeline] Error processing case ${case_.case_id}:`, error);
      }
    }
  }

  /**
   * Extract diagnostic patterns from case
   */
  private async extractDiagnosticPatterns(case_: any): Promise<any> {
    try {
      const symptoms = JSON.parse(case_.symptoms || '[]');
      const actualDiagnosis = JSON.parse(case_.actual_diagnosis || '{}');
      
      const prompt = `Analyze this medical case and extract key diagnostic patterns:

**Symptoms:** ${symptoms.map((s: any) => s.standardTerm || s).join(', ')}
**Confirmed Diagnosis:** ${actualDiagnosis.diagnosis}
**Patient Demographics:** ${case_.patient_demographics}

Extract:
1. Key symptom combinations that strongly indicate this diagnosis
2. Critical differentiating features
3. Common pitfalls or similar conditions to rule out

Respond in JSON format:
{
  "keySymptomCombinations": ["symptom1 + symptom2", ...],
  "differentiatingFeatures": ["feature1", ...],
  "commonPitfalls": ["condition1", ...]
}`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a medical AI learning system extracting diagnostic patterns.' },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'diagnostic_patterns',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                keySymptomCombinations: {
                  type: 'array',
                  items: { type: 'string' }
                },
                differentiatingFeatures: {
                  type: 'array',
                  items: { type: 'string' }
                },
                commonPitfalls: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['keySymptomCombinations', 'differentiatingFeatures', 'commonPitfalls'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(typeof content === 'string' ? content : '{}');
    } catch (error) {
      console.warn('[Training Pipeline] Error extracting patterns:', error);
      return null;
    }
  }

  /**
   * Update knowledge base with learned patterns
   */
  private async updateKnowledgeBase(patterns: any): Promise<void> {
    if (!patterns) return;

    const conn = await getConnection();
    if (!conn) return;

    try {
      // Store learned patterns for future reference
      await conn.execute(`
        INSERT INTO brain_learned_patterns 
        (pattern_type, pattern_data, confidence, created_at)
        VALUES ('diagnostic_pattern', ?, 0.8, NOW())
      `, [JSON.stringify(patterns)]);
    } catch (error) {
      console.warn('[Training Pipeline] Error updating knowledge base:', error);
    }
  }

  /**
   * Analyze why BRAIN made an error
   */
  private async analyzeError(case_: any): Promise<void> {
    const conn = await getConnection();
    if (!conn) return;

    try {
      const brainDiagnosis = JSON.parse(case_.brain_diagnosis || '{}');
      const actualDiagnosis = JSON.parse(case_.actual_diagnosis || '{}');

      const errorAnalysis = {
        caseId: case_.case_id,
        predictedCondition: brainDiagnosis.differentialDiagnosis?.[0]?.condition,
        actualCondition: actualDiagnosis.diagnosis,
        missedSymptoms: case_.clinician_correction || 'None provided',
        errorType: this.classifyError(brainDiagnosis, actualDiagnosis),
        timestamp: new Date()
      };

      // Store error analysis
      await conn.execute(`
        INSERT INTO brain_error_analysis 
        (case_id, predicted_condition, actual_condition, missed_symptoms, error_type, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        errorAnalysis.caseId,
        errorAnalysis.predictedCondition,
        errorAnalysis.actualCondition,
        errorAnalysis.missedSymptoms,
        errorAnalysis.errorType
      ]);

      console.log(`✓ Error analyzed: ${errorAnalysis.errorType} for case ${case_.case_id}`);
    } catch (error) {
      console.warn('[Training Pipeline] Error analyzing error:', error);
    }
  }

  /**
   * Classify type of diagnostic error
   */
  private classifyError(predicted: any, actual: any): string {
    if (!predicted.differentialDiagnosis || predicted.differentialDiagnosis.length === 0) {
      return 'no_diagnosis';
    }

    const predictedConditions = predicted.differentialDiagnosis.map((d: any) => d.condition.toLowerCase());
    const actualCondition = actual.diagnosis.toLowerCase();

    if (!predictedConditions.includes(actualCondition)) {
      return 'missed_diagnosis';
    }

    if (predictedConditions[0] !== actualCondition) {
      return 'incorrect_ranking';
    }

    return 'unknown';
  }

  /**
   * Generate training report
   */
  async generateTrainingReport(sessionId: string): Promise<any> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    try {
      const [session] = await conn.execute(`
        SELECT * FROM brain_training_sessions WHERE session_id = ?
      `, [sessionId]);

      const [recentErrors] = await conn.execute(`
        SELECT error_type, COUNT(*) as count
        FROM brain_error_analysis
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY error_type
      `);

      const [performanceTrend] = await conn.execute(`
        SELECT metric_date, accuracy_rate
        FROM brain_performance_metrics
        ORDER BY metric_date DESC
        LIMIT 30
      `);

      return {
        session: (session as any[])[0],
        errorBreakdown: recentErrors,
        performanceTrend: performanceTrend
      };
    } catch (error) {
      console.error('[Training Pipeline] Error generating report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const trainingPipeline = new TrainingPipeline();
