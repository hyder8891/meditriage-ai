/**
 * Input Validation Module
 * 
 * Layer 1 of the Accuracy Framework: Ensures data quality before AI processing
 */

export interface InputValidationResult {
  isValid: boolean;
  quality: number; // 0-100
  issues: string[];
  preprocessedData: any;
  metadata: {
    validatedAt: Date;
    validator: string;
    processingTime: number;
  };
}

export interface ImageQualityMetrics {
  resolution: { width: number; height: number };
  brightness: number; // 0-255
  contrast: number; // 0-1
  sharpness: number; // 0-1
  hasArtifacts: boolean;
  isBlurry: boolean;
  isOverexposed: boolean;
  isUnderexposed: boolean;
}

export interface TextQualityMetrics {
  completeness: number; // 0-1
  readability: number; // 0-1
  structureScore: number; // 0-1
  ocrConfidence?: number; // 0-1 (if OCR was used)
  missingFields: string[];
}

export interface SignalQualityMetrics {
  snr: number; // Signal-to-noise ratio
  stability: number; // 0-1
  amplitude: number;
  frequency: number;
  hasNoise: boolean;
  hasArtifacts: boolean;
}

/**
 * Validate medical image quality
 */
export async function validateMedicalImage(
  imageUrl: string,
  imageType: 'xray' | 'ct' | 'mri' | 'photo' | 'document'
): Promise<InputValidationResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  
  try {
    // Note: This is a placeholder implementation
    // In production, you would use image processing libraries
    // or specialized medical imaging quality assessment APIs
    
    const quality = await assessImageQuality(imageUrl, imageType);
    
    // Check resolution
    if (quality.resolution.width < 512 || quality.resolution.height < 512) {
      issues.push('Image resolution too low (minimum 512x512 required)');
    }
    
    // Check brightness
    if (quality.brightness < 50) {
      issues.push('Image too dark');
    } else if (quality.brightness > 200) {
      issues.push('Image too bright');
    }
    
    // Check contrast
    if (quality.contrast < 0.3) {
      issues.push('Low contrast - may affect diagnostic accuracy');
    }
    
    // Check sharpness
    if (quality.sharpness < 0.5) {
      issues.push('Image appears blurry');
    }
    
    // Check for artifacts
    if (quality.hasArtifacts) {
      issues.push('Artifacts detected in image');
    }
    
    // Calculate overall quality score
    const qualityScore = calculateImageQualityScore(quality);
    
    return {
      isValid: qualityScore >= 60 && issues.length < 3,
      quality: qualityScore,
      issues,
      preprocessedData: {
        url: imageUrl,
        type: imageType,
        metrics: quality
      },
      metadata: {
        validatedAt: new Date(),
        validator: 'validateMedicalImage',
        processingTime: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      isValid: false,
      quality: 0,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      preprocessedData: null,
      metadata: {
        validatedAt: new Date(),
        validator: 'validateMedicalImage',
        processingTime: Date.now() - startTime
      }
    };
  }
}

/**
 * Validate lab report text quality
 */
export async function validateLabReport(
  reportText: string,
  reportType: string
): Promise<InputValidationResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  
  try {
    const quality = assessTextQuality(reportText, reportType);
    
    // Check completeness
    if (quality.completeness < 0.7) {
      issues.push('Report appears incomplete');
    }
    
    // Check for missing critical fields
    if (quality.missingFields.length > 0) {
      issues.push(`Missing fields: ${quality.missingFields.join(', ')}`);
    }
    
    // Check OCR confidence if applicable
    if (quality.ocrConfidence !== undefined && quality.ocrConfidence < 0.8) {
      issues.push('Low OCR confidence - manual review recommended');
    }
    
    // Check readability
    if (quality.readability < 0.6) {
      issues.push('Poor text quality or formatting');
    }
    
    const qualityScore = calculateTextQualityScore(quality);
    
    return {
      isValid: qualityScore >= 70 && quality.completeness >= 0.7,
      quality: qualityScore,
      issues,
      preprocessedData: {
        text: reportText,
        type: reportType,
        metrics: quality
      },
      metadata: {
        validatedAt: new Date(),
        validator: 'validateLabReport',
        processingTime: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      isValid: false,
      quality: 0,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      preprocessedData: null,
      metadata: {
        validatedAt: new Date(),
        validator: 'validateLabReport',
        processingTime: Date.now() - startTime
      }
    };
  }
}

/**
 * Validate vital sign signal quality (for Bio-Scanner)
 */
export async function validateVitalSignal(
  signalData: number[],
  signalType: 'ppg' | 'ecg' | 'respiratory'
): Promise<InputValidationResult> {
  const startTime = Date.now();
  const issues: string[] = [];
  
  try {
    const quality = assessSignalQuality(signalData, signalType);
    
    // Check signal-to-noise ratio
    if (quality.snr < 3) {
      issues.push('High noise level detected');
    }
    
    // Check stability
    if (quality.stability < 0.6) {
      issues.push('Unstable signal - movement detected');
    }
    
    // Check amplitude
    if (quality.amplitude < 10) {
      issues.push('Signal amplitude too low - ensure proper contact');
    }
    
    // Check for artifacts
    if (quality.hasArtifacts) {
      issues.push('Signal artifacts detected');
    }
    
    const qualityScore = calculateSignalQualityScore(quality);
    
    return {
      isValid: qualityScore >= 60 && quality.snr >= 3,
      quality: qualityScore,
      issues,
      preprocessedData: {
        signal: signalData,
        type: signalType,
        metrics: quality
      },
      metadata: {
        validatedAt: new Date(),
        validator: 'validateVitalSignal',
        processingTime: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      isValid: false,
      quality: 0,
      issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      preprocessedData: null,
      metadata: {
        validatedAt: new Date(),
        validator: 'validateVitalSignal',
        processingTime: Date.now() - startTime
      }
    };
  }
}

/**
 * Validate symptom input completeness
 */
export function validateSymptomInput(symptoms: {
  description: string;
  duration?: string;
  severity?: number;
  location?: string;
}[]): InputValidationResult {
  const startTime = Date.now();
  const issues: string[] = [];
  
  // Check minimum symptom count
  if (symptoms.length === 0) {
    issues.push('No symptoms provided');
  }
  
  // Check symptom descriptions
  const emptyDescriptions = symptoms.filter(s => !s.description || s.description.trim().length < 3);
  if (emptyDescriptions.length > 0) {
    issues.push('Some symptoms have insufficient description');
  }
  
  // Check for duration information
  const missingDuration = symptoms.filter(s => !s.duration);
  if (missingDuration.length > symptoms.length / 2) {
    issues.push('Duration information missing for most symptoms');
  }
  
  // Check for severity information
  const missingSeverity = symptoms.filter(s => s.severity === undefined);
  if (missingSeverity.length > symptoms.length / 2) {
    issues.push('Severity information missing for most symptoms');
  }
  
  // Calculate completeness score
  const completeness = symptoms.reduce((sum, s) => {
    let score = 0;
    if (s.description && s.description.length >= 3) score += 0.4;
    if (s.duration) score += 0.2;
    if (s.severity !== undefined) score += 0.2;
    if (s.location) score += 0.2;
    return sum + score;
  }, 0) / symptoms.length;
  
  const qualityScore = Math.round(completeness * 100);
  
  return {
    isValid: qualityScore >= 50 && symptoms.length > 0,
    quality: qualityScore,
    issues,
    preprocessedData: symptoms,
    metadata: {
      validatedAt: new Date(),
      validator: 'validateSymptomInput',
      processingTime: Date.now() - startTime
    }
  };
}

// Helper functions

async function assessImageQuality(
  imageUrl: string,
  imageType: string
): Promise<ImageQualityMetrics> {
  // Placeholder implementation
  // In production, use image processing libraries or APIs
  return {
    resolution: { width: 1024, height: 1024 },
    brightness: 128,
    contrast: 0.7,
    sharpness: 0.8,
    hasArtifacts: false,
    isBlurry: false,
    isOverexposed: false,
    isUnderexposed: false
  };
}

function assessTextQuality(text: string, reportType: string): TextQualityMetrics {
  const missingFields: string[] = [];
  
  // Check for common required fields based on report type
  if (reportType.toLowerCase().includes('blood')) {
    if (!text.toLowerCase().includes('hemoglobin') && !text.toLowerCase().includes('hb')) {
      missingFields.push('Hemoglobin');
    }
    if (!text.toLowerCase().includes('wbc') && !text.toLowerCase().includes('white blood')) {
      missingFields.push('WBC');
    }
  }
  
  // Calculate completeness
  const wordCount = text.split(/\s+/).length;
  const completeness = Math.min(wordCount / 100, 1); // Assume 100 words is complete
  
  // Calculate readability (simplified)
  const hasNumbers = /\d/.test(text);
  const hasUnits = /(mg|ml|dl|mmol|g|l)/i.test(text);
  const readability = (hasNumbers && hasUnits) ? 0.8 : 0.5;
  
  // Structure score
  const hasHeaders = /\n\s*[A-Z][A-Za-z\s]+:\s*\n/.test(text);
  const structureScore = hasHeaders ? 0.8 : 0.6;
  
  return {
    completeness,
    readability,
    structureScore,
    missingFields
  };
}

function assessSignalQuality(
  signalData: number[],
  signalType: string
): SignalQualityMetrics {
  // Calculate basic signal metrics
  const mean = signalData.reduce((a, b) => a + b, 0) / signalData.length;
  const variance = signalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signalData.length;
  const stdDev = Math.sqrt(variance);
  
  // Estimate SNR (simplified)
  const snr = mean / (stdDev + 0.001);
  
  // Calculate stability (coefficient of variation)
  const cv = stdDev / (mean + 0.001);
  const stability = Math.max(0, 1 - cv);
  
  // Amplitude
  const amplitude = Math.max(...signalData) - Math.min(...signalData);
  
  // Estimate frequency (simplified peak counting)
  let peaks = 0;
  for (let i = 1; i < signalData.length - 1; i++) {
    if (signalData[i] > signalData[i - 1] && signalData[i] > signalData[i + 1]) {
      peaks++;
    }
  }
  const frequency = peaks / (signalData.length / 30); // Assuming 30 fps
  
  return {
    snr,
    stability,
    amplitude,
    frequency,
    hasNoise: snr < 5,
    hasArtifacts: stdDev > mean * 0.5
  };
}

function calculateImageQualityScore(metrics: ImageQualityMetrics): number {
  let score = 100;
  
  // Resolution penalty
  const minDim = Math.min(metrics.resolution.width, metrics.resolution.height);
  if (minDim < 512) score -= 30;
  else if (minDim < 768) score -= 10;
  
  // Brightness penalty
  if (metrics.brightness < 50 || metrics.brightness > 200) score -= 20;
  else if (metrics.brightness < 80 || metrics.brightness > 180) score -= 10;
  
  // Contrast penalty
  if (metrics.contrast < 0.3) score -= 20;
  else if (metrics.contrast < 0.5) score -= 10;
  
  // Sharpness penalty
  if (metrics.sharpness < 0.5) score -= 20;
  else if (metrics.sharpness < 0.7) score -= 10;
  
  // Artifacts penalty
  if (metrics.hasArtifacts) score -= 15;
  if (metrics.isBlurry) score -= 15;
  if (metrics.isOverexposed) score -= 15;
  if (metrics.isUnderexposed) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

function calculateTextQualityScore(metrics: TextQualityMetrics): number {
  let score = 0;
  
  score += metrics.completeness * 40;
  score += metrics.readability * 30;
  score += metrics.structureScore * 20;
  
  if (metrics.ocrConfidence !== undefined) {
    score += metrics.ocrConfidence * 10;
  } else {
    score += 10; // Assume good quality if no OCR
  }
  
  // Penalty for missing fields
  score -= metrics.missingFields.length * 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateSignalQualityScore(metrics: SignalQualityMetrics): number {
  let score = 100;
  
  // SNR penalty
  if (metrics.snr < 3) score -= 30;
  else if (metrics.snr < 5) score -= 15;
  
  // Stability penalty
  if (metrics.stability < 0.6) score -= 20;
  else if (metrics.stability < 0.8) score -= 10;
  
  // Amplitude penalty
  if (metrics.amplitude < 10) score -= 20;
  else if (metrics.amplitude < 20) score -= 10;
  
  // Noise and artifacts
  if (metrics.hasNoise) score -= 15;
  if (metrics.hasArtifacts) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}
