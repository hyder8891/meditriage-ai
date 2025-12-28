/**
 * Advanced Training Metrics
 * Comprehensive evaluation beyond simple accuracy
 */

export interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export interface ConditionMetrics {
  condition: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  support: number; // Number of samples
  confusionMatrix: ConfusionMatrix;
}

export interface AdvancedMetrics {
  // Overall metrics
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // Confidence calibration
  calibrationError: number; // Expected Calibration Error (ECE)
  confidenceAccuracyGap: number;
  
  // ROC metrics
  auroc: number; // Area Under ROC Curve
  
  // Per-condition breakdown
  perConditionMetrics: Map<string, ConditionMetrics>;
  
  // Confusion matrix
  overallConfusionMatrix: ConfusionMatrix;
  
  // Additional insights
  mostConfusedPairs: Array<{
    predicted: string;
    actual: string;
    count: number;
  }>;
  
  // Performance by confidence level
  highConfidenceAccuracy: number; // Accuracy when confidence > 0.8
  lowConfidenceAccuracy: number; // Accuracy when confidence < 0.5
}

export interface PredictionResult {
  predicted: string;
  actual: string;
  confidence: number;
  correct: boolean;
  condition?: string;
}

/**
 * Calculate advanced metrics from prediction results
 */
export function calculateAdvancedMetrics(
  predictions: PredictionResult[]
): AdvancedMetrics {
  if (predictions.length === 0) {
    throw new Error('No predictions to evaluate');
  }

  // Calculate overall accuracy
  const correct = predictions.filter((p) => p.correct).length;
  const accuracy = correct / predictions.length;

  // Calculate precision, recall, F1 (macro-averaged)
  const conditions = new Set(predictions.map((p) => p.actual));
  const perConditionMetrics = new Map<string, ConditionMetrics>();

  for (const condition of Array.from(conditions)) {
    const metrics = calculateConditionMetrics(predictions, condition);
    perConditionMetrics.set(condition, metrics);
  }

  // Macro-average precision, recall, F1
  const avgPrecision =
    Array.from(perConditionMetrics.values()).reduce((sum, m) => sum + m.precision, 0) /
    perConditionMetrics.size;

  const avgRecall =
    Array.from(perConditionMetrics.values()).reduce((sum, m) => sum + m.recall, 0) /
    perConditionMetrics.size;

  const avgF1 =
    Array.from(perConditionMetrics.values()).reduce((sum, m) => sum + m.f1Score, 0) /
    perConditionMetrics.size;

  // Calculate calibration error
  const calibrationError = calculateCalibrationError(predictions);

  // Calculate confidence-accuracy gap
  const avgConfidence =
    predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  const confidenceAccuracyGap = Math.abs(avgConfidence - accuracy);

  // Calculate AUROC (simplified binary classification)
  const auroc = calculateAUROC(predictions);

  // Calculate overall confusion matrix
  const overallConfusionMatrix = calculateOverallConfusionMatrix(predictions);

  // Find most confused pairs
  const mostConfusedPairs = findMostConfusedPairs(predictions, 5);

  // Performance by confidence level
  const highConfPredictions = predictions.filter((p) => p.confidence > 0.8);
  const lowConfPredictions = predictions.filter((p) => p.confidence < 0.5);

  const highConfidenceAccuracy =
    highConfPredictions.length > 0
      ? highConfPredictions.filter((p) => p.correct).length / highConfPredictions.length
      : 0;

  const lowConfidenceAccuracy =
    lowConfPredictions.length > 0
      ? lowConfPredictions.filter((p) => p.correct).length / lowConfPredictions.length
      : 0;

  return {
    accuracy,
    precision: avgPrecision,
    recall: avgRecall,
    f1Score: avgF1,
    calibrationError,
    confidenceAccuracyGap,
    auroc,
    perConditionMetrics,
    overallConfusionMatrix,
    mostConfusedPairs,
    highConfidenceAccuracy,
    lowConfidenceAccuracy,
  };
}

/**
 * Calculate metrics for a specific condition
 */
function calculateConditionMetrics(
  predictions: PredictionResult[],
  condition: string
): ConditionMetrics {
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const pred of predictions) {
    const predictedCondition = pred.predicted === condition;
    const actualCondition = pred.actual === condition;

    if (predictedCondition && actualCondition) {
      truePositive++;
    } else if (!predictedCondition && !actualCondition) {
      trueNegative++;
    } else if (predictedCondition && !actualCondition) {
      falsePositive++;
    } else if (!predictedCondition && actualCondition) {
      falseNegative++;
    }
  }

  const support = truePositive + falseNegative;
  const precision =
    truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : 0;
  const recall =
    truePositive + falseNegative > 0 ? truePositive / (truePositive + falseNegative) : 0;
  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (truePositive + trueNegative) / predictions.length;

  return {
    condition,
    accuracy,
    precision,
    recall,
    f1Score,
    support,
    confusionMatrix: {
      truePositive,
      trueNegative,
      falsePositive,
      falseNegative,
    },
  };
}

/**
 * Calculate Expected Calibration Error (ECE)
 * Measures how well confidence scores match actual accuracy
 */
function calculateCalibrationError(predictions: PredictionResult[]): number {
  const numBins = 10;
  const bins: Array<{ confidence: number; accuracy: number; count: number }> = [];

  // Initialize bins
  for (let i = 0; i < numBins; i++) {
    bins.push({ confidence: 0, accuracy: 0, count: 0 });
  }

  // Assign predictions to bins
  for (const pred of predictions) {
    const binIndex = Math.min(Math.floor(pred.confidence * numBins), numBins - 1);
    bins[binIndex].confidence += pred.confidence;
    bins[binIndex].accuracy += pred.correct ? 1 : 0;
    bins[binIndex].count++;
  }

  // Calculate ECE
  let ece = 0;
  for (const bin of bins) {
    if (bin.count > 0) {
      const avgConfidence = bin.confidence / bin.count;
      const avgAccuracy = bin.accuracy / bin.count;
      ece += (bin.count / predictions.length) * Math.abs(avgConfidence - avgAccuracy);
    }
  }

  return ece;
}

/**
 * Calculate AUROC (simplified for multi-class)
 */
function calculateAUROC(predictions: PredictionResult[]): number {
  // Simplified: treat as binary (correct vs incorrect)
  const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);

  let truePositives = 0;
  let falsePositives = 0;
  const totalPositives = predictions.filter((p) => p.correct).length;
  const totalNegatives = predictions.length - totalPositives;

  if (totalPositives === 0 || totalNegatives === 0) {
    return 0.5; // No discrimination possible
  }

  let auc = 0;
  for (const pred of sorted) {
    if (pred.correct) {
      truePositives++;
    } else {
      falsePositives++;
      auc += truePositives; // Add area under curve
    }
  }

  return auc / (totalPositives * totalNegatives);
}

/**
 * Calculate overall confusion matrix
 */
function calculateOverallConfusionMatrix(
  predictions: PredictionResult[]
): ConfusionMatrix {
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const pred of predictions) {
    if (pred.correct) {
      truePositive++;
    } else {
      falsePositive++;
    }
  }

  // For multi-class, this is simplified
  return {
    truePositive,
    trueNegative: 0, // Not applicable for multi-class
    falsePositive,
    falseNegative: 0, // Not applicable for multi-class
  };
}

/**
 * Find most confused pairs (predicted vs actual)
 */
function findMostConfusedPairs(
  predictions: PredictionResult[],
  topN: number
): Array<{ predicted: string; actual: string; count: number }> {
  const confusionCounts = new Map<string, number>();

  for (const pred of predictions) {
    if (!pred.correct) {
      const key = `${pred.predicted}|${pred.actual}`;
      confusionCounts.set(key, (confusionCounts.get(key) || 0) + 1);
    }
  }

  const pairs = Array.from(confusionCounts.entries())
    .map(([key, count]) => {
      const [predicted, actual] = key.split('|');
      return { predicted, actual, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return pairs;
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: AdvancedMetrics): string {
  let output = '=== Advanced Training Metrics ===\n\n';

  output += `Overall Performance:\n`;
  output += `  Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%\n`;
  output += `  Precision: ${(metrics.precision * 100).toFixed(2)}%\n`;
  output += `  Recall:    ${(metrics.recall * 100).toFixed(2)}%\n`;
  output += `  F1 Score:  ${(metrics.f1Score * 100).toFixed(2)}%\n`;
  output += `  AUROC:     ${(metrics.auroc * 100).toFixed(2)}%\n\n`;

  output += `Calibration:\n`;
  output += `  Calibration Error: ${(metrics.calibrationError * 100).toFixed(2)}%\n`;
  output += `  Confidence-Accuracy Gap: ${(metrics.confidenceAccuracyGap * 100).toFixed(2)}%\n\n`;

  output += `Confidence-Stratified Performance:\n`;
  output += `  High Confidence (>0.8): ${(metrics.highConfidenceAccuracy * 100).toFixed(2)}%\n`;
  output += `  Low Confidence (<0.5):  ${(metrics.lowConfidenceAccuracy * 100).toFixed(2)}%\n\n`;

  if (metrics.mostConfusedPairs.length > 0) {
    output += `Most Confused Pairs:\n`;
    for (const pair of metrics.mostConfusedPairs) {
      output += `  ${pair.predicted} ← ${pair.actual}: ${pair.count} times\n`;
    }
    output += '\n';
  }

  output += `Per-Condition Metrics:\n`;
  for (const [condition, condMetrics] of Array.from(metrics.perConditionMetrics.entries())) {
    output += `  ${condition}:\n`;
    output += `    Accuracy:  ${(condMetrics.accuracy * 100).toFixed(2)}%\n`;
    output += `    Precision: ${(condMetrics.precision * 100).toFixed(2)}%\n`;
    output += `    Recall:    ${(condMetrics.recall * 100).toFixed(2)}%\n`;
    output += `    F1 Score:  ${(condMetrics.f1Score * 100).toFixed(2)}%\n`;
    output += `    Support:   ${condMetrics.support} samples\n`;
  }

  return output;
}
