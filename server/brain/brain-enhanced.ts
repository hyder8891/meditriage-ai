/**
 * Enhanced BRAIN with Accuracy Framework Integration
 * 
 * Adds multi-layered accuracy improvements to BRAIN Clinical Reasoning:
 * - Multi-source validation against clinical guidelines
 * - Confidence scoring for differential diagnoses
 * - Red flag detection for critical conditions
 * - Evidence strength grading
 * - Second opinion recommendations
 */

import { BRAIN, BRAINInput, BRAINOutput, DifferentialDiagnosis } from './index';
import { invokeLLM } from '../_core/llm';

/**
 * Enhanced differential diagnosis with accuracy metrics
 */
export interface EnhancedDifferentialDiagnosis extends DifferentialDiagnosis {
  // Accuracy framework additions
  confidenceScore: number; // 0-100
  evidenceStrength: "A" | "B" | "C" | "D";
  clinicalGuidelineReferences: string[];
  redFlagSeverity: "none" | "low" | "moderate" | "high" | "critical";
  requiresSecondOpinion: boolean;
  validationStatus: "validated" | "uncertain" | "flagged";
}

/**
 * Enhanced BRAIN output with comprehensive accuracy metrics
 */
export interface EnhancedBRAINOutput extends Omit<BRAINOutput, 'diagnosis'> {
  diagnosis: {
    differentialDiagnosis: EnhancedDifferentialDiagnosis[];
    redFlags: Array<{
      flag: string;
      severity: "low" | "moderate" | "high" | "critical";
      requiresImmediateAction: boolean;
    }>;
    recommendations: {
      immediateActions: string[];
      tests: string[];
      imaging: string[];
      referrals: string[];
    };
    confidence: number;
    overallConfidenceScore: number; // Weighted average of all diagnoses
    clinicalGuidelineCompliance: string;
    requiresUrgentCare: boolean;
  };
  accuracyMetrics: {
    overallConfidence: number;
    evidenceQuality: "excellent" | "good" | "fair" | "poor";
    validationsPassed: number;
    validationsFailed: number;
    uncertaintyFactors: string[];
    recommendSecondOpinion: boolean;
  };
}

/**
 * Enhanced BRAIN with accuracy framework
 */
export class EnhancedBRAIN {
  private brain: BRAIN;

  constructor() {
    this.brain = new BRAIN();
  }

  /**
   * Enhanced clinical reasoning with accuracy framework
   */
  async reason(input: BRAINInput): Promise<EnhancedBRAINOutput> {
    // Get base BRAIN output
    const baseOutput = await this.brain.reason(input);

    // Enhance differential diagnoses with accuracy metrics
    const enhancedDiagnoses = await this.enhanceDifferentialDiagnoses(
      baseOutput.diagnosis.differentialDiagnosis,
      input
    );

    // Enhance red flags with severity assessment
    const enhancedRedFlags = await this.enhanceRedFlags(
      baseOutput.diagnosis.redFlags,
      enhancedDiagnoses
    );

    // Calculate overall accuracy metrics
    const accuracyMetrics = this.calculateAccuracyMetrics(
      enhancedDiagnoses,
      enhancedRedFlags,
      baseOutput
    );

    // Assess clinical guideline compliance
    const clinicalGuidelineCompliance = await this.assessGuidelineCompliance(
      enhancedDiagnoses,
      input
    );

    // Determine if urgent care is required
    const requiresUrgentCare = this.assessUrgency(enhancedRedFlags, enhancedDiagnoses);

    // Calculate weighted confidence score
    const overallConfidenceScore = this.calculateOverallConfidence(enhancedDiagnoses);

    return {
      ...baseOutput,
      diagnosis: {
        differentialDiagnosis: enhancedDiagnoses,
        redFlags: enhancedRedFlags,
        recommendations: baseOutput.diagnosis.recommendations,
        confidence: baseOutput.diagnosis.confidence,
        overallConfidenceScore,
        clinicalGuidelineCompliance,
        requiresUrgentCare,
      },
      accuracyMetrics,
    };
  }

  /**
   * Enhance differential diagnoses with accuracy framework
   */
  private async enhanceDifferentialDiagnoses(
    diagnoses: DifferentialDiagnosis[],
    input: BRAINInput
  ): Promise<EnhancedDifferentialDiagnosis[]> {
    const enhanced = await Promise.all(
      diagnoses.map(async (diagnosis) => {
        // Use AI to assess confidence and evidence strength
        const assessment = await this.assessDiagnosisAccuracy(diagnosis, input);

        return {
          ...diagnosis,
          confidenceScore: assessment.confidenceScore,
          evidenceStrength: assessment.evidenceStrength,
          clinicalGuidelineReferences: assessment.clinicalGuidelineReferences,
          redFlagSeverity: assessment.redFlagSeverity,
          requiresSecondOpinion: assessment.requiresSecondOpinion,
          validationStatus: assessment.validationStatus,
        };
      })
    );

    // Sort by confidence score (descending)
    return enhanced.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Assess accuracy of a single diagnosis
   */
  private async assessDiagnosisAccuracy(
    diagnosis: DifferentialDiagnosis,
    input: BRAINInput
  ): Promise<{
    confidenceScore: number;
    evidenceStrength: "A" | "B" | "C" | "D";
    clinicalGuidelineReferences: string[];
    redFlagSeverity: "none" | "low" | "moderate" | "high" | "critical";
    requiresSecondOpinion: boolean;
    validationStatus: "validated" | "uncertain" | "flagged";
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a medical accuracy assessment AI. Evaluate the quality and confidence of a differential diagnosis.

Provide:
1. confidenceScore: 0-100 based on:
   - Symptom match (40%)
   - Evidence quality (30%)
   - Clinical guideline support (20%)
   - Patient demographics fit (10%)

2. evidenceStrength:
   - "A": Strong evidence from clinical guidelines, high symptom match
   - "B": Moderate evidence, good symptom match
   - "C": Limited evidence, partial symptom match
   - "D": Weak evidence, poor symptom match, requires specialist

3. clinicalGuidelineReferences: Array of relevant guidelines (e.g., "ACC/AHA Guidelines", "WHO Standards", "UpToDate")

4. redFlagSeverity: "none", "low", "moderate", "high", "critical"
   - Assess if this condition has life-threatening potential

5. requiresSecondOpinion: true if:
   - Confidence < 70%
   - Critical condition
   - Unusual presentation

6. validationStatus:
   - "validated": Confidence >80%, strong evidence
   - "uncertain": Confidence 60-80%, moderate evidence
   - "flagged": Confidence <60%, weak evidence`
          },
          {
            role: "user",
            content: `Assess this differential diagnosis:

Condition: ${diagnosis.condition}
ICD-10: ${diagnosis.icd10 || 'N/A'}
Probability: ${diagnosis.probability}%
Reasoning: ${diagnosis.reasoning}
Supporting Evidence: ${diagnosis.supportingEvidence.join(', ')}

Patient Context:
Age: ${input.patientInfo.age}
Gender: ${input.patientInfo.gender}
Symptoms: ${input.symptoms.join(', ')}
Medical History: ${input.patientInfo.medicalHistory?.join(', ') || 'None'}` as string
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "diagnosis_accuracy_assessment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                confidenceScore: { type: "number" },
                evidenceStrength: { type: "string", enum: ["A", "B", "C", "D"] },
                clinicalGuidelineReferences: { type: "array", items: { type: "string" } },
                redFlagSeverity: { type: "string", enum: ["none", "low", "moderate", "high", "critical"] },
                requiresSecondOpinion: { type: "boolean" },
                validationStatus: { type: "string", enum: ["validated", "uncertain", "flagged"] }
              },
              required: [
                "confidenceScore", "evidenceStrength", "clinicalGuidelineReferences",
                "redFlagSeverity", "requiresSecondOpinion", "validationStatus"
              ],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      return JSON.parse(content as string);
    } catch (error) {
      console.error("Diagnosis accuracy assessment error:", error);
      // Return conservative defaults
      return {
        confidenceScore: 50,
        evidenceStrength: "C",
        clinicalGuidelineReferences: [],
        redFlagSeverity: "moderate",
        requiresSecondOpinion: true,
        validationStatus: "uncertain"
      };
    }
  }

  /**
   * Enhance red flags with severity assessment
   */
  private async enhanceRedFlags(
    redFlags: string[],
    diagnoses: EnhancedDifferentialDiagnosis[]
  ): Promise<Array<{
    flag: string;
    severity: "low" | "moderate" | "high" | "critical";
    requiresImmediateAction: boolean;
  }>> {
    if (redFlags.length === 0) {
      return [];
    }

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a medical red flag assessment AI. Evaluate the severity of clinical red flags.

For each red flag, provide:
1. flag: The red flag text
2. severity: "low", "moderate", "high", or "critical"
3. requiresImmediateAction: true if patient needs immediate medical attention

Severity guidelines:
- Critical: Life-threatening, requires emergency care (chest pain with cardiac symptoms, severe bleeding, etc.)
- High: Serious condition, needs urgent care within hours (severe pain, high fever, etc.)
- Moderate: Concerning symptoms, needs medical attention within 24-48 hours
- Low: Mild concerns, routine follow-up appropriate`
          },
          {
            role: "user",
            content: `Assess these red flags:
${redFlags.map((flag, i) => `${i + 1}. ${flag}`).join('\n')}

Context from differential diagnoses:
${diagnoses.slice(0, 3).map(d => `- ${d.condition} (${d.redFlagSeverity} severity)`).join('\n')}` as string
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "red_flag_assessment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                assessments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      flag: { type: "string" },
                      severity: { type: "string", enum: ["low", "moderate", "high", "critical"] },
                      requiresImmediateAction: { type: "boolean" }
                    },
                    required: ["flag", "severity", "requiresImmediateAction"],
                    additionalProperties: false
                  }
                }
              },
              required: ["assessments"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content as string);
      return result.assessments;
    } catch (error) {
      console.error("Red flag enhancement error:", error);
      // Return conservative defaults
      return redFlags.map(flag => ({
        flag,
        severity: "moderate" as const,
        requiresImmediateAction: false
      }));
    }
  }

  /**
   * Calculate overall accuracy metrics
   */
  private calculateAccuracyMetrics(
    diagnoses: EnhancedDifferentialDiagnosis[],
    redFlags: Array<{ severity: string }>,
    baseOutput: BRAINOutput
  ): {
    overallConfidence: number;
    evidenceQuality: "excellent" | "good" | "fair" | "poor";
    validationsPassed: number;
    validationsFailed: number;
    uncertaintyFactors: string[];
    recommendSecondOpinion: boolean;
  } {
    const validatedCount = diagnoses.filter(d => d.validationStatus === "validated").length;
    const uncertainCount = diagnoses.filter(d => d.validationStatus === "uncertain").length;
    const flaggedCount = diagnoses.filter(d => d.validationStatus === "flagged").length;

    const avgConfidence = diagnoses.reduce((sum, d) => sum + d.confidenceScore, 0) / diagnoses.length;

    const uncertaintyFactors: string[] = [];
    if (flaggedCount > 0) uncertaintyFactors.push(`${flaggedCount} diagnoses flagged for review`);
    if (uncertainCount > 0) uncertaintyFactors.push(`${uncertainCount} diagnoses with uncertain validation`);
    if (redFlags.some(f => f.severity === "critical")) uncertaintyFactors.push("Critical red flags present");
    if (diagnoses.some(d => d.evidenceStrength === "D")) uncertaintyFactors.push("Weak evidence for some diagnoses");

    const evidenceQuality: "excellent" | "good" | "fair" | "poor" = 
      avgConfidence >= 85 ? "excellent" :
      avgConfidence >= 70 ? "good" :
      avgConfidence >= 55 ? "fair" : "poor";

    const recommendSecondOpinion = 
      avgConfidence < 70 ||
      flaggedCount > 0 ||
      redFlags.some(f => f.severity === "critical") ||
      diagnoses.some(d => d.requiresSecondOpinion);

    return {
      overallConfidence: Math.round(avgConfidence),
      evidenceQuality,
      validationsPassed: validatedCount,
      validationsFailed: flaggedCount,
      uncertaintyFactors,
      recommendSecondOpinion
    };
  }

  /**
   * Assess clinical guideline compliance
   */
  private async assessGuidelineCompliance(
    diagnoses: EnhancedDifferentialDiagnosis[],
    input: BRAINInput
  ): Promise<string> {
    const guidelineRefs = diagnoses.flatMap(d => d.clinicalGuidelineReferences);
    const uniqueGuidelines = Array.from(new Set(guidelineRefs));

    if (uniqueGuidelines.length === 0) {
      return "No specific clinical guidelines referenced";
    }

    return `Assessment based on ${uniqueGuidelines.length} clinical guideline(s): ${uniqueGuidelines.slice(0, 3).join(', ')}`;
  }

  /**
   * Assess urgency based on red flags and diagnoses
   */
  private assessUrgency(
    redFlags: Array<{ severity: string; requiresImmediateAction: boolean }>,
    diagnoses: EnhancedDifferentialDiagnosis[]
  ): boolean {
    // Urgent if any critical red flags
    if (redFlags.some(f => f.severity === "critical" || f.requiresImmediateAction)) {
      return true;
    }

    // Urgent if top diagnosis has critical red flag severity
    if (diagnoses[0]?.redFlagSeverity === "critical") {
      return true;
    }

    return false;
  }

  /**
   * Calculate weighted overall confidence score
   */
  private calculateOverallConfidence(diagnoses: EnhancedDifferentialDiagnosis[]): number {
    if (diagnoses.length === 0) return 0;

    // Weight by probability and confidence
    const weightedSum = diagnoses.reduce((sum, d, index) => {
      const weight = d.probability / 100; // Use probability as weight
      return sum + (d.confidenceScore * weight);
    }, 0);

    const totalWeight = diagnoses.reduce((sum, d) => sum + (d.probability / 100), 0);

    return Math.round(weightedSum / totalWeight);
  }
}

// Export singleton instance
export const enhancedBrain = new EnhancedBRAIN();
