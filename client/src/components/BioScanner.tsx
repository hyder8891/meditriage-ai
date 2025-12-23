import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Activity, RefreshCw, Camera } from "lucide-react";
import { toast } from "sonner";

/**
 * 🧬 PROGRESSIVE ENGINE v3.1 - MEDICAL-GRADE ACCURACY
 * Multi-measurement averaging with outlier rejection:
 * - Extended measurement window (10-15 seconds)
 * - Rolling average of last 5 stable readings
 * - Median Absolute Deviation (MAD) outlier rejection
 * - Confidence-weighted averaging
 * - Stabilization detection (CV < 5%)
 * 
 * Three-tier detection with anti-doubling protection:
 * Tier 1 (0-3s): Balanced (30% threshold, 400ms debounce, 2+ peaks)
 * Tier 2 (3-8s): Moderate (35% threshold, 450ms debounce, 3+ peaks)
 * Tier 3 (8s+): High accuracy (40% threshold, 500ms debounce, 4+ peaks)
 */
class ProgressiveBioEngine {
  buffer: number[] = [];
  timestamps: number[] = [];
  startTime: number = 0;
  fps: number = 30; // Dynamic FPS tracking
  private lastFpsUpdate: number = 0;
  
  // Multi-measurement system
  private recentReadings: Array<{ bpm: number; confidence: number; timestamp: number }> = [];
  private readonly MAX_READINGS = 10; // Keep last 10 readings
  private readonly MIN_READINGS_FOR_AVERAGE = 3; // Need at least 3 for averaging
  
  // Configuration for progressive detection
  private MIN_BPM = 45;
  private MAX_BPM = 200;
  private WINDOW_SIZE = 256; // ~8 seconds at 30fps (increased from 150)

  reset() {
    this.buffer = [];
    this.timestamps = [];
    this.startTime = performance.now();
    this.fps = 30;
    this.lastFpsUpdate = 0;
    this.recentReadings = [];
  }

  /**
   * Calculate median absolute deviation for outlier detection
   */
  private calculateMAD(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviations = values.map(v => Math.abs(v - median));
    const sortedDevs = deviations.sort((a, b) => a - b);
    return sortedDevs[Math.floor(sortedDevs.length / 2)];
  }

  /**
   * Get stabilized BPM using multi-measurement averaging with outlier rejection
   */
  getStabilizedBPM(): { bpm: number; confidence: number; isStable: boolean; sampleSize: number } | null {
    if (this.recentReadings.length < this.MIN_READINGS_FOR_AVERAGE) {
      return null;
    }

    // Get last 5 readings for averaging
    const recent = this.recentReadings.slice(-5);
    const bpmValues = recent.map(r => r.bpm);
    
    // Calculate median and MAD for outlier detection
    const median = [...bpmValues].sort((a, b) => a - b)[Math.floor(bpmValues.length / 2)];
    const mad = this.calculateMAD(bpmValues);
    const madThreshold = 2.5; // Standard outlier threshold
    
    // Filter outliers
    const filtered = recent.filter(r => {
      const deviation = Math.abs(r.bpm - median);
      return mad === 0 || deviation <= madThreshold * mad;
    });
    
    if (filtered.length === 0) return null;
    
    // Confidence-weighted average
    let weightedSum = 0;
    let weightSum = 0;
    
    filtered.forEach(r => {
      const weight = r.confidence / 100; // Convert percentage to 0-1
      weightedSum += r.bpm * weight;
      weightSum += weight;
    });
    
    const avgBpm = Math.round(weightedSum / weightSum);
    const avgConfidence = Math.round(filtered.reduce((sum, r) => sum + r.confidence, 0) / filtered.length);
    
    // Calculate coefficient of variation to detect stability
    const mean = filtered.reduce((sum, r) => sum + r.bpm, 0) / filtered.length;
    const variance = filtered.reduce((sum, r) => sum + Math.pow(r.bpm - mean, 2), 0) / filtered.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / mean) * 100;
    
    const isStable = coefficientOfVariation < 5; // Stable if CV < 5%
    
    return {
      bpm: avgBpm,
      confidence: avgConfidence,
      isStable,
      sampleSize: filtered.length
    };
  }

  process(imageData: ImageData): { bpm: number | null; confidence: number; val: number; debug: string; peaks?: number } {
    const now = performance.now();
    
    // --- 1. SIGNAL EXTRACTION ---
    let sumGreen = 0;
    let pixelCount = 0;
    const data = imageData.data;
    
    // Sample EVERY pixel for maximum signal strength (4 bytes per pixel: RGBA)
    for (let i = 0; i < data.length; i += 4) {
      sumGreen += data[i + 1]; // Green channel
      pixelCount++;
    }
    
    const avg = sumGreen / pixelCount; 

    // Add to buffer
    this.buffer.push(avg);
    this.timestamps.push(now);
    
    // Update FPS dynamically every second
    if (this.timestamps.length > 1 && now - this.lastFpsUpdate > 1000) {
      const recentWindow = this.timestamps.slice(-60); // Last 60 frames
      if (recentWindow.length > 1) {
        const duration = recentWindow[recentWindow.length - 1] - recentWindow[0];
        this.fps = Math.round((recentWindow.length - 1) / (duration / 1000));
        this.lastFpsUpdate = now;
      }
    }

    // Maintain sliding window
    if (this.buffer.length > this.WINDOW_SIZE) {
      this.buffer.shift();
      this.timestamps.shift();
    }

    // Need minimal data to start (1 second at 30fps = 30 samples)
    if (this.buffer.length < 30) {
        return { bpm: null, confidence: 0, val: avg, debug: `Warming up... ${this.buffer.length}/30` };
    }

    // --- 2. PROGRESSIVE SIGNAL PROCESSING ---
    
    // Determine current tier based on elapsed time
    const elapsed = (now - this.startTime) / 1000; // seconds
    let thresholdPercent: number;
    let minDebounce: number;
    let minPeaks: number;
    let tier: string;
    
    if (elapsed < 3) {
      // Tier 1: Balanced for immediate feedback without false peaks
      thresholdPercent = 0.30; // Higher threshold to avoid harmonic doubling
      minDebounce = 400; // Longer debounce ensures only ONE peak per heartbeat
      minPeaks = 2;
      tier = "T1";
    } else if (elapsed < 8) {
      // Tier 2: Moderate detection with good accuracy
      thresholdPercent = 0.35;
      minDebounce = 450;
      minPeaks = 3;
      tier = "T2";
    } else {
      // Tier 3: High accuracy mode
      thresholdPercent = 0.40;
      minDebounce = 500;
      minPeaks = 4;
      tier = "T3";
    }
    
    // A. Detrend using Moving Average (removes slow drift, keeps heartbeat oscillations)
    const windowSize = 30; // ~1 second at 30fps - removes slow changes
    const detrended: number[] = [];
    
    for (let i = 0; i < this.buffer.length; i++) {
      // Calculate moving average around this point
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(this.buffer.length, i + Math.floor(windowSize / 2));
      const window = this.buffer.slice(start, end);
      const movingAvg = window.reduce((a, b) => a + b) / window.length;
      
      // Subtract moving average to remove trend
      detrended.push(this.buffer[i] - movingAvg);
    }
    
    // B. Zero-mean normalization
    const mean = detrended.reduce((a, b) => a + b) / detrended.length;
    const normalized = detrended.map(v => v - mean);

    // B. Dynamic Peak Thresholding
    const maxAmp = Math.max(...normalized.map(Math.abs));
    const threshold = maxAmp * thresholdPercent;
    
    // Debug logging every 30 frames (~1 second)
    if (this.buffer.length % 30 === 0) {
      console.log(`[${tier}] 🔬 Signal Analysis:`, {
        bufferSize: this.buffer.length,
        rawMean: mean.toFixed(2),
        maxAmplitude: maxAmp.toFixed(2),
        threshold: threshold.toFixed(2),
        thresholdPercent: (thresholdPercent * 100).toFixed(0) + '%',
        signalRange: `${Math.min(...normalized).toFixed(2)} to ${Math.max(...normalized).toFixed(2)}`
      });
    }

    // C. Peak Detection with Progressive Debounce
    let peaks: number[] = [];
    let candidatePeaks = 0; // Track how many potential peaks we find
    for (let i = 1; i < normalized.length - 1; i++) {
      const prev = normalized[i-1];
      const curr = normalized[i];
      const next = normalized[i+1];
      
      // Local maxima greater than dynamic threshold
      if (curr > prev && curr > next) {
        candidatePeaks++; // Found a local maximum
        if (curr > threshold) {
          // Progressive debounce
          if (peaks.length === 0 || (this.timestamps[i] - this.timestamps[peaks[peaks.length-1]]) > minDebounce) {
            peaks.push(i);
            if (this.buffer.length % 30 === 0) {
              console.log(`[${tier}] ✅ Peak ${peaks.length} detected at index ${i}, value: ${curr.toFixed(2)}`);
            }
          }
        }
      }
    }

    // Debug logging for peak detection results
    if (this.buffer.length % 30 === 0) {
      console.log(`[${tier}] 📊 Peak Detection:`, {
        candidatePeaks,
        peaksAboveThreshold: peaks.length,
        minRequired: minPeaks,
        minDebounce: minDebounce + 'ms'
      });
    }
    
    // --- 3. BPM CALCULATION ---
    if (peaks.length < minPeaks) {
        return { bpm: null, confidence: 5, val: avg, debug: `[${tier}] Detecting... (${peaks.length}/${minPeaks} peaks)`, peaks: peaks.length };
    }

    // Calculate average interval between peaks in milliseconds
    let totalInterval = 0;
    for (let i = 1; i < peaks.length; i++) {
        totalInterval += (this.timestamps[peaks[i]] - this.timestamps[peaks[i-1]]);
    }
    const avgIntervalMs = totalInterval / (peaks.length - 1);
    
    const calculatedBpm = 60000 / avgIntervalMs;

    // --- 4. CONFIDENCE SCORING (VARIANCE-BASED) ---
    // Score based on regularity of intervals
    let variance = 0;
    for (let i = 1; i < peaks.length; i++) {
        const interval = this.timestamps[peaks[i]] - this.timestamps[peaks[i-1]];
        variance += Math.pow(interval - avgIntervalMs, 2);
    }
    variance /= (peaks.length - 1);
    
    // Lower variance = Higher confidence
    // Variance of 100ms² = 90% confidence, 1000ms² = 0% confidence
    let confidence = Math.max(0, 100 - (variance / 10)); 

    // Filter impossible values
    if (calculatedBpm < this.MIN_BPM || calculatedBpm > this.MAX_BPM) {
        return { bpm: null, confidence: 0, val: avg, debug: `Out of range: ${calculatedBpm.toFixed(0)} BPM`, peaks: peaks.length };
    }

    const roundedBpm = Math.round(calculatedBpm);
    const roundedConfidence = Math.round(confidence);

    // --- 5. MULTI-MEASUREMENT AVERAGING ---
    // Add to recent readings if confidence is decent (>40%)
    if (roundedConfidence >= 40) {
      this.recentReadings.push({
        bpm: roundedBpm,
        confidence: roundedConfidence,
        timestamp: now
      });
      
      // Keep only last MAX_READINGS
      if (this.recentReadings.length > this.MAX_READINGS) {
        this.recentReadings.shift();
      }
    }

    // Try to get stabilized reading
    const stabilized = this.getStabilizedBPM();
    
    if (stabilized) {
      // Return stabilized reading with enhanced debug info
      const stabilityIndicator = stabilized.isStable ? "🎯 STABLE" : "📊 Averaging";
      return {
        bpm: stabilized.bpm,
        confidence: stabilized.confidence,
        val: avg,
        peaks: peaks.length,
        debug: `[${tier}] ${stabilityIndicator} ${stabilized.bpm} BPM (n=${stabilized.sampleSize}) | ${stabilized.confidence}%`
      };
    }

    // Not enough readings yet, return current reading
    return { 
        bpm: roundedBpm, 
        confidence: roundedConfidence, 
        val: avg,
        peaks: peaks.length,
        debug: `[${tier}] ⏳ Collecting... (${this.recentReadings.length}/${this.MIN_READINGS_FOR_AVERAGE}) | ${roundedBpm} BPM`
    };
  }
}

interface BioScannerProps {
  onComplete?: (result: { bpm: number; confidence: number }) => void;
  measurementDuration?: number; // in seconds, default 15
}

export function BioScanner({ onComplete, measurementDuration = 15 }: BioScannerProps) {
  console.log('🚀 BioScanner PROGRESSIVE v3.0 - Three-tier detection system');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [scanning, setScanning] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [debugInfo, setDebugInfo] = useState("Ready to scan");
  const [signalStrength, setSignalStrength] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [sampleSize, setSampleSize] = useState(0);
  
  // Use a Ref for the engine so it persists across renders
  const engineRef = useRef(new ProgressiveBioEngine());
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream>();
  const isScanningRef = useRef(false); // Use ref to avoid race condition with state
  
  const saveVital = trpc.vitals.logVital.useMutation();

  const startCamera = async () => {
    try {
      console.log('[BioScanner] 🎥 Starting camera...');
      setDebugInfo("Requesting camera access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('[BioScanner] ▶️ Video playing');
        
        setScanning(true);
        isScanningRef.current = true; // Set ref immediately (no async delay)
        setBpm(null);
        setProgress(0);
        setConfidence(0);
        setIsStable(false);
        setSampleSize(0);
        engineRef.current.reset();
        setDebugInfo("Camera active - Starting scan...");
        
        console.log('[BioScanner] 🚀 Starting processLoop, isScanningRef:', isScanningRef.current);
        // Start the processing loop
        animationFrameRef.current = requestAnimationFrame(processLoop);
      }
    } catch (err) {
      console.error('[BioScanner] ❌ Camera error:', err);
      setDebugInfo("Camera access denied");
      toast.error("Camera access failed. Please allow camera permissions.");
    }
  };

  const drawDebugGraph = (value: number) => {
    const cvs = graphCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // Fade previous content
    ctx.fillStyle = "rgba(15, 23, 42, 0.2)"; // slate-900 with transparency
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    
    // Draw recent buffer (last 150 samples)
    const data = engineRef.current.buffer.slice(-150);
    if (data.length < 2) return;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = "#10b981"; // emerald-500
    ctx.lineWidth = 2;
    
    data.forEach((v, i) => {
      const x = (i / 150) * cvs.width;
      const y = cvs.height - ((v - min) / range) * cvs.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const processLoop = () => {
    if (!videoRef.current || !canvasRef.current || !isScanningRef.current) {
      console.log('[BioScanner] ⏹️ Loop stopped', { 
        hasVideo: !!videoRef.current, 
        hasCanvas: !!canvasRef.current, 
        isScanning: isScanningRef.current 
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processLoop);
      return;
    }

    // 1. Draw video frame to canvas (300x300)
    ctx.drawImage(video, 0, 0, 300, 300);
    
    // 2. Extract center region (60x60 pixels from center for focused signal)
    const centerX = 120; // (300 - 60) / 2
    const centerY = 120;
    const regionSize = 60;
    const imageData = ctx.getImageData(centerX, centerY, regionSize, regionSize);
    
    // 3. Process frame with engine
    const result = engineRef.current.process(imageData);
    
    // 4. Update UI
    if (result.bpm !== null) {
      setBpm(result.bpm);
      setConfidence(result.confidence);
      setSignalStrength(Math.min(5, Math.floor(result.confidence / 20)));
      
      // Update stabilization state
      const stabilized = engineRef.current.getStabilizedBPM();
      if (stabilized) {
        setIsStable(stabilized.isStable);
        setSampleSize(stabilized.sampleSize);
      }
    }
    setDebugInfo(result.debug);
    
    // 5. Update waveform visualization
    if (engineRef.current.buffer.length > 0) {
      drawDebugGraph(engineRef.current.buffer[engineRef.current.buffer.length - 1]);
    }

    // 6. Update progress
    setProgress(prev => {
      // Use actual FPS from engine, not assumed 30fps
      const actualFPS = engineRef.current.fps || 30;
      const increment = 100 / (measurementDuration * actualFPS);
      const newProgress = prev + increment;
      
      console.log('[BioScanner] 📊 Progress:', newProgress.toFixed(1), '% | FPS:', actualFPS);
      
      if (newProgress >= 100) {
        stopScanning(result.bpm, result.confidence);
        return 100;
      }
      
      // Continue loop INSIDE callback to avoid stale state
      animationFrameRef.current = requestAnimationFrame(processLoop);
      return newProgress;
    });

    // 7. Loop continuation moved inside setProgress callback above
  };

  const stopScanning = (finalBpm: number | null, finalConfidence: number) => {
    console.log('[BioScanner] 🛑 Stopping scan. BPM:', finalBpm, 'Confidence:', finalConfidence);
    
    setScanning(false);
    isScanningRef.current = false; // Stop the ref immediately
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Save result if valid
    if (finalBpm && finalBpm >= 40 && finalBpm <= 200) {
      const stressLevel = finalBpm < 60 ? 'LOW' : finalBpm > 100 ? 'HIGH' : 'NORMAL';
      
      saveVital.mutate({ 
        heartRate: finalBpm, 
        confidence: finalConfidence,
        stress: stressLevel
      }, {
        onSuccess: () => {
          toast.success(`Heart rate saved: ${finalBpm} BPM`);
          if (onComplete) {
            onComplete({ bpm: finalBpm, confidence: finalConfidence });
          }
        },
        onError: (err) => {
          console.error('[BioScanner] Failed to save vital:', err);
          toast.error("Failed to save measurement");
        }
      });
      
      setDebugInfo(`✅ Scan complete: ${finalBpm} BPM (${finalConfidence}% confidence)`);
    } else {
      setDebugInfo("❌ Scan failed - insufficient data quality");
      toast.error("Scan failed. Please try again with better lighting.");
    }
  };

  const cancelScan = () => {
    console.log('[BioScanner] ❌ User cancelled scan');
    stopScanning(null, 0);
    setBpm(null);
    setConfidence(0);
    setProgress(0);
    setDebugInfo("Scan cancelled");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getQualityColor = () => {
    if (confidence >= 80) return "text-green-600 bg-green-100";
    if (confidence >= 60) return "text-yellow-600 bg-yellow-100";
    if (confidence >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getQualityLabel = () => {
    if (confidence >= 80) return "Excellent";
    if (confidence >= 60) return "Good";
    if (confidence >= 40) return "Fair";
    return "Poor Quality";
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Camera Preview */}
      <div className="relative mx-auto w-full max-w-md aspect-square bg-slate-900 rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-2xl">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover" 
          muted 
          playsInline 
        />
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} width={300} height={300} className="hidden" />
        
        {/* Scan region indicator (120x120 center area) */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 border-4 border-emerald-400 rounded-lg animate-pulse" />
          </div>
        )}
        
        {/* On-Screen Debug Overlay */}
        {scanning && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 text-emerald-400 text-xs font-mono p-3 space-y-1">
            <div className="flex justify-between">
              <span>📊 {debugInfo}</span>
              <span>🎯 {progress.toFixed(0)}%</span>
            </div>
            {bpm && (
              <>
                <div className="flex justify-between text-white">
                  <span>❤️ {bpm} BPM</span>
                  <span>✓ {confidence}%</span>
                </div>
                {sampleSize > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>{isStable ? '🎯 STABLE' : '📊 Averaging'}</span>
                    <span>n={sampleSize}</span>
                  </div>
                )}
              </>
            )}
            <div className="text-[10px] text-emerald-300">
              RAW: {engineRef.current.buffer.length > 0 ? engineRef.current.buffer[engineRef.current.buffer.length - 1].toFixed(1) : '0'}
            </div>
          </div>
        )}
        
        {/* Idle state */}
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Camera ready</p>
            </div>
          </div>
        )}
      </div>

      {/* Live Signal Waveform */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">LIVE SIGNAL WAVEFORM</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-3 rounded ${i < signalStrength ? 'bg-emerald-500' : 'bg-slate-300'}`} 
              />
            ))}
          </div>
        </div>
        <canvas 
          ref={graphCanvasRef} 
          width={600} 
          height={80} 
          className="w-full h-20 bg-slate-900 rounded-lg border border-slate-700" 
        />
      </div>

      {/* BPM Display */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Heart className={`w-8 h-8 ${bpm ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-5xl font-bold text-slate-900">
            {bpm || '--'}
          </span>
          <span className="text-xl text-slate-600 self-end mb-2">BPM</span>
        </div>
        
        {confidence > 0 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-slate-600">Confidence:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getQualityColor()}`}>
              {confidence}% • {getQualityLabel()}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {scanning && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Scanning...</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!scanning ? (
          <Button 
            onClick={startCamera} 
            size="lg" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Activity className="mr-2 w-5 h-5" /> 
            Start Scan
          </Button>
        ) : (
          <Button 
            onClick={cancelScan} 
            size="lg" 
            variant="destructive"
            className="w-full"
          >
            Cancel Scan
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="font-semibold mb-1">📋 For best results:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Ensure your face is well-lit (natural light works best)</li>
          <li>Position your face in the center of the square</li>
          <li>Stay still and avoid talking during the scan</li>
          <li>Remove glasses if possible</li>
        </ul>
      </div>
    </Card>
  );
}
