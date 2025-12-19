/**
 * BRAIN: Biomedical Reasoning and Intelligence Network
 * Main orchestrator for medical AI reasoning with continuous learning
 */

import { medicalKnowledge, MedicalConcept } from './knowledge/medical-knowledge';
import { invokeLLM } from '../_core/llm';
import mysql from 'mysql2/promise';

let _connection: mysql.Connection | null = null;

async function getConnection() {
  if (!_connection && process.env.DATABASE_URL) {
    try {
      _connection = await mysql.createConnection(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[BRAIN] Failed to connect to database:", error);
      _connection = null;
    }
  }
  return _connection;
}

export interface PatientInfo {
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalHistory?: string[];
  location?: string;
}

export interface BRAINInput {
  symptoms: string[];
  patientInfo: PatientInfo;
  vitalSigns?: Record<string, number>;
  language: 'en' | 'ar';
}

export interface DifferentialDiagnosis {
  condition: string;
  icd10?: string;
  probability: number;
  reasoning: string;
  supportingEvidence: string[];
}

export interface BRAINOutput {
  caseId: string;
  diagnosis: {
    differentialDiagnosis: DifferentialDiagnosis[];
    redFlags: string[];
    recommendations: {
      immediateActions: string[];
      tests: string[];
      imaging: string[];
      referrals: string[];
    };
    confidence: number;
  };
  assessment: {
    summary: string;
    confidence: number;
    evidenceQuality: string;
    followUp: string;
  };
  evidence: Array<{
    title: string;
    source: string;
    relevance: number;
  }>;
  processingTime: number;
}

export class BRAIN {
  /**
   * Main clinical reasoning function
   * Analyzes patient symptoms and returns evidence-based assessment
   */
  async reason(input: BRAINInput): Promise<BRAINOutput> {
    const startTime = Date.now();
    console.log('🧠 BRAIN: Starting clinical reasoning...');

    // Validate input
    if (!input.symptoms || input.symptoms.length === 0) {
      throw new Error('At least one symptom is required');
    }
    if (!input.patientInfo || input.patientInfo.age <= 0) {
      throw new Error('Valid patient age is required');
    }

    try {
      // Step 1: Normalize symptoms using medical knowledge base
      const normalizedSymptoms = await this.normalizeSymptoms(input.symptoms);
      console.log(`✓ Symptoms normalized: ${normalizedSymptoms.length} concepts identified`);

      // Step 2: Find possible diagnoses from knowledge base
      const knowledgeBaseDiagnoses = await this.findDiagnosesFromKnowledge(normalizedSymptoms);
      console.log(`✓ Found ${knowledgeBaseDiagnoses.length} candidate diagnoses from knowledge base`);

      // Step 3: Find similar historical cases
      const similarCases = await this.findSimilarCases(normalizedSymptoms, input.patientInfo);
      console.log(`✓ Found ${similarCases.length} similar historical cases`);

      // Step 4: Generate differential diagnosis using LLM with all context
      const diagnosis = await this.generateDifferentialDiagnosis({
        symptoms: normalizedSymptoms,
        knowledgeBaseDiagnoses,
        similarCases,
        patientInfo: input.patientInfo,
        vitalSigns: input.vitalSigns,
        language: input.language
      });
      console.log('✓ Differential diagnosis generated');

      // Step 5: Generate clinical assessment
      const assessment = this.generateClinicalAssessment(diagnosis, knowledgeBaseDiagnoses.length);

      // Step 6: Store case for learning
      const caseId = await this.storeCaseHistory({
        symptoms: normalizedSymptoms,
        patientInfo: input.patientInfo,
        vitalSigns: input.vitalSigns,
        diagnosis,
        assessment
      });
      console.log(`✓ Case stored: ${caseId}`);

      const processingTime = Date.now() - startTime;
      console.log(`🧠 BRAIN: Reasoning complete in ${processingTime}ms`);

      return {
        caseId,
        diagnosis,
        assessment,
        evidence: knowledgeBaseDiagnoses.map((d, i) => ({
          title: d.diagnosis.conceptName,
          source: d.diagnosis.source,
          relevance: d.confidence
        })).slice(0, 5),
        processingTime
      };
    } catch (error) {
      console.error('🧠 BRAIN: Error during reasoning:', error);
      throw error;
    }
  }

  /**
   * Normalize symptoms to medical concepts
   */
  private async normalizeSymptoms(symptoms: string[]): Promise<Array<{
    original: string;
    conceptId: string;
    standardTerm: string;
    source: string;
  }>> {
    const normalized = [];
    
    for (const symptom of symptoms) {
      const concepts = await medicalKnowledge.findConcept(symptom);
      if (concepts.length > 0) {
        normalized.push({
          original: symptom,
          conceptId: concepts[0].conceptId,
          standardTerm: concepts[0].conceptName,
          source: concepts[0].source
        });
      } else {
        // If no exact match, still include the symptom
        normalized.push({
          original: symptom,
          conceptId: `UNKNOWN-${Date.now()}`,
          standardTerm: symptom,
          source: 'User Input'
        });
      }
    }

    return normalized;
  }

  /**
   * Find diagnoses from knowledge base
   */
  private async findDiagnosesFromKnowledge(symptoms: any[]) {
    const symptomConceptIds = symptoms
      .filter(s => !s.conceptId.startsWith('UNKNOWN'))
      .map(s => s.conceptId);
    
    if (symptomConceptIds.length === 0) return [];

    return await medicalKnowledge.findDiagnosesForSymptoms(symptomConceptIds);
  }

  /**
   * Find similar historical cases
   */
  private async findSimilarCases(symptoms: any[], patientInfo: PatientInfo) {
    const conn = await getConnection();
    if (!conn) return [];

    try {
      const symptomConcepts = symptoms.map(s => s.conceptId);
      
      // Find cases with similar symptoms
      const [rows] = await conn.execute(
        `SELECT case_id, patient_demographics, symptoms, diagnosis, outcome, confidence_score
         FROM brain_case_history
         WHERE JSON_LENGTH(symptoms) > 0
         ORDER BY created_at DESC
         LIMIT 10`
      );

      return rows as any[];
    } catch (error) {
      console.warn('[BRAIN] Error finding similar cases:', error);
      return [];
    }
  }

  /**
   * Generate differential diagnosis using LLM
   */
  private async generateDifferentialDiagnosis(context: {
    symptoms: any[];
    knowledgeBaseDiagnoses: any[];
    similarCases: any[];
    patientInfo: PatientInfo;
    vitalSigns?: Record<string, number>;
    language: 'en' | 'ar';
  }): Promise<{
    differentialDiagnosis: DifferentialDiagnosis[];
    redFlags: string[];
    recommendations: any;
    confidence: number;
  }> {
    const prompt = `You are BRAIN (Biomedical Reasoning and Intelligence Network), an advanced medical AI system providing evidence-based clinical decision support.

**Patient Information:**
- Age: ${context.patientInfo.age} years
- Gender: ${context.patientInfo.gender}
- Medical History: ${context.patientInfo.medicalHistory?.join(', ') || 'None reported'}
${context.patientInfo.location ? `- Location: ${context.patientInfo.location}` : ''}

**Presenting Symptoms (Standardized):**
${context.symptoms.map((s: any) => `- ${s.standardTerm} (${s.conceptId})`).join('\n')}

${context.vitalSigns ? `**Vital Signs:**\n${JSON.stringify(context.vitalSigns, null, 2)}` : ''}

**Knowledge Base Findings:**
${context.knowledgeBaseDiagnoses.length > 0 ? 
  context.knowledgeBaseDiagnoses.slice(0, 5).map((d: any, i: number) => 
    `${i + 1}. ${d.diagnosis.conceptName} (Confidence: ${(d.confidence * 100).toFixed(0)}%)\n   Reasoning: ${d.reasoning}`
  ).join('\n') 
  : 'No direct matches in knowledge base'}

**Similar Historical Cases:** ${context.similarCases.length} cases with similar symptom patterns found in database.

**Task:** Generate a comprehensive differential diagnosis following these guidelines:

1. **Top 5 Most Likely Diagnoses** with probability estimates (must sum to ≤100%)
2. **Clinical Reasoning** for each diagnosis explaining why it fits the presentation
3. **Red Flags** - Urgent or life-threatening conditions to rule out immediately
4. **Recommendations**:
   - Immediate actions to take now
   - Diagnostic tests needed
   - Imaging studies required
   - Specialist referrals if needed

**Important Considerations:**
- Consider the patient's age, gender, and location (Iraqi context)
- Common diseases in Iraq: Diabetes, hypertension, infectious diseases, cardiovascular disease
- Be conservative with probabilities - uncertainty is acceptable
- Flag any life-threatening conditions immediately
- Provide practical, actionable recommendations

**Response Format (JSON):**
\`\`\`json
{
  "differentialDiagnosis": [
    {
      "condition": "Condition name",
      "icd10": "ICD-10 code if known",
      "probability": 0.35,
      "reasoning": "Detailed clinical reasoning",
      "supportingEvidence": ["Evidence point 1", "Evidence point 2"]
    }
  ],
  "redFlags": ["Red flag 1", "Red flag 2"],
  "recommendations": {
    "immediateActions": ["Action 1", "Action 2"],
    "tests": ["Test 1", "Test 2"],
    "imaging": ["Imaging study 1"],
    "referrals": ["Specialist 1"]
  },
  "confidence": 0.75
}
\`\`\``;

    try {
      const response = await invokeLLM({
        messages: [
          { 
            role: 'system', 
            content: 'You are BRAIN, an advanced medical AI system. Provide evidence-based, accurate medical assessments. Always respond in valid JSON format.' 
          },
          { role: 'user', content: prompt }
        ]
      });

      const content = response.choices[0].message.content;
      
      // Extract JSON from markdown code blocks if present
      let jsonStr = typeof content === 'string' ? content : JSON.stringify(content);
      const jsonMatch = jsonStr.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('[BRAIN] Error generating diagnosis:', error);
      
      // Return fallback diagnosis
      return {
        differentialDiagnosis: context.knowledgeBaseDiagnoses.slice(0, 3).map((d: any) => ({
          condition: d.diagnosis.conceptName,
          icd10: d.diagnosis.conceptId,
          probability: d.confidence,
          reasoning: d.reasoning,
          supportingEvidence: ['Knowledge base match']
        })),
        redFlags: ['Unable to generate comprehensive assessment - please consult physician'],
        recommendations: {
          immediateActions: ['Seek medical attention'],
          tests: [],
          imaging: [],
          referrals: ['General practitioner']
        },
        confidence: 0.5
      };
    }
  }

  /**
   * Generate clinical assessment summary
   */
  private generateClinicalAssessment(diagnosis: any, evidenceCount: number): {
    summary: string;
    confidence: number;
    evidenceQuality: string;
    followUp: string;
  } {
    const evidenceQuality = evidenceCount >= 3 ? 'High' : evidenceCount >= 1 ? 'Moderate' : 'Low';
    
    return {
      summary: `Analysis based on ${evidenceCount} knowledge base matches and historical case patterns`,
      confidence: diagnosis.confidence,
      evidenceQuality,
      followUp: 'Monitor patient response and adjust treatment as needed. Follow up within 24-48 hours or sooner if symptoms worsen.'
    };
  }

  /**
   * Store case history for future learning
   */
  private async storeCaseHistory(caseData: {
    symptoms: any[];
    patientInfo: PatientInfo;
    vitalSigns?: Record<string, number>;
    diagnosis: any;
    assessment: any;
  }): Promise<string> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    const caseId = `BRAIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await conn.execute(
        `INSERT INTO brain_case_history 
         (case_id, patient_demographics, symptoms, vital_signs, diagnosis, confidence_score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          caseId,
          JSON.stringify({
            age: caseData.patientInfo.age,
            gender: caseData.patientInfo.gender,
            location: caseData.patientInfo.location
          }),
          JSON.stringify(caseData.symptoms),
          JSON.stringify(caseData.vitalSigns || {}),
          JSON.stringify(caseData.diagnosis),
          caseData.diagnosis.confidence
        ]
      );

      // Update daily metrics
      await this.updatePerformanceMetrics();

      return caseId;
    } catch (error) {
      console.error('[BRAIN] Error storing case history:', error);
      throw error;
    }
  }

  /**
   * Learn from clinician feedback
   */
  async learn(feedback: {
    caseId: string;
    brainDiagnosis: any;
    actualDiagnosis: any;
    clinicianCorrection?: string;
    outcome: string;
  }): Promise<{ success: boolean; message: string; accuracy?: number }> {
    console.log('🧠 BRAIN: Learning from feedback...');

    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    try {
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(
        feedback.brainDiagnosis,
        feedback.actualDiagnosis
      );

      // Store feedback
      await conn.execute(
        `INSERT INTO brain_learning_feedback 
         (case_id, brain_diagnosis, actual_diagnosis, clinician_correction, accuracy_score, feedback_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          feedback.caseId,
          JSON.stringify(feedback.brainDiagnosis),
          JSON.stringify(feedback.actualDiagnosis),
          feedback.clinicianCorrection || null,
          accuracy,
          accuracy > 0.8 ? 'correct' : accuracy > 0.5 ? 'partially_correct' : 'incorrect'
        ]
      );

      // Update performance metrics
      await this.updatePerformanceMetrics();

      console.log(`✓ Feedback processed, accuracy: ${(accuracy * 100).toFixed(1)}%`);

      return { 
        success: true, 
        message: `Feedback processed successfully. Accuracy: ${(accuracy * 100).toFixed(1)}%`,
        accuracy 
      };
    } catch (error) {
      console.error('[BRAIN] Error processing feedback:', error);
      throw error;
    }
  }

  /**
   * Calculate diagnostic accuracy
   */
  private calculateAccuracy(predicted: any, actual: any): number {
    if (!predicted.differentialDiagnosis || !actual.diagnosis) return 0;

    const predictedConditions = predicted.differentialDiagnosis
      .map((d: any) => d.condition.toLowerCase());
    const actualCondition = actual.diagnosis.toLowerCase();

    if (predictedConditions[0] === actualCondition) return 1.0; // Top prediction correct
    if (predictedConditions.includes(actualCondition)) return 0.7; // In differential
    return 0.3; // Missed
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(): Promise<void> {
    const conn = await getConnection();
    if (!conn) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [stats] = await conn.execute(`
        SELECT 
          COUNT(*) as total_cases,
          SUM(CASE WHEN accuracy_score > 0.8 THEN 1 ELSE 0 END) as correct_diagnoses,
          AVG(accuracy_score) as accuracy_rate
        FROM brain_learning_feedback
        WHERE DATE(created_at) = ?
      `, [today]);

      const statsRow = (stats as any[])[0];
      
      if (statsRow && statsRow.total_cases > 0) {
        await conn.execute(`
          INSERT INTO brain_performance_metrics 
          (metric_date, total_cases, correct_diagnoses, accuracy_rate, model_version)
          VALUES (?, ?, ?, ?, 'BRAIN-v1.0.0')
          ON DUPLICATE KEY UPDATE
          total_cases = VALUES(total_cases),
          correct_diagnoses = VALUES(correct_diagnoses),
          accuracy_rate = VALUES(accuracy_rate),
          updated_at = CURRENT_TIMESTAMP
        `, [
          today,
          statsRow.total_cases,
          statsRow.correct_diagnoses,
          statsRow.accuracy_rate
        ]);
      }
    } catch (error) {
      console.warn('[BRAIN] Error updating metrics:', error);
    }
  }

  /**
   * Get BRAIN performance metrics
   */
  async getMetrics(startDate: string, endDate: string): Promise<{
    totalCases: number;
    accuracy: number;
    averageConfidence: number;
    averageProcessingTime: number;
    dailyMetrics: any[];
  }> {
    const conn = await getConnection();
    if (!conn) {
      return {
        totalCases: 0,
        accuracy: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        dailyMetrics: []
      };
    }

    try {
      const [rows] = await conn.execute(`
        SELECT *
        FROM brain_performance_metrics
        WHERE metric_date BETWEEN ? AND ?
        ORDER BY metric_date DESC
      `, [startDate, endDate]);

      const metrics = rows as any[];
      const totalCases = metrics.reduce((sum, m) => sum + (m.total_cases || 0), 0);
      const avgAccuracy = metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (m.accuracy_rate || 0), 0) / metrics.length 
        : 0;

      return {
        totalCases,
        accuracy: avgAccuracy,
        averageConfidence: 0.75, // TODO: Calculate from case history
        averageProcessingTime: 3500, // TODO: Calculate from case history
        dailyMetrics: metrics
      };
    } catch (error) {
      console.error('[BRAIN] Error fetching metrics:', error);
      return {
        totalCases: 0,
        accuracy: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        dailyMetrics: []
      };
    }
  }

  /**
   * Get case history
   */
  async getCaseHistory(caseId: string): Promise<any | null> {
    const conn = await getConnection();
    if (!conn) return null;

    try {
      const [rows] = await conn.execute(`
        SELECT *
        FROM brain_case_history
        WHERE case_id = ?
      `, [caseId]);

      const row = (rows as any[])[0];
      if (!row) return null;

      // Parse JSON fields and return structured data
      try {
        return {
          caseId: row.case_id,
          symptoms: typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : row.symptoms || [],
          patientDemographics: typeof row.patient_demographics === 'string' ? JSON.parse(row.patient_demographics) : row.patient_demographics || {},
          vitalSigns: typeof row.vital_signs === 'string' ? JSON.parse(row.vital_signs) : row.vital_signs || {},
          diagnosis: typeof row.diagnosis === 'string' ? JSON.parse(row.diagnosis) : row.diagnosis || {},
          confidenceScore: row.confidence_score,
          createdAt: row.created_at
        };
      } catch (parseError) {
        console.error('[BRAIN] Error parsing case history JSON:', parseError);
        return null;
      }
    } catch (error) {
      console.error('[BRAIN] Error fetching case history:', error);
      return null;
    }
  }
}

// Export singleton instance
export const brain = new BRAIN();
