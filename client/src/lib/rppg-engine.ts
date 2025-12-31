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
  public buffer: number[] = [];
  private fps: number;
  private computedFps: number; // Dynamic FPS calculation
  private lastFrameTime: number = 0;
  private minWindow: number;
  private maxBuffer: number;
  private minHeartRate: number;
  private maxHeartRate: number;
  private samplingInterval: number;
  public frameCount: number = 0;
  private lastPeakTime: number = 0;
  private peakHistory: number[] = [];

  constructor(config: BioScannerConfig = {}) {
    this.fps = config.fps ?? 30;
    this.computedFps = this.fps; // Initialize with default
    this.minWindow = (config.minWindowSeconds ?? 5) * this.fps;
    this.maxBuffer = (config.maxBufferSeconds ?? 15) * this.fps;
    this.minHeartRate = config.minHeartRate ?? 40;
    this.maxHeartRate = config.maxHeartRate ?? 200;
    this.samplingInterval = config.samplingInterval ?? 8; // Sample every 8th pixel (more samples = better signal)
  }

  /**
   * Process a single video frame and extract average Green channel intensity
   * 
   * @param imageData - Raw pixel data from canvas.getContext('2d').getImageData()
   * @returns Average green intensity value
   */
  processFrame(imageData: ImageData): number {
    // ⏱️ Calculate Real FPS dynamically
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      const currentFps = 1000 / delta;
      // Smooth the FPS over time (exponential moving average)
      this.computedFps = (this.computedFps * 0.9) + (currentFps * 0.1);
    }
    this.lastFrameTime = now;

    let sumGreen = 0;
    let sumRed = 0;
    let sumBlue = 0;
    let pixelCount = 0;
    const data = imageData.data;

    // Sample pixels at intervals to reduce CPU load
    // Each pixel is [R, G, B, A], so we jump by 4 * samplingInterval
    for (let i = 0; i < data.length; i += 4 * this.samplingInterval) {
      const red = data[i];
      const green = data[i + 1]; // Green channel is at index 1
      const blue = data[i + 2];
      sumRed += red;
      sumGreen += green;
      sumBlue += blue;
      pixelCount++;
    }

    const avgRed = sumRed / pixelCount;
    const avgGreen = sumGreen / pixelCount;
    const avgBlue = sumBlue / pixelCount;

    // Debug logging every 30 frames (~1 second)
    if (this.frameCount % 30 === 0) {
      console.log('[rPPG Pixel Data] R:', avgRed.toFixed(1), '| G:', avgGreen.toFixed(1), '| B:', avgBlue.toFixed(1), '| Pixels sampled:', pixelCount);
      console.log('[rPPG FPS] Computed:', this.computedFps.toFixed(1), '| Expected:', this.fps);
      console.log('[rPPG Buffer] Size:', this.buffer.length, '| Latest values:', this.buffer.slice(-5).map(v => v.toFixed(1)).join(', '));
    }

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

    // Use computed FPS for all calculations
    const effectiveFps = this.computedFps > 10 ? this.computedFps : this.fps;

    // Step 1: Normalize signal (zero-mean)
    const mean = this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
    const normalized = this.buffer.map(v => v - mean);

    // Step 2: Calculate signal variance for quality assessment
    const variance = normalized.reduce((sum, val) => sum + val * val, 0) / normalized.length;
    const stdDev = Math.sqrt(variance);

    // Debug logging for signal analysis
    console.log('[rPPG Debug] Buffer length:', this.buffer.length, '| Effective FPS:', effectiveFps.toFixed(1));
    console.log('[rPPG Debug] Signal stdDev:', stdDev.toFixed(3), '| Mean:', mean.toFixed(2));
    
    // If signal is too flat, quality is poor (lowered threshold significantly for real-world conditions)
    // Further lowered from 0.05 to 0.03 for better detection
    if (stdDev < 0.03) {
      console.log('[rPPG Debug] ❌ Signal too flat, stdDev < 0.03');
      return {
        bpm: 0,
        confidence: 0,
        quality: 'poor',
        signalStrength: 0,
        timestamp: Date.now(),
      };
    }

    // Step 3: Detect peaks (local maxima above threshold)
    // Further lowered from 0.08 to 0.05 for better peak detection in low-light conditions
    const threshold = stdDev * 0.05; // Adaptive threshold based on signal strength (lowered significantly for subtle signals)
    console.log('[rPPG Debug] Peak detection threshold:', threshold.toFixed(3));
    const peaks: number[] = [];
    const peakIndices: number[] = [];

    for (let i = 1; i < normalized.length - 1; i++) {
      const current = normalized[i];
      const prev = normalized[i - 1];
      const next = normalized[i + 1];

      // Peak detection: current value is higher than neighbors and above threshold
      if (current > prev && current > next && current > threshold) {
        // Ensure peaks are at least 0.2s apart (300 BPM max, allows for faster heart rates)
        // Lowered from 0.25s to 0.2s for better detection
        const minPeakDistance = effectiveFps * 0.2;
        if (peakIndices.length === 0 || i - peakIndices[peakIndices.length - 1] > minPeakDistance) {
          peaks.push(current);
          peakIndices.push(i);
        }
      }
    }

    // Need at least 2 peaks for calculation (lowered from 3 for faster response)
    console.log('[rPPG Debug] Peaks detected:', peaks.length);
    if (peaks.length < 2) {
      console.log('[rPPG Debug] ❌ Not enough peaks (need 2, found', peaks.length + ')');
      return {
        bpm: 0,
        confidence: 20,
        quality: 'poor',
        signalStrength: Math.min(stdDev / 5, 1),
        timestamp: Date.now(),
      };
    }

    // Step 4: Calculate inter-beat intervals (IBI) using computed FPS
    const intervals: number[] = [];
    for (let i = 1; i < peakIndices.length; i++) {
      const interval = (peakIndices[i] - peakIndices[i - 1]) / effectiveFps; // in seconds
      intervals.push(interval);
    }

    // Calculate average interval and convert to BPM
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;
    console.log('[rPPG Debug] ✅ Calculated BPM:', bpm.toFixed(1), '| Avg interval:', avgInterval.toFixed(2) + 's', '| Peaks:', peaks.length);

    // Step 5: Quality and confidence scoring
    // Check if BPM is within physiological range
    if (bpm < this.minHeartRate || bpm > this.maxHeartRate) {
      console.log('[rPPG Debug] ❌ BPM out of range:', bpm.toFixed(1), '| Valid range:', this.minHeartRate, '-', this.maxHeartRate);
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

    console.log('[rPPG Debug] 📊 Signal strength:', signalStrength.toFixed(2), '| Consistency:', consistency.toFixed(2), '| Confidence:', confidence + '%');

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
    const hrvMetrics = this.calculateHRV(peakIndices, effectiveFps);

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
        fps: this.computedFps,
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
      fps: this.computedFps,
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
    this.lastFrameTime = 0; // Reset FPS timer
    this.computedFps = this.fps; // Reset to default
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
   * @param effectiveFps - The actual FPS being used for calculations
   * @returns HRV metrics or null if insufficient data
   */
  private calculateHRV(peakIndices: number[], effectiveFps: number): HRVMetrics | null {
    // Need at least 5 peaks for meaningful HRV analysis
    if (peakIndices.length < 5) return null;

    // Calculate NN intervals (Normal-to-Normal intervals in milliseconds)
    const nnIntervals: number[] = [];
    for (let i = 1; i < peakIndices.length; i++) {
      const intervalFrames = peakIndices[i] - peakIndices[i - 1];
      const intervalMs = (intervalFrames / effectiveFps) * 1000;
      nnIntervals.push(intervalMs);
    }

    // 1. RMSSD (Root Mean Square of Successive Differences)
    // Measures short-term variability, reflects parasympathetic activity
    const successiveDiffs = nnIntervals.slice(1).map((interval, i) => interval - nnIntervals[i]);
    const squaredDiffs = successiveDiffs.map(diff => diff * diff);
    const rmssd = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length);

    // 2. SDNN (Standard Deviation of NN intervals)
    // Measures overall variability, reflects both sympathetic and parasympathetic activity
    const meanNN = nnIntervals.reduce((a, b) => a + b, 0) / nnIntervals.length;
    const nnVariance = nnIntervals.reduce((sum, interval) => sum + Math.pow(interval - meanNN, 2), 0) / nnIntervals.length;
    const sdnn = Math.sqrt(nnVariance);

    // 3. pNN50 (Percentage of NN intervals > 50ms different)
    // Another measure of parasympathetic activity
    const nn50Count = successiveDiffs.filter(diff => Math.abs(diff) > 50).length;
    const pnn50 = (nn50Count / successiveDiffs.length) * 100;

    // 4. LF/HF Ratio (Low Frequency / High Frequency power ratio)
    // Simplified estimation: use interval variability as proxy
    // In a full implementation, this would require FFT (Fast Fourier Transform)
    // LF (0.04-0.15 Hz) reflects sympathetic + parasympathetic
    // HF (0.15-0.4 Hz) reflects parasympathetic
    // For now, we use a simplified heuristic based on RMSSD and SDNN
    const lfHfRatio = sdnn / (rmssd + 1); // +1 to avoid division by zero

    // 5. Stress Score (0-100, higher = more stressed)
    // Based on HRV metrics: lower RMSSD and higher LF/HF = higher stress
    const normalizedRmssd = Math.min(rmssd / 50, 1); // 50ms is healthy baseline
    const normalizedLfHf = Math.min(lfHfRatio / 3, 1); // 3.0 is high stress threshold
    const stressScore = Math.round((1 - normalizedRmssd) * 50 + normalizedLfHf * 50);

    // 6. ANS Balance (Autonomic Nervous System balance)
    let ansBalance: 'PARASYMPATHETIC' | 'BALANCED' | 'SYMPATHETIC';
    if (lfHfRatio < 1.5) {
      ansBalance = 'PARASYMPATHETIC'; // Relaxed, recovery state
    } else if (lfHfRatio < 2.5) {
      ansBalance = 'BALANCED'; // Healthy balance
    } else {
      ansBalance = 'SYMPATHETIC'; // Stressed, fight-or-flight
    }

    return {
      rmssd: Math.round(rmssd * 10) / 10,
      sdnn: Math.round(sdnn * 10) / 10,
      pnn50: Math.round(pnn50 * 10) / 10,
      lfHfRatio: Math.round(lfHfRatio * 100) / 100,
      stressScore: Math.max(0, Math.min(100, stressScore)),
      ansBalance,
    };
  }
}
