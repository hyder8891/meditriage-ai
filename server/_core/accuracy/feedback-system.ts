/**
 * Feedback and Continuous Learning System
 * 
 * Layer 4 of the Accuracy Framework: Improves accuracy over time through clinician feedback
 */

export interface FeedbackRecord {
  id: string;
  functionName: string; // Which AI function (e.g., 'clinical-reasoning', 'medical-imaging')
  aiOutput: any; // What AI suggested
  clinicianCorrection: any; // What doctor changed
  feedbackType: 'EXPLICIT_CORRECTION' | 'IMPLICIT_MODIFICATION' | 'OUTCOME_TRACKING' | 'RATING';
  timestamp: Date;
  clinicianId: number;
  patientContext?: {
    age?: number;
    gender?: 'male' | 'female';
    conditions?: string[];
  };
  patientOutcome?: {
    status: 'IMPROVED' | 'UNCHANGED' | 'WORSENED';
    notes?: string;
    followUpDate?: Date;
  };
  rating?: {
    accuracy: number; // 1-5
    usefulness: number; // 1-5
    confidence: number; // 1-5
  };
  metadata: {
    sessionId?: string;
    inputQuality?: number;
    modelVersion?: string;
  };
}

export interface AccuracyMetrics {
  functionName: string;
  timeRange: { start: Date; end: Date };
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number; // 0-1
  precision: number; // 0-1
  recall: number; // 0-1
  f1Score: number; // 0-1
  confidenceCalibration: number; // 0-1 (how well confidence matches accuracy)
  errorCategories: { [category: string]: number };
  trendDirection: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  averageRating?: {
    accuracy: number;
    usefulness: number;
    confidence: number;
  };
}

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  examples: Array<{
    aiOutput: any;
    correctOutput: any;
    context: string;
  }>;
  suggestedFix: string;
}

/**
 * In-memory storage for feedback (in production, use database)
 */
const feedbackStore: Map<string, FeedbackRecord> = new Map();
const metricsCache: Map<string, AccuracyMetrics> = new Map();

/**
 * Record clinician feedback
 */
export async function recordFeedback(
  feedback: Omit<FeedbackRecord, 'id' | 'timestamp'>
): Promise<FeedbackRecord> {
  const record: FeedbackRecord = {
    ...feedback,
    id: generateFeedbackId(),
    timestamp: new Date()
  };
  
  feedbackStore.set(record.id, record);
  
  // Invalidate metrics cache for this function
  const cacheKey = `${record.functionName}-current`;
  metricsCache.delete(cacheKey);
  
  // Check if retraining threshold reached
  await checkRetrainingThreshold(record.functionName);
  
  return record;
}

/**
 * Record explicit correction (doctor marks AI as wrong and provides correct answer)
 */
export async function recordCorrection(
  functionName: string,
  aiOutput: any,
  correctOutput: any,
  clinicianId: number,
  context?: any
): Promise<FeedbackRecord> {
  return recordFeedback({
    functionName,
    aiOutput,
    clinicianCorrection: correctOutput,
    feedbackType: 'EXPLICIT_CORRECTION',
    clinicianId,
    patientContext: context,
    metadata: {}
  });
}

/**
 * Record implicit modification (doctor modifies AI suggestion)
 */
export async function recordModification(
  functionName: string,
  aiOutput: any,
  modifiedOutput: any,
  clinicianId: number
): Promise<FeedbackRecord> {
  return recordFeedback({
    functionName,
    aiOutput,
    clinicianCorrection: modifiedOutput,
    feedbackType: 'IMPLICIT_MODIFICATION',
    clinicianId,
    metadata: {}
  });
}

/**
 * Record patient outcome
 */
export async function recordOutcome(
  functionName: string,
  aiOutput: any,
  outcome: FeedbackRecord['patientOutcome'],
  clinicianId: number
): Promise<FeedbackRecord> {
  return recordFeedback({
    functionName,
    aiOutput,
    clinicianCorrection: null,
    feedbackType: 'OUTCOME_TRACKING',
    clinicianId,
    patientOutcome: outcome,
    metadata: {}
  });
}

/**
 * Record rating
 */
export async function recordRating(
  functionName: string,
  aiOutput: any,
  rating: FeedbackRecord['rating'],
  clinicianId: number
): Promise<FeedbackRecord> {
  return recordFeedback({
    functionName,
    aiOutput,
    clinicianCorrection: null,
    feedbackType: 'RATING',
    clinicianId,
    rating,
    metadata: {}
  });
}

/**
 * Analyze accuracy trends for a function
 */
export async function analyzeAccuracyTrends(
  functionName: string,
  timeRange: { start: Date; end: Date }
): Promise<AccuracyMetrics> {
  const cacheKey = `${functionName}-${timeRange.start.getTime()}-${timeRange.end.getTime()}`;
  
  // Check cache
  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey)!;
  }
  
  // Get feedback records for this function and time range
  const records = Array.from(feedbackStore.values()).filter(
    r => r.functionName === functionName &&
         r.timestamp >= timeRange.start &&
         r.timestamp <= timeRange.end
  );
  
  if (records.length === 0) {
    return {
      functionName,
      timeRange,
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      confidenceCalibration: 0,
      errorCategories: {},
      trendDirection: 'STABLE'
    };
  }
  
  // Calculate metrics
  const totalPredictions = records.length;
  const corrections = records.filter(r => r.feedbackType === 'EXPLICIT_CORRECTION');
  const correctPredictions = totalPredictions - corrections.length;
  const accuracy = correctPredictions / totalPredictions;
  
  // Calculate precision, recall, F1 (simplified - assumes binary classification)
  const precision = accuracy; // Simplified
  const recall = accuracy; // Simplified
  const f1Score = 2 * (precision * recall) / (precision + recall || 1);
  
  // Calculate confidence calibration (placeholder - needs actual confidence scores)
  const confidenceCalibration = 0.85; // Placeholder
  
  // Categorize errors
  const errorCategories: { [category: string]: number } = {};
  corrections.forEach(c => {
    const category = categorizeError(c);
    errorCategories[category] = (errorCategories[category] || 0) + 1;
  });
  
  // Calculate trend direction
  const trendDirection = calculateTrendDirection(functionName, accuracy);
  
  // Calculate average ratings
  const ratings = records.filter(r => r.rating).map(r => r.rating!);
  const averageRating = ratings.length > 0 ? {
    accuracy: ratings.reduce((sum, r) => sum + r.accuracy, 0) / ratings.length,
    usefulness: ratings.reduce((sum, r) => sum + r.usefulness, 0) / ratings.length,
    confidence: ratings.reduce((sum, r) => sum + r.confidence, 0) / ratings.length
  } : undefined;
  
  const metrics: AccuracyMetrics = {
    functionName,
    timeRange,
    totalPredictions,
    correctPredictions,
    accuracy,
    precision,
    recall,
    f1Score,
    confidenceCalibration,
    errorCategories,
    trendDirection,
    averageRating
  };
  
  // Cache metrics
  metricsCache.set(cacheKey, metrics);
  
  return metrics;
}

/**
 * Identify common error patterns
 */
export async function identifyErrorPatterns(
  functionName: string,
  minFrequency: number = 3
): Promise<ErrorPattern[]> {
  const corrections = Array.from(feedbackStore.values()).filter(
    r => r.functionName === functionName &&
         r.feedbackType === 'EXPLICIT_CORRECTION'
  );
  
  // Group similar errors
  const patterns: Map<string, ErrorPattern> = new Map();
  
  corrections.forEach(correction => {
    const pattern = extractErrorPattern(correction);
    
    if (patterns.has(pattern)) {
      const existing = patterns.get(pattern)!;
      existing.frequency++;
      existing.examples.push({
        aiOutput: correction.aiOutput,
        correctOutput: correction.clinicianCorrection,
        context: JSON.stringify(correction.patientContext || {})
      });
    } else {
      patterns.set(pattern, {
        pattern,
        frequency: 1,
        severity: assessErrorSeverity(correction),
        examples: [{
          aiOutput: correction.aiOutput,
          correctOutput: correction.clinicianCorrection,
          context: JSON.stringify(correction.patientContext || {})
        }],
        suggestedFix: generateSuggestedFix(pattern)
      });
    }
  });
  
  // Filter by minimum frequency and sort by severity
  return Array.from(patterns.values())
    .filter(p => p.frequency >= minFrequency)
    .sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
}

/**
 * Check if retraining threshold reached
 */
async function checkRetrainingThreshold(functionName: string): Promise<void> {
  const RETRAINING_THRESHOLD = 100; // Retrain after 100 feedback records
  
  const recentFeedback = Array.from(feedbackStore.values()).filter(
    r => r.functionName === functionName &&
         r.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  );
  
  if (recentFeedback.length >= RETRAINING_THRESHOLD) {
    console.log(`[Feedback System] Retraining threshold reached for ${functionName}`);
    // In production, trigger retraining pipeline
    await triggerRetraining(functionName);
  }
}

/**
 * Trigger retraining pipeline (placeholder)
 */
async function triggerRetraining(functionName: string): Promise<void> {
  console.log(`[Feedback System] Triggering retraining for ${functionName}`);
  // In production, this would:
  // 1. Collect all feedback data
  // 2. Prepare training dataset
  // 3. Fine-tune model
  // 4. Validate new model
  // 5. Deploy if improved
}

/**
 * Calculate trend direction
 */
function calculateTrendDirection(
  functionName: string,
  currentAccuracy: number
): 'IMPROVING' | 'STABLE' | 'DEGRADING' {
  // Compare with previous period (placeholder implementation)
  const previousAccuracy = 0.85; // Placeholder
  
  if (currentAccuracy > previousAccuracy + 0.05) return 'IMPROVING';
  if (currentAccuracy < previousAccuracy - 0.05) return 'DEGRADING';
  return 'STABLE';
}

/**
 * Categorize error type
 */
function categorizeError(correction: FeedbackRecord): string {
  // Simplified categorization - in production, use more sophisticated analysis
  const aiOutput = JSON.stringify(correction.aiOutput).toLowerCase();
  const correctOutput = JSON.stringify(correction.clinicianCorrection).toLowerCase();
  
  if (aiOutput.includes('diagnosis') || correctOutput.includes('diagnosis')) {
    return 'Incorrect Diagnosis';
  }
  if (aiOutput.includes('medication') || correctOutput.includes('medication')) {
    return 'Medication Error';
  }
  if (aiOutput.includes('dosage') || correctOutput.includes('dosage')) {
    return 'Dosage Error';
  }
  if (aiOutput.includes('interaction') || correctOutput.includes('interaction')) {
    return 'Missed Interaction';
  }
  if (aiOutput.includes('finding') || correctOutput.includes('finding')) {
    return 'Imaging Interpretation Error';
  }
  
  return 'Other Error';
}

/**
 * Extract error pattern
 */
function extractErrorPattern(correction: FeedbackRecord): string {
  const category = categorizeError(correction);
  const context = correction.patientContext;
  
  if (context?.age && context.age < 18) {
    return `${category} (Pediatric)`;
  }
  if (context?.age && context.age > 65) {
    return `${category} (Geriatric)`;
  }
  if (context?.gender) {
    return `${category} (${context.gender})`;
  }
  
  return category;
}

/**
 * Assess error severity
 */
function assessErrorSeverity(correction: FeedbackRecord): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const category = categorizeError(correction);
  
  // Critical errors
  if (category.includes('Diagnosis') && correction.patientOutcome?.status === 'WORSENED') {
    return 'CRITICAL';
  }
  if (category.includes('Medication') || category.includes('Dosage')) {
    return 'CRITICAL';
  }
  
  // High severity errors
  if (category.includes('Interaction')) {
    return 'HIGH';
  }
  if (category.includes('Imaging')) {
    return 'HIGH';
  }
  
  // Medium severity
  if (correction.patientOutcome?.status === 'UNCHANGED') {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Generate suggested fix for error pattern
 */
function generateSuggestedFix(pattern: string): string {
  if (pattern.includes('Pediatric')) {
    return 'Add age-specific validation rules and reference ranges for pediatric patients';
  }
  if (pattern.includes('Geriatric')) {
    return 'Implement geriatric-specific considerations (polypharmacy, altered pharmacokinetics)';
  }
  if (pattern.includes('Medication')) {
    return 'Enhance drug database validation and add more interaction checks';
  }
  if (pattern.includes('Diagnosis')) {
    return 'Improve differential diagnosis ranking algorithm and add more clinical context';
  }
  if (pattern.includes('Imaging')) {
    return 'Add multi-model ensemble and anatomical validation';
  }
  
  return 'Review and enhance validation rules for this category';
}

/**
 * Generate feedback ID
 */
function generateFeedbackId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStatistics(
  functionName?: string
): Promise<{
  totalFeedback: number;
  byType: { [feedbackType: string]: number };
  byFunction: { [functionName: string]: number };
  recentTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
}> {
  const allFeedback = Array.from(feedbackStore.values());
  const filtered = functionName
    ? allFeedback.filter(f => f.functionName === functionName)
    : allFeedback;
  
  const byType: { [feedbackType: string]: number } = {};
  const byFunction: { [functionName: string]: number } = {};
  
  filtered.forEach(f => {
    byType[f.feedbackType] = (byType[f.feedbackType] || 0) + 1;
    byFunction[f.functionName] = (byFunction[f.functionName] || 0) + 1;
  });
  
  // Calculate recent trend (last 7 days vs previous 7 days)
  const now = Date.now();
  const last7Days = filtered.filter(f => f.timestamp.getTime() > now - 7 * 24 * 60 * 60 * 1000).length;
  const previous7Days = filtered.filter(f => {
    return f.timestamp.getTime() > now - 14 * 24 * 60 * 60 * 1000 &&
      f.timestamp.getTime() <= now - 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  let recentTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
  if (last7Days > previous7Days * 1.2) recentTrend = 'INCREASING';
  if (last7Days < previous7Days * 0.8) recentTrend = 'DECREASING';
  
  return {
    totalFeedback: filtered.length,
    byType,
    byFunction,
    recentTrend
  };
}
