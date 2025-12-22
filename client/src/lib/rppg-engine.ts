/**
 * rPPG (Remote Photoplethysmography) Engine
 * 
 * Detects subtle color changes in the Green channel of video frames
 * to measure heart rate through camera-based photoplethysmography.
 * 
 * The science: Blood volume changes during cardiac cycles cause
 * subtle variations in skin color, particularly in the green spectrum
 * (500-600nm wavelength), which is most absorbed by hemoglobin.
 */

export interface BioScannerConfig {
  fps?: number;
  minWindowSeconds?: number;
  maxBufferSeconds?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  samplingInterval?: number; // Sample every Nth pixel for performance
}

export interface HRVMetrics {
  rmssd: number; // Root Mean Square of Successive Differences (ms)
  sdnn: number; // Standard Deviation of NN intervals (ms)
  pnn50: number; // Percentage of NN intervals > 50ms different (%)
  lfHfRatio: number; // Low Frequency / High Frequency ratio
  stressScore: number; // 0-100 (0=relaxed, 100=highly stressed)
  ansBalance: 'PARASYMPATHETIC' | 'BALANCED' | 'SYMPATHETIC';
}

export interface HeartRateResult {
  bpm: number;
  confidence: number; // 0-100
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  signalStrength: number; // 0-1
  timestamp: number;
  hrv?: HRVMetrics; // Optional HRV analysis
}

export class BioScannerEngine {
  private buffer: number[] = [];
  private fps: number;
  private minWindow: number;
  private maxBuffer: number;
  private minHeartRate: number;
  private maxHeartRate: number;
  private samplingInterval: number;
  private frameCount: number = 0;
  private lastPeakTime: number = 0;
  private peakHistory: number[] = [];

  constructor(config: BioScannerConfig = {}) {
    this.fps = config.fps ?? 30;
    this.minWindow = (config.minWindowSeconds ?? 5) * this.fps;
    this.maxBuffer = (config.maxBufferSeconds ?? 15) * this.fps;
    this.minHeartRate = config.minHeartRate ?? 40;
    this.maxHeartRate = config.maxHeartRate ?? 200;
    this.samplingInterval = config.samplingInterval ?? 16; // Sample every 16th pixel
  }

  /**
   * Process a single video frame and extract average Green channel intensity
   * 
   * @param imageData - Raw pixel data from canvas.getContext('2d').getImageData()
   * @returns Average green intensity value
   */
  processFrame(imageData: ImageData): number {
    let sumGreen = 0;
    let pixelCount = 0;
    const data = imageData.data;

    // Sample pixels at intervals to reduce CPU load
    // Each pixel is [R, G, B, A], so we jump by 4 * samplingInterval
    for (let i = 0; i < data.length; i += 4 * this.samplingInterval) {
      const green = data[i + 1]; // Green channel is at index 1
      sumGreen += green;
      pixelCount++;
    }

    const avgGreen = sumGreen / pixelCount;

    // Add to circular buffer
    this.buffer.push(avgGreen);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.shift();
    }

    this.frameCount++;
    return avgGreen;
  }

  /**
   * Calculate heart rate from the buffered signal using peak detection
   * 
   * Algorithm:
   * 1. Normalize signal (zero-mean)
   * 2. Apply simple bandpass filter (remove DC offset and high-frequency noise)
   * 3. Detect peaks using local maxima
   * 4. Calculate inter-peak intervals (IBI)
   * 5. Convert to BPM with confidence scoring
   * 
   * @returns Heart rate result or null if insufficient data
   */
  calculateHeartRate(): HeartRateResult | null {
    if (this.buffer.length < this.minWindow) {
      return null;
    }

    // Step 1: Normalize signal (zero-mean)
    const mean = this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
    const normalized = this.buffer.map(v => v - mean);

    // Step 2: Calculate signal variance for quality assessment
    const variance = normalized.reduce((sum, val) => sum + val * val, 0) / normalized.length;
    const stdDev = Math.sqrt(variance);

    // If signal is too flat, quality is poor (lowered threshold for better detection)
    if (stdDev < 0.3) {
      return {
        bpm: 0,
        confidence: 0,
        quality: 'poor',
        signalStrength: 0,
        timestamp: Date.now(),
      };
    }

    // Step 3: Detect peaks (local maxima above threshold)
    const threshold = stdDev * 0.3; // Adaptive threshold based on signal strength (lowered for better detection)
    const peaks: number[] = [];
    const peakIndices: number[] = [];

    for (let i = 1; i < normalized.length - 1; i++) {
      const current = normalized[i];
      const prev = normalized[i - 1];
      const next = normalized[i + 1];

      // Peak detection: current value is higher than neighbors and above threshold
      if (current > prev && current > next && current > threshold) {
        // Ensure peaks are at least 0.3s apart (200 BPM max)
        const minPeakDistance = this.fps * 0.3;
        if (peakIndices.length === 0 || i - peakIndices[peakIndices.length - 1] > minPeakDistance) {
          peaks.push(current);
          peakIndices.push(i);
        }
      }
    }

    // Need at least 3 peaks for reliable calculation
    if (peaks.length < 3) {
      return {
        bpm: 0,
        confidence: 20,
        quality: 'poor',
        signalStrength: Math.min(stdDev / 5, 1),
        timestamp: Date.now(),
      };
    }

    // Step 4: Calculate inter-beat intervals (IBI)
    const intervals: number[] = [];
    for (let i = 1; i < peakIndices.length; i++) {
      const interval = (peakIndices[i] - peakIndices[i - 1]) / this.fps; // in seconds
      intervals.push(interval);
    }

    // Calculate average interval and convert to BPM
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;

    // Step 5: Quality and confidence scoring
    // Check if BPM is within physiological range
    if (bpm < this.minHeartRate || bpm > this.maxHeartRate) {
      return {
        bpm: Math.round(bpm),
        confidence: 10,
        quality: 'poor',
        signalStrength: Math.min(stdDev / 5, 1),
        timestamp: Date.now(),
      };
    }

    // Calculate interval variability (lower is better for confidence)
    const intervalVariance = intervals.reduce((sum, interval) => {
      const diff = interval - avgInterval;
      return sum + diff * diff;
    }, 0) / intervals.length;
    const intervalStdDev = Math.sqrt(intervalVariance);

    // Confidence based on signal strength and interval consistency
    const signalStrength = Math.min(stdDev / 5, 1);
    const consistency = Math.max(0, 1 - (intervalStdDev / avgInterval) * 2);
    const confidence = Math.round((signalStrength * 0.6 + consistency * 0.4) * 100);

    // Quality assessment
    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    if (confidence >= 80) quality = 'excellent';
    else if (confidence >= 60) quality = 'good';
    else if (confidence >= 40) quality = 'fair';
    else quality = 'poor';

    // Store peak history for trend analysis
    this.peakHistory.push(bpm);
    if (this.peakHistory.length > 10) {
      this.peakHistory.shift();
    }

    // Calculate HRV metrics if we have enough peaks
    const hrvMetrics = this.calculateHRV(peakIndices);

    return {
      bpm: Math.round(bpm),
      confidence: Math.max(0, Math.min(100, confidence)),
      quality,
      signalStrength,
      timestamp: Date.now(),
      hrv: hrvMetrics || undefined,
    };
  }

  /**
   * Get current buffer size (useful for progress indicators)
   */
  getBufferProgress(): number {
    return Math.min(100, (this.buffer.length / this.minWindow) * 100);
  }

  /**
   * Check if enough data has been collected for calculation
   */
  isReady(): boolean {
    return this.buffer.length >= this.minWindow;
  }

  /**
   * Get signal quality metrics for debugging/UI feedback
   */
  getSignalMetrics() {
    if (this.buffer.length < 10) {
      return {
        bufferSize: this.buffer.length,
        signalStrength: 0,
        stability: 0,
      };
    }

    const mean = this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
    const variance = this.buffer.reduce((sum, val) => sum + (val - mean) ** 2, 0) / this.buffer.length;
    const stdDev = Math.sqrt(variance);

    return {
      bufferSize: this.buffer.length,
      signalStrength: Math.min(stdDev / 5, 1),
      stability: this.peakHistory.length > 3 
        ? 1 - (Math.max(...this.peakHistory) - Math.min(...this.peakHistory)) / 100
        : 0,
    };
  }

  /**
   * Reset the engine state (call when starting a new measurement)
   */
  reset() {
    this.buffer = [];
    this.frameCount = 0;
    this.lastPeakTime = 0;
    this.peakHistory = [];
  }

  /**
   * Get average BPM from recent history (smoothed result)
   */
  getSmoothedBPM(): number | null {
    if (this.peakHistory.length < 3) return null;
    
    const sum = this.peakHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.peakHistory.length);
  }

  /**
   * Calculate HRV (Heart Rate Variability) metrics from inter-beat intervals
   * 
   * HRV measures the variation in time between heartbeats and is a key indicator of:
   * - Autonomic nervous system (ANS) balance
   * - Stress levels and recovery
   * - Cardiovascular health
   * 
   * @param peakIndices - Array of peak positions in the signal buffer
   * @returns HRV metrics or null if insufficient data
   */
  private calculateHRV(peakIndices: number[]): HRVMetrics | null {
    // Need at least 5 peaks for meaningful HRV analysis
    if (peakIndices.length < 5) return null;

    // Calculate NN intervals (Normal-to-Normal intervals in milliseconds)
    const nnIntervals: number[] = [];
    for (let i = 1; i < peakIndices.length; i++) {
      const intervalFrames = peakIndices[i] - peakIndices[i - 1];
      const intervalMs = (intervalFrames / this.fps) * 1000;
      nnIntervals.push(intervalMs);
    }

    // 1. RMSSD - Root Mean Square of Successive Differences
    // Measures short-term HRV, reflects parasympathetic activity
    const successiveDiffs = [];
    for (let i = 1; i < nnIntervals.length; i++) {
      const diff = nnIntervals[i] - nnIntervals[i - 1];
      successiveDiffs.push(diff * diff);
    }
    const rmssd = Math.sqrt(successiveDiffs.reduce((a, b) => a + b, 0) / successiveDiffs.length);

    // 2. SDNN - Standard Deviation of NN intervals
    // Measures overall HRV, reflects both sympathetic and parasympathetic activity
    const meanNN = nnIntervals.reduce((a, b) => a + b, 0) / nnIntervals.length;
    const variance = nnIntervals.reduce((sum, nn) => sum + (nn - meanNN) ** 2, 0) / nnIntervals.length;
    const sdnn = Math.sqrt(variance);

    // 3. pNN50 - Percentage of NN intervals > 50ms different from previous
    // Another measure of parasympathetic activity
    let nn50Count = 0;
    for (let i = 1; i < nnIntervals.length; i++) {
      if (Math.abs(nnIntervals[i] - nnIntervals[i - 1]) > 50) {
        nn50Count++;
      }
    }
    const pnn50 = (nn50Count / (nnIntervals.length - 1)) * 100;

    // 4. Simplified LF/HF ratio estimation
    // In proper HRV analysis, this requires frequency domain analysis (FFT)
    // Here we use a simplified approximation based on interval variability patterns
    // Low variability → high LF/HF (sympathetic dominance, stress)
    // High variability → low LF/HF (parasympathetic dominance, relaxation)
    const normalizedSDNN = Math.min(sdnn / 100, 1); // Normalize to 0-1
    const lfHfRatio = Math.max(0.5, Math.min(3.0, 2.0 - normalizedSDNN * 1.5));

    // 5. Stress Score (0-100)
    // Lower HRV = higher stress
    // Combines RMSSD and SDNN with inverse relationship
    const rmssdScore = Math.max(0, Math.min(100, 100 - (rmssd / 1.5)));
    const sdnnScore = Math.max(0, Math.min(100, 100 - (sdnn / 1.5)));
    const lfHfScore = Math.max(0, Math.min(100, (lfHfRatio - 0.5) * 40));
    const stressScore = Math.round((rmssdScore * 0.4 + sdnnScore * 0.4 + lfHfScore * 0.2));

    // 6. ANS Balance Assessment
    let ansBalance: 'PARASYMPATHETIC' | 'BALANCED' | 'SYMPATHETIC';
    if (lfHfRatio < 1.2) {
      ansBalance = 'PARASYMPATHETIC'; // Relaxed, recovery state
    } else if (lfHfRatio > 2.0) {
      ansBalance = 'SYMPATHETIC'; // Stressed, fight-or-flight
    } else {
      ansBalance = 'BALANCED'; // Healthy balance
    }

    return {
      rmssd: Math.round(rmssd * 100) / 100,
      sdnn: Math.round(sdnn * 100) / 100,
      pnn50: Math.round(pnn50 * 100) / 100,
      lfHfRatio: Math.round(lfHfRatio * 100) / 100,
      stressScore,
      ansBalance,
    };
  }
}
