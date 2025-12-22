import { useEffect, useRef, useState } from "react";
import { BioScannerEngine, type HeartRateResult } from "@/lib/rppg-engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Activity, Camera, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BioScannerProps {
  onComplete?: (result: HeartRateResult) => void;
  measurementDuration?: number; // in seconds, default 15
}

export function BioScanner({ onComplete, measurementDuration = 15 }: BioScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(new BioScannerEngine({ fps: 30, minWindowSeconds: 5 }));
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream>();

  const [scanning, setScanning] = useState(false);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const saveVital = trpc.vitals.logVital.useMutation({
    onSuccess: () => {
      toast.success("Vital signs recorded successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const startCamera = async () => {
    try {
      setError(null);
      
      // Request camera access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Reset engine and start scanning
        engineRef.current.reset();
        setScanning(true);
        setStartTime(Date.now());
        setProgress(0);
        setCurrentBpm(null);
        setQuality('poor');
        setConfidence(0);
        
        // Start the processing loop
        requestAnimationFrame(processFrame);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions and try again."
          : "Failed to access camera. Please check your device and try again."
      );
      toast.error("Camera access failed");
    }
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Draw video frame to canvas (use center region for better face detection)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Extract center 100x100 region (forehead/cheek area)
    const centerX = (videoWidth - 100) / 2;
    const centerY = (videoHeight - 100) / 2;
    
    ctx.drawImage(video, centerX, centerY, 100, 100, 0, 0, 100, 100);

    // Get pixel data from center region (where face should be)
    const imageData = ctx.getImageData(40, 40, 20, 20);

    // Process frame through rPPG engine
    engineRef.current.processFrame(imageData);

    // Calculate heart rate if enough data
    const result = engineRef.current.calculateHeartRate();
    
    if (result) {
      setCurrentBpm(result.bpm);
      setQuality(result.quality);
      setConfidence(result.confidence);
    }

    // Update progress based on time elapsed
    const elapsed = (Date.now() - startTime) / 1000;
    const progressPercent = Math.min((elapsed / measurementDuration) * 100, 100);
    setProgress(progressPercent);

    // Stop after measurement duration
    if (elapsed >= measurementDuration) {
      stopScanning(result);
    } else {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  };

  const stopScanning = (finalResult: HeartRateResult | null) => {
    setScanning(false);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = undefined;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Save results if valid (lowered threshold for better success rate)
    if (finalResult && finalResult.bpm > 0 && finalResult.confidence > 20) {
      const stressLevel = 
        finalResult.bpm > 100 ? "HIGH" : 
        finalResult.bpm < 60 ? "LOW" : 
        "NORMAL";

      saveVital.mutate({
        heartRate: finalResult.bpm,
        confidence: finalResult.confidence,
        stress: stressLevel,
        measurementDuration,
        // Include HRV metrics if available
        hrvRmssd: finalResult.hrv?.rmssd,
        hrvSdnn: finalResult.hrv?.sdnn,
        hrvPnn50: finalResult.hrv?.pnn50,
        hrvLfHfRatio: finalResult.hrv?.lfHfRatio,
        hrvStressScore: finalResult.hrv?.stressScore,
        hrvAnsBalance: finalResult.hrv?.ansBalance,
        deviceInfo: {
          browser: navigator.userAgent,
          cameraResolution: `${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`,
          userAgent: navigator.userAgent,
        },
        environmentalFactors: {
          lightingQuality: finalResult.quality,
          movementDetected: finalResult.signalStrength < 0.5,
          faceDetectionConfidence: finalResult.confidence,
        },
      });

      onComplete?.(finalResult);
    } else {
      const reason = !finalResult 
        ? "No signal detected" 
        : finalResult.bpm === 0 
        ? "No heartbeat detected" 
        : `Confidence too low (${finalResult.confidence}%)`;
      toast.error(`Measurement failed: ${reason}. Try better lighting and keep still.`);
    }
  };

  const cancelScan = () => {
    stopScanning(null);
    toast.info("Scan cancelled");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getQualityIcon = () => {
    switch (quality) {
      case 'excellent':
        return <CheckCircle2 className="text-green-500" />;
      case 'good':
        return <CheckCircle2 className="text-blue-500" />;
      case 'fair':
        return <AlertCircle className="text-yellow-500" />;
      case 'poor':
        return <XCircle className="text-red-500" />;
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case 'excellent':
        return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]';
      case 'good':
        return 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
      case 'fair':
        return 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]';
      case 'poor':
        return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    }
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Activity className="text-primary" />
          Optic-Vitals Bio-Scanner
        </h2>
        <p className="text-sm text-muted-foreground">
          Camera-based heart rate monitoring using rPPG technology
        </p>
      </div>

      {/* Video Display */}
      <div className={`relative mx-auto w-64 h-64 bg-black rounded-full overflow-hidden border-4 transition-all duration-300 ${scanning ? getQualityColor() : 'border-gray-600'}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover opacity-80"
          muted
          playsInline
        />

        {/* Overlay Grid for Sci-Fi Effect */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-2 grid-rows-2 h-full">
              <div className="border-r border-b border-emerald-500/30"></div>
              <div className="border-b border-emerald-500/30"></div>
              <div className="border-r border-emerald-500/30"></div>
              <div></div>
            </div>
            {/* Scanning line animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Camera icon when not scanning */}
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} width="100" height="100" className="hidden" />

      {/* Results Display */}
      {scanning && (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Heart className="text-red-500 animate-pulse w-8 h-8" />
              <span className="text-4xl font-bold">
                {currentBpm || "--"}
              </span>
              <span className="text-xl text-muted-foreground">BPM</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              {getQualityIcon()}
              <span className="capitalize">{quality} Quality</span>
              <span className="text-muted-foreground">• {confidence}% Confidence</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Analyzing blood flow...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground animate-pulse">
              Keep your face still and well-lit...
            </div>
            {currentBpm && currentBpm > 0 && (
              <div className="text-xs text-green-500 font-medium">
                ✓ Signal detected! Continue holding still...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!scanning ? (
          <Button onClick={startCamera} size="lg" className="w-full">
            <Activity className="mr-2" />
            Start Bio-Scan
          </Button>
        ) : (
          <Button onClick={cancelScan} variant="outline" size="lg" className="w-full">
            Cancel Scan
          </Button>
        )}
      </div>

      {/* Info Footer */}
      <div className="text-xs text-center text-muted-foreground space-y-1">
        <p>This feature uses your camera to detect subtle color changes in your skin.</p>
        <p>For best results, ensure good lighting and keep still during measurement.</p>
      </div>
    </Card>
  );
}
