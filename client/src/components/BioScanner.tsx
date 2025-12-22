import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Activity, RefreshCw, Camera } from "lucide-react";
import { toast } from "sonner";

// 🧠 INTERNAL MATH ENGINE (No external file dependencies)
class InternalBioEngine {
  buffer: number[] = [];
  times: number[] = [];
  lastFrameTime = 0;

  process(imageData: ImageData): { bpm: number | null; confidence: number; debug: string } {
    const now = performance.now();
    
    // 1. Get Green Average from center region
    let sum = 0;
    const data = imageData.data;
    const sampleEvery = 4; // Sample every 4th pixel for performance
    
    for (let i = 0; i < data.length; i += sampleEvery * 4) {
      sum += data[i + 1]; // Green channel
    }
    const avg = sum / (data.length / (sampleEvery * 4));

    // 2. Add to buffer
    this.buffer.push(avg);
    this.times.push(now);

    // Keep last 450 samples (~15 seconds at 30fps)
    if (this.buffer.length > 450) {
      this.buffer.shift();
      this.times.shift();
    }

    // 3. Calculate BPM
    // Need at least 90 samples (~3 seconds)
    if (this.buffer.length < 90) {
      return { bpm: null, confidence: 0, debug: `Gathering data... ${this.buffer.length}/90` };
    }

    // Normalize signal
    const mean = this.buffer.reduce((a, b) => a + b) / this.buffer.length;
    const stdDev = Math.sqrt(
      this.buffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.buffer.length
    );
    
    // Check if signal has enough variation
    if (stdDev < 0.5) {
      return { bpm: null, confidence: 0, debug: `Signal too flat (stdDev: ${stdDev.toFixed(2)})` };
    }

    const normalized = this.buffer.map(v => (v - mean) / stdDev);

    // Count Peaks (Zero Crossing Method)
    let peaks = 0;
    let lastPeakIndex = -10; // Prevent counting same peak multiple times
    
    for (let i = 2; i < normalized.length - 1; i++) {
      // Peak detection: current value is higher than neighbors and crosses threshold
      if (
        normalized[i] > 0.3 && // Threshold
        normalized[i] > normalized[i - 1] &&
        normalized[i] > normalized[i + 1] &&
        i - lastPeakIndex > 15 // Minimum distance between peaks (prevents double-counting)
      ) {
        peaks++;
        lastPeakIndex = i;
      }
    }

    // Calculate time duration in seconds
    const durationSec = (this.times[this.times.length - 1] - this.times[0]) / 1000;
    
    if (durationSec < 2) {
      return { bpm: null, confidence: 0, debug: "Not enough time data" };
    }

    // BPM Formula: (peaks / duration) * 60
    const bpm = (peaks / durationSec) * 60;

    // Filter unrealistic values
    if (bpm < 40 || bpm > 200) {
      return { bpm: null, confidence: 0, debug: `Out of range: ${bpm.toFixed(0)} BPM` };
    }

    // Calculate confidence based on signal quality
    const confidence = Math.min(100, Math.floor((stdDev / 5) * 100));

    return { 
      bpm: Math.round(bpm), 
      confidence,
      debug: `✓ Valid (${peaks} peaks, ${durationSec.toFixed(1)}s, stdDev: ${stdDev.toFixed(2)})` 
    };
  }

  reset() {
    this.buffer = [];
    this.times = [];
    this.lastFrameTime = 0;
  }
}

interface BioScannerProps {
  onComplete?: (result: { bpm: number; confidence: number }) => void;
  measurementDuration?: number; // in seconds, default 15
}

export function BioScanner({ onComplete, measurementDuration = 15 }: BioScannerProps) {
  console.log('🚀 BioScanner MONOLITH v3.0 loaded - Built-in engine with on-screen debug');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [scanning, setScanning] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [debugInfo, setDebugInfo] = useState("Ready to scan");
  const [signalStrength, setSignalStrength] = useState(0);
  
  // Use a Ref for the engine so it persists across renders
  const engineRef = useRef(new InternalBioEngine());
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream>();
  
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
        setBpm(null);
        setProgress(0);
        setConfidence(0);
        engineRef.current.reset();
        setDebugInfo("Camera active - Starting scan...");
        
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
    if (!videoRef.current || !canvasRef.current || !scanning) {
      console.log('[BioScanner] ⏹️ Loop stopped');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processLoop);
      return;
    }

    // 1. Draw video frame to canvas (scaled down for performance)
    ctx.drawImage(video, 0, 0, 100, 100);
    
    // 2. Extract center region (50x50 pixels from center)
    const centerX = 25;
    const centerY = 25;
    const regionSize = 50;
    const imageData = ctx.getImageData(centerX, centerY, regionSize, regionSize);
    
    // 3. Process frame with engine
    const result = engineRef.current.process(imageData);
    
    // 4. Update UI
    if (result.bpm !== null) {
      setBpm(result.bpm);
      setConfidence(result.confidence);
      setSignalStrength(Math.min(5, Math.floor(result.confidence / 20)));
    }
    setDebugInfo(result.debug);
    
    // 5. Update waveform visualization
    if (engineRef.current.buffer.length > 0) {
      drawDebugGraph(engineRef.current.buffer[engineRef.current.buffer.length - 1]);
    }

    // 6. Update progress
    setProgress(prev => {
      const newProgress = prev + (100 / (measurementDuration * 30)); // Assuming 30fps
      
      if (newProgress >= 100) {
        stopScanning(result.bpm, result.confidence);
        return 100;
      }
      return newProgress;
    });

    // 7. Continue loop
    if (progress < 100) {
      animationFrameRef.current = requestAnimationFrame(processLoop);
    }
  };

  const stopScanning = (finalBpm: number | null, finalConfidence: number) => {
    console.log('[BioScanner] 🛑 Stopping scan. BPM:', finalBpm, 'Confidence:', finalConfidence);
    
    setScanning(false);
    
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
        <canvas ref={canvasRef} width={100} height={100} className="hidden" />
        
        {/* Scan region indicator */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-4 border-emerald-400 rounded-full animate-pulse" />
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
              <div className="flex justify-between text-white">
                <span>❤️ {bpm} BPM</span>
                <span>✓ {confidence}%</span>
              </div>
            )}
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
          <li>Position your face in the center of the circle</li>
          <li>Stay still and avoid talking during the scan</li>
          <li>Remove glasses if possible</li>
        </ul>
      </div>
    </Card>
  );
}
