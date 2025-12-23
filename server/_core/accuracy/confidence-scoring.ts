/**
 * Confidence Scoring Module
 * 
 * Layer 3 of the Accuracy Framework: Provides transparent confidence metrics for all AI outputs
 */

import type { InputValidationResult } from './input-validator';
import type { CrossReferenceResult } from './cross-reference';

export interface ConfidenceScore {
  overall: number; // 0-100
  factors: {
    inputQuality: number; // 0-100
    modelCertainty: number; // 0-100
    crossReferenceAgreement: number; // 0-100
    historicalAccuracy: number; // 0-100
    evidenceStrength: number; // 0-100
  };
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';
  uncertainties: string[]; // What we're uncertain about
  recommendations: string[]; // What to do about low confidence
  metadata: {
    calculatedAt: Date;
    functionName: string;
    calculationMethod: string;
  };
}

export interface ConfidenceFactorWeights {
  inputQuality: number;
  modelCertainty: number;
  crossReferenceAgreement: number;
  historicalAccuracy: number;
  evidenceStrength: number;
}

// Default weights for confidence calculation
const DEFAULT_WEIGHTS: ConfidenceFactorWeights = {
  inputQuality: 0.15,
  modelCertainty: 0.25,
  crossReferenceAgreement: 0.30,
  historicalAccuracy: 0.15,
  evidenceStrength: 0.15
};

// Function-specific weight overrides
const FUNCTION_WEIGHTS: Record<string, Partial<ConfidenceFactorWeights>> = {
  'medical-imaging': {
    inputQuality: 0.25, // Image quality is critical
    crossReferenceAgreement: 0.25
  },
  'lab-results': {
    crossReferenceAgreement: 0.35, // Reference ranges are critical
    inputQuality: 0.20 // OCR quality matters
  },
  'drug-interactions': {
    crossReferenceAgreement: 0.40, // Database validation is critical
    evidenceStrength: 0.20
  },
  'clinical-reasoning': {
    modelCertainty: 0.30, // Model reasoning is important
    evidenceStrength: 0.25
  }
};

/**
 * Calculate comprehensive confidence score
 */
export async function calculateConfidence(
  aiOutput: any,
  options: {
    functionName: string;
    inputValidation?: InputValidationResult;
    crossReference?: CrossReferenceResult;
    modelCertainty?: number; // 0-1
    historicalAccuracy?: number; // 0-1
    evidenceStrength?: number; // 0-1
    customWeights?: Partial<ConfidenceFactorWeights>;
  }
): Promise<ConfidenceScore> {
  const uncertainties: string[] = [];
  const recommendations: string[] = [];
  
  // Get weights for this function
  const weights = {
    ...DEFAULT_WEIGHTS,
    ...(FUNCTION_WEIGHTS[options.functionName] || {}),
    ...(options.customWeights || {})
  };
  
  // Calculate individual factors (0-100 scale)
  const factors = {
    inputQuality: calculateInputQualityScore(options.inputValidation, uncertainties),
    modelCertainty: calculateModelCertaintyScore(options.modelCertainty, uncertainties),
    crossReferenceAgreement: calculateCrossReferenceScore(options.crossReference, uncertainties),
    historicalAccuracy: calculateHistoricalAccuracyScore(options.historicalAccuracy, uncertainties),
    evidenceStrength: calculateEvidenceStrengthScore(options.evidenceStrength, uncertainties)
  };
  
  // Calculate weighted overall score
  const overall = Math.round(
    factors.inputQuality * weights.inputQuality +
    factors.modelCertainty * weights.modelCertainty +
    factors.crossReferenceAgreement * weights.crossReferenceAgreement +
    factors.historicalAccuracy * weights.historicalAccuracy +
    factors.evidenceStrength * weights.evidenceStrength
  );
  
  // Determine confidence level
  const level = determineConfidenceLevel(overall);
  
  // Generate recommendations based on confidence level and uncertainties
  generateRecommendations(level, uncertainties, factors, recommendations);
  
  return {
    overall,
    factors,
    level,
    uncertainties,
    recommendations,
    metadata: {
      calculatedAt: new Date(),
      functionName: options.functionName,
      calculationMethod: 'weighted-multi-factor'
    }
  };
}

/**
 * Calculate input quality score
 */
function calculateInputQualityScore(
  validation: InputValidationResult | undefined,
  uncertainties: string[]
): number {
  if (!validation) {
    uncertainties.push('Input quality not assessed');
    return 50; // Neutral score if not validated
  }
  
  if (!validation.isValid) {
    uncertainties.push(`Input validation failed: ${validation.issues.join(', ')}`);
  }
  
  if (validation.quality < 60) {
    uncertainties.push('Low input quality may affect accuracy');
  }
  
  return validation.quality;
}

/**
 * Calculate model certainty score
 */
function calculateModelCertaintyScore(
  certainty: number | undefined,
  uncertainties: string[]
): number {
  if (certainty === undefined) {
    uncertainties.push('Model certainty not available');
    return 70; // Assume moderate certainty if not provided
  }
  
  const score = Math.round(certainty * 100);
  
  if (score < 60) {
    uncertainties.push('Model has low certainty about this prediction');
  }
  
  return score;
}

/**
 * Calculate cross-reference agreement score
 */
function calculateCrossReferenceScore(
  crossRef: CrossReferenceResult | undefined,
  uncertainties: string[]
): number {
  if (!crossRef) {
    uncertainties.push('No cross-reference validation performed');
    return 50; // Neutral score if not validated
  }
  
  const score = Math.round(crossRef.confidence * 100);
  
  if (!crossRef.isValidated) {
    uncertainties.push('Could not validate against medical databases');
  }
  
  if (crossRef.conflicts.length > 0) {
    uncertainties.push(`Conflicts found: ${crossRef.conflicts.join(', ')}`);
  }
  
  if (crossRef.sources.length === 0) {
    uncertainties.push('No authoritative sources confirmed this finding');
  }
  
  return score;
}

/**
 * Calculate historical accuracy score
 */
function calculateHistoricalAccuracyScore(
  accuracy: number | undefined,
  uncertainties: string[]
): number {
  if (accuracy === undefined) {
    // No historical data available - use neutral score
    return 75;
  }
  
  const score = Math.round(accuracy * 100);
  
  if (score < 70) {
    uncertainties.push('This function has had accuracy issues in the past');
  }
  
  return score;
}

/**
 * Calculate evidence strength score
 */
function calculateEvidenceStrengthScore(
  strength: number | undefined,
  uncertainties: string[]
): number {
  if (strength === undefined) {
    uncertainties.push('Evidence strength not assessed');
    return 70; // Assume moderate evidence if not provided
  }
  
  const score = Math.round(strength * 100);
  
  if (score < 60) {
    uncertainties.push('Weak supporting evidence for this conclusion');
  }
  
  return score;
}

/**
 * Determine confidence level from overall score
 */
function determineConfidenceLevel(overall: number): 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW' {
  if (overall >= 80) return 'HIGH';
  if (overall >= 60) return 'MODERATE';
  if (overall >= 40) return 'LOW';
  return 'VERY_LOW';
}

/**
 * Generate recommendations based on confidence analysis
 */
function generateRecommendations(
  level: string,
  uncertainties: string[],
  factors: ConfidenceScore['factors'],
  recommendations: string[]
): void {
  // Level-based recommendations
  if (level === 'VERY_LOW') {
    recommendations.push('⚠️ CRITICAL: Do not rely on this result - seek expert consultation immediately');
    recommendations.push('Consider ordering additional diagnostic tests');
  } else if (level === 'LOW') {
    recommendations.push('⚠️ WARNING: Low confidence - second opinion strongly recommended');
    recommendations.push('Review input data quality and consider retesting');
  } else if (level === 'MODERATE') {
    recommendations.push('Use clinical judgment - consider additional validation');
    recommendations.push('Monitor patient closely and reassess if needed');
  } else {
    recommendations.push('✓ High confidence - result appears reliable');
    recommendations.push('Still use clinical judgment and consider patient context');
  }
  
  // Factor-specific recommendations
  if (factors.inputQuality < 60) {
    recommendations.push('Improve input quality: better image resolution, clearer text, or stronger signal');
  }
  
  if (factors.crossReferenceAgreement < 60) {
    recommendations.push('Cross-reference with additional medical resources or databases');
  }
  
  if (factors.evidenceStrength < 60) {
    recommendations.push('Review medical literature for supporting evidence');
  }
  
  if (factors.modelCertainty < 60) {
    recommendations.push('AI model is uncertain - consider alternative diagnostic approaches');
  }
}

/**
 * Calculate calibration score (how well confidence matches actual accuracy)
 */
export function calculateCalibration(
  predictions: Array<{
    confidence: number; // 0-1
    wasCorrect: boolean;
  }>
): {
  calibrationScore: number; // 0-1 (1 = perfect calibration)
  calibrationCurve: Array<{
    confidenceBin: string;
    predictedAccuracy: number;
    actualAccuracy: number;
    count: number;
  }>;
} {
  // Group predictions into confidence bins
  const bins = {
    'Very Low (0-40%)': { predicted: 0.2, correct: 0, total: 0 },
    'Low (40-60%)': { predicted: 0.5, correct: 0, total: 0 },
    'Moderate (60-80%)': { predicted: 0.7, correct: 0, total: 0 },
    'High (80-100%)': { predicted: 0.9, correct: 0, total: 0 }
  };
  
  predictions.forEach(p => {
    const conf = p.confidence * 100;
    let bin: keyof typeof bins;
    
    if (conf < 40) bin = 'Very Low (0-40%)';
    else if (conf < 60) bin = 'Low (40-60%)';
    else if (conf < 80) bin = 'Moderate (60-80%)';
    else bin = 'High (80-100%)';
    
    bins[bin].total++;
    if (p.wasCorrect) bins[bin].correct++;
  });
  
  // Calculate calibration curve
  const calibrationCurve = Object.entries(bins).map(([binName, data]) => ({
    confidenceBin: binName,
    predictedAccuracy: data.predicted,
    actualAccuracy: data.total > 0 ? data.correct / data.total : 0,
    count: data.total
  }));
  
  // Calculate overall calibration score (lower error = better calibration)
  const totalError = calibrationCurve.reduce((sum, point) => {
    if (point.count === 0) return sum;
    return sum + Math.abs(point.predictedAccuracy - point.actualAccuracy) * point.count;
  }, 0);
  
  const totalPredictions = predictions.length;
  const calibrationScore = totalPredictions > 0 ? 1 - (totalError / totalPredictions) : 0;
  
  return {
    calibrationScore: Math.max(0, Math.min(1, calibrationScore)),
    calibrationCurve
  };
}

/**
 * Detect "red flags" that indicate potentially dangerous low-confidence outputs
 */
export function detectRedFlags(
  confidenceScore: ConfidenceScore,
  aiOutput: any,
  context: {
    functionName: string;
    isCritical?: boolean; // Is this a life-threatening situation?
  }
): {
  hasRedFlags: boolean;
  flags: Array<{
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    message: string;
    action: string;
  }>;
} {
  const flags: Array<{
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    message: string;
    action: string;
  }> = [];
  
  // Critical: Very low overall confidence
  if (confidenceScore.overall < 40) {
    flags.push({
      severity: 'CRITICAL',
      message: 'Very low confidence score - result may be unreliable',
      action: 'Do not use this result - seek expert consultation immediately'
    });
  }
  
  // Critical: Critical situation + moderate confidence
  if (context.isCritical && confidenceScore.overall < 70) {
    flags.push({
      severity: 'CRITICAL',
      message: 'Potentially life-threatening situation with insufficient confidence',
      action: 'Immediate expert consultation required'
    });
  }
  
  // High: Low input quality
  if (confidenceScore.factors.inputQuality < 50) {
    flags.push({
      severity: 'HIGH',
      message: 'Poor input quality may lead to incorrect results',
      action: 'Obtain higher quality input and retest'
    });
  }
  
  // High: Cross-reference conflicts
  const hasConflicts = confidenceScore.uncertainties.some(u => u.includes('Conflicts found'));
  if (hasConflicts) {
    flags.push({
      severity: 'HIGH',
      message: 'Conflicting information found in medical databases',
      action: 'Review conflicts and consult additional sources'
    });
  }
  
  // Medium: Model uncertainty
  if (confidenceScore.factors.modelCertainty < 60) {
    flags.push({
      severity: 'MEDIUM',
      message: 'AI model is uncertain about this prediction',
      action: 'Consider alternative diagnostic approaches'
    });
  }
  
  // Medium: Weak evidence
  if (confidenceScore.factors.evidenceStrength < 60) {
    flags.push({
      severity: 'MEDIUM',
      message: 'Limited supporting evidence for this conclusion',
      action: 'Review medical literature and seek expert opinion'
    });
  }
  
  return {
    hasRedFlags: flags.length > 0,
    flags
  };
}

/**
 * Recommend whether second opinion is needed
 */
export function shouldRequestSecondOpinion(
  confidenceScore: ConfidenceScore,
  context: {
    isCritical?: boolean;
    patientRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
    treatmentImpact?: 'MINOR' | 'MODERATE' | 'MAJOR';
  }
): {
  recommended: boolean;
  urgency: 'IMMEDIATE' | 'SOON' | 'ROUTINE' | 'OPTIONAL';
  reason: string;
} {
  // Always recommend second opinion for very low confidence
  if (confidenceScore.level === 'VERY_LOW') {
    return {
      recommended: true,
      urgency: 'IMMEDIATE',
      reason: 'Very low confidence score - expert review required'
    };
  }
  
  // Immediate second opinion for critical situations with low confidence
  if (context.isCritical && confidenceScore.level === 'LOW') {
    return {
      recommended: true,
      urgency: 'IMMEDIATE',
      reason: 'Potentially life-threatening with low confidence'
    };
  }
  
  // Soon for high-risk patients with moderate confidence
  if (context.patientRisk === 'HIGH' && confidenceScore.level === 'MODERATE') {
    return {
      recommended: true,
      urgency: 'SOON',
      reason: 'High-risk patient requires expert validation'
    };
  }
  
  // Routine for major treatment impact with moderate confidence
  if (context.treatmentImpact === 'MAJOR' && confidenceScore.level === 'MODERATE') {
    return {
      recommended: true,
      urgency: 'ROUTINE',
      reason: 'Major treatment decision requires expert confirmation'
    };
  }
  
  // Optional for low confidence in non-critical situations
  if (confidenceScore.level === 'LOW') {
    return {
      recommended: true,
      urgency: 'ROUTINE',
      reason: 'Low confidence - expert review recommended'
    };
  }
  
  // No second opinion needed for high confidence
  return {
    recommended: false,
    urgency: 'OPTIONAL',
    reason: 'High confidence - second opinion optional'
  };
}
