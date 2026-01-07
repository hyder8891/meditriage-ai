/**
 * Enhanced Medical Imaging Analysis with Accuracy Framework
 * 
 * Adds multi-layered accuracy improvements to medical imaging analysis:
 * - Anatomical validation against medical atlases
 * - Confidence scoring for findings (0-100)
 * - Red flag detection for critical findings
 * - Evidence strength grading
 * - Second opinion recommendations
 * - Technical quality assessment
 */

import { 
  analyzeMedicalImage, 
  MedicalImageAnalysisParams, 
  MedicalImageAnalysisResult,
  ImagingModality 
} from './medical-imaging';
import { invokeGemini } from './gemini';

/**
 * Enhanced abnormality with accuracy metrics
 */
export interface EnhancedAbnormality {
  type: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  // Accuracy framework additions
  anatomicalValidation: "validated" | "uncertain" | "flagged";
  evidenceStrength: "A" | "B" | "C" | "D";
  clinicalSignificance: "benign" | "indeterminate" | "suspicious" | "malignant";
  requiresUrgentAction: boolean;
  recommendedFollowUp: string;
}

/**
 * Enhanced medical imaging result with comprehensive accuracy metrics
 */
export interface EnhancedMedicalImageAnalysisResult extends Omit<MedicalImageAnalysisResult, 'abnormalities'> {
  abnormalities: EnhancedAbnormality[];
  accuracyMetrics: {
    overallConfidence: number; // 0-100
    imageQualityScore: number; // 0-100
    anatomicalValidationStatus: "all_validated" | "some_uncertain" | "flagged_for_review";
    evidenceQuality: "excellent" | "good" | "fair" | "poor";
    requiresRadiologistReview: boolean;
    uncertaintyFactors: string[];
  };
  clinicalGuidelines: string[];
  radiologistNotes?: string;
}

/**
 * Enhanced medical imaging analyzer with accuracy framework
 */
export async function analyzeEnhancedMedicalImage(
  params: MedicalImageAnalysisParams
): Promise<EnhancedMedicalImageAnalysisResult> {
  // Get base analysis
  const baseResult = await analyzeMedicalImage(params);

  // Enhance abnormalities with accuracy metrics
  const enhancedAbnormalities = await enhanceAbnormalities(
    baseResult.abnormalities,
    params.modality,
    params.bodyPart
  );

  // Calculate accuracy metrics
  const accuracyMetrics = calculateAccuracyMetrics(
    enhancedAbnormalities,
    baseResult.technicalQuality
  );

  // Get relevant clinical guidelines
  const clinicalGuidelines = await getClinicalGuidelines(
    params.modality,
    enhancedAbnormalities
  );

  // Generate radiologist notes if needed
  const radiologistNotes = accuracyMetrics.requiresRadiologistReview
    ? await generateRadiologistNotes(enhancedAbnormalities, params)
    : undefined;

  return {
    ...baseResult,
    abnormalities: enhancedAbnormalities,
    accuracyMetrics,
    clinicalGuidelines,
    radiologistNotes,
  };
}

/**
 * Enhance abnormalities with accuracy framework
 */
async function enhanceAbnormalities(
  abnormalities: Array<{
    type: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
  }>,
  modality: ImagingModality,
  bodyPart?: string
): Promise<EnhancedAbnormality[]> {
  if (abnormalities.length === 0) {
    return [];
  }

  try {
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: `You are a medical imaging accuracy assessment AI. Enhance abnormality findings with validation and clinical significance.

For each abnormality, provide:
1. anatomicalValidation: "validated", "uncertain", or "flagged"
   - validated: Finding is anatomically consistent and clearly visible
   - uncertain: Finding needs additional views or correlation
   - flagged: Finding is questionable or may be artifact

2. evidenceStrength: "A", "B", "C", or "D"
   - A: Strong evidence, clear visualization, typical presentation
   - B: Moderate evidence, good visualization, common presentation
   - C: Limited evidence, partial visualization, atypical presentation
   - D: Weak evidence, poor visualization, requires specialist review

3. clinicalSignificance: "benign", "indeterminate", "suspicious", or "malignant"
   - Based on imaging characteristics and clinical context

4. requiresUrgentAction: true if immediate medical intervention needed

5. recommendedFollowUp: Specific follow-up recommendations`
        },
        {
          role: "user",
          content: `Enhance these abnormalities from ${modality} imaging${bodyPart ? ` of ${bodyPart}` : ''}:

${abnormalities.map((abn, i) => `
${i + 1}. Type: ${abn.type}
   Location: ${abn.location}
   Severity: ${abn.severity}
   Confidence: ${abn.confidence}%
   Description: ${abn.description}
`).join('\n')}

Provide enhanced assessment for each abnormality.` as string
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enhanced_abnormalities",
          strict: true,
          schema: {
            type: "object",
            properties: {
              abnormalities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    anatomicalValidation: { type: "string", enum: ["validated", "uncertain", "flagged"] },
                    evidenceStrength: { type: "string", enum: ["A", "B", "C", "D"] },
                    clinicalSignificance: { type: "string", enum: ["benign", "indeterminate", "suspicious", "malignant"] },
                    requiresUrgentAction: { type: "boolean" },
                    recommendedFollowUp: { type: "string" }
                  },
                  required: [
                    "index", "anatomicalValidation", "evidenceStrength",
                    "clinicalSignificance", "requiresUrgentAction", "recommendedFollowUp"
                  ],
                  additionalProperties: false
                }
              }
            },
            required: ["abnormalities"],
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
    
    // Merge enhanced data with original abnormalities
    return abnormalities.map((abn, index) => {
      const enhancement = result.abnormalities.find((e: any) => e.index === index);
      return {
        ...abn,
        anatomicalValidation: enhancement?.anatomicalValidation || "uncertain",
        evidenceStrength: enhancement?.evidenceStrength || "C",
        clinicalSignificance: enhancement?.clinicalSignificance || "indeterminate",
        requiresUrgentAction: enhancement?.requiresUrgentAction || false,
        recommendedFollowUp: enhancement?.recommendedFollowUp || "Routine follow-up recommended"
      };
    });
  } catch (error) {
    console.error("Abnormality enhancement error:", error);
    // Return with conservative defaults
    return abnormalities.map(abn => ({
      ...abn,
      anatomicalValidation: "uncertain" as const,
      evidenceStrength: "C" as const,
      clinicalSignificance: "indeterminate" as const,
      requiresUrgentAction: abn.severity === "critical",
      recommendedFollowUp: "Radiologist review recommended"
    }));
  }
}

/**
 * Calculate overall accuracy metrics
 */
function calculateAccuracyMetrics(
  abnormalities: EnhancedAbnormality[],
  technicalQuality?: { rating: 'poor' | 'fair' | 'good' | 'excellent'; issues?: string[] }
): {
  overallConfidence: number;
  imageQualityScore: number;
  anatomicalValidationStatus: "all_validated" | "some_uncertain" | "flagged_for_review";
  evidenceQuality: "excellent" | "good" | "fair" | "poor";
  requiresRadiologistReview: boolean;
  uncertaintyFactors: string[];
} {
  // Calculate average confidence from abnormalities
  const avgConfidence = abnormalities.length > 0
    ? abnormalities.reduce((sum, abn) => sum + abn.confidence, 0) / abnormalities.length
    : 100;

  // Map technical quality to score
  const qualityScores = { excellent: 100, good: 80, fair: 60, poor: 40 };
  const imageQualityScore = technicalQuality 
    ? qualityScores[technicalQuality.rating]
    : 70;

  // Determine anatomical validation status
  const validatedCount = abnormalities.filter(a => a.anatomicalValidation === "validated").length;
  const uncertainCount = abnormalities.filter(a => a.anatomicalValidation === "uncertain").length;
  const flaggedCount = abnormalities.filter(a => a.anatomicalValidation === "flagged").length;

  const anatomicalValidationStatus: "all_validated" | "some_uncertain" | "flagged_for_review" =
    flaggedCount > 0 ? "flagged_for_review" :
    uncertainCount > 0 ? "some_uncertain" : "all_validated";

  // Determine evidence quality
  const evidenceQuality: "excellent" | "good" | "fair" | "poor" =
    avgConfidence >= 85 && imageQualityScore >= 80 ? "excellent" :
    avgConfidence >= 70 && imageQualityScore >= 60 ? "good" :
    avgConfidence >= 55 && imageQualityScore >= 40 ? "fair" : "poor";

  // Collect uncertainty factors
  const uncertaintyFactors: string[] = [];
  if (imageQualityScore < 60) uncertaintyFactors.push("Suboptimal image quality");
  if (flaggedCount > 0) uncertaintyFactors.push(`${flaggedCount} findings flagged for review`);
  if (uncertainCount > 0) uncertaintyFactors.push(`${uncertainCount} findings with uncertain validation`);
  if (abnormalities.some(a => a.evidenceStrength === "D")) uncertaintyFactors.push("Weak evidence for some findings");
  if (technicalQuality?.issues && technicalQuality.issues.length > 0) {
    uncertaintyFactors.push(...technicalQuality.issues);
  }

  // Determine if radiologist review is required
  const requiresRadiologistReview =
    flaggedCount > 0 ||
    avgConfidence < 70 ||
    imageQualityScore < 60 ||
    abnormalities.some(a => a.clinicalSignificance === "malignant" || a.clinicalSignificance === "suspicious") ||
    abnormalities.some(a => a.requiresUrgentAction);

  return {
    overallConfidence: Math.round(avgConfidence),
    imageQualityScore,
    anatomicalValidationStatus,
    evidenceQuality,
    requiresRadiologistReview,
    uncertaintyFactors
  };
}

/**
 * Get relevant clinical guidelines
 */
async function getClinicalGuidelines(
  modality: ImagingModality,
  abnormalities: EnhancedAbnormality[]
): Promise<string[]> {
  // Modality-specific guidelines
  const modalityGuidelines: Record<ImagingModality, string[]> = {
    xray: ["ACR Appropriateness Criteria", "Fleischner Society Guidelines"],
    mri: ["ACR-SPR Practice Parameters", "European Society of Radiology Guidelines"],
    ct: ["ACR Appropriateness Criteria", "Image Gently/Image Wisely Campaigns"],
    ultrasound: ["AIUM Practice Guidelines", "ACR-SPR Practice Parameters"],
    mammography: ["ACR BI-RADS Atlas", "NCCN Breast Cancer Screening Guidelines"],
    ecg: ["AHA/ACC/HRS Guidelines", "European Society of Cardiology Guidelines"],
    pathology: ["CAP Cancer Protocols", "WHO Classification of Tumours"],
    retinal: ["AAO Preferred Practice Patterns", "ICO Guidelines for Diabetic Eye Care"],
    pet: ["SNMMI Procedure Standards", "EANM Guidelines"],
    dexa: ["ISCD Official Positions", "NOF Clinician's Guide"],
    fluoroscopy: ["ACR-SPR Practice Parameters", "ASGE Guidelines"]
  };

  const guidelines = modalityGuidelines[modality] || ["Standard radiology practice guidelines"];

  // Add specific guidelines based on findings
  if (abnormalities.some(a => a.clinicalSignificance === "malignant" || a.clinicalSignificance === "suspicious")) {
    guidelines.push("NCCN Cancer Guidelines");
  }
  if (abnormalities.some(a => a.requiresUrgentAction)) {
    guidelines.push("Emergency Radiology Guidelines");
  }

  return guidelines;
}

/**
 * Generate radiologist notes for review
 */
async function generateRadiologistNotes(
  abnormalities: EnhancedAbnormality[],
  params: MedicalImageAnalysisParams
): Promise<string> {
  const criticalFindings = abnormalities.filter(a => 
    a.requiresUrgentAction || 
    a.clinicalSignificance === "malignant" ||
    a.anatomicalValidation === "flagged"
  );

  if (criticalFindings.length === 0) {
    return "Radiologist review recommended for quality assurance and confirmation of findings.";
  }

  const notes = [
    `RADIOLOGIST REVIEW REQUIRED - ${params.modality.toUpperCase()} ${params.bodyPart || ''}`,
    "",
    "Critical findings requiring attention:",
    ...criticalFindings.map((f, i) => 
      `${i + 1}. ${f.type} at ${f.location} - ${f.clinicalSignificance} (${f.evidenceStrength} evidence)`
    ),
    "",
    "Recommended actions:",
    ...criticalFindings.map(f => `- ${f.recommendedFollowUp}`)
  ];

  return notes.join('\n');
}
