import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Video, VideoOff, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface OpenRPPGScannerProps {
  onComplete?: (result: { heartRate: number; confidence: number }) => void;
}

interface ScanResult {
  status: string;
  hr?: number;
  confidence?: number;
  progress?: number;
  message?: string;
}

export function OpenRPPGScanner({ onComplete }: OpenRPPGScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveMutation = trpc.vitals.logVital.useMutation();

  const stopScanning = useCallback(() => {
    console.log("[OpenRPPGScanner] Stopping scan...");
    
    // Stop WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "stop" }));
      wsRef.current.close();
    }
    wsRef.current = null;

    // Stop frame capture interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsScanning(false);
    setStatus("idle");
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setHeartRate(null);
      setConfidence(0);
      setProgress(0);
      setStatus("connecting");

      console.log("[OpenRPPGScanner] Requesting camera access...");

      // Request camera access (front camera for face detection)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      console.log("[OpenRPPGScanner] Camera started, connecting to WebSocket...");

      // Connect to WebSocket
      const ws = new WebSocket("ws://localhost:8001/ws/rppg");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[OpenRPPGScanner] WebSocket connected");
        setStatus("calibrating");
        setIsScanning(true);
        ws.send(JSON.stringify({ action: "start" }));

        // Start sending frames
        intervalRef.current = setInterval(() => {
          if (
            canvasRef.current &&
            videoRef.current &&
            videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
          ) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);

              // Convert to base64
              const frameData = canvas.toDataURL("image/jpeg", 0.8);

              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    frame: frameData,
                    timestamp: Date.now(),
                  })
                );
              }
            }
          }
        }, 100); // Send frame every 100ms (10 fps)
      };

      ws.onmessage = (event) => {
        try {
          const result: ScanResult = JSON.parse(event.data);
          console.log("[OpenRPPGScanner] Received:", result);

          setStatus(result.status);
          if (result.progress !== undefined) {
            setProgress(result.progress);
          }
          if (result.hr !== undefined && result.hr > 0) {
            setHeartRate(result.hr);
          }
          if (result.confidence !== undefined) {
            setConfidence(result.confidence);
          }

          // Auto-complete after reaching 100%
          if (result.progress && result.progress >= 100 && result.hr) {
            setTimeout(() => {
              // Save to database
              if (result.hr && result.confidence !== undefined) {
                saveMutation.mutate({
                  heartRate: result.hr,
                  confidence: result.confidence,
                  stress: result.hr > 100 ? "HIGH" : result.hr < 60 ? "LOW" : "NORMAL",
                  measurementDuration: 15,
                });

                toast.success(`✅ Measurement complete: ${result.hr} BPM (${Math.round(result.confidence * 100)}% confidence)`);

                if (onComplete) {
                  onComplete({
                    heartRate: result.hr,
                    confidence: result.confidence,
                  });
                }
              }
              stopScanning();
            }, 1000);
          }
        } catch (err) {
          console.error("[OpenRPPGScanner] Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[OpenRPPGScanner] WebSocket error:", err);
        setError("Connection error. Make sure the rPPG service is running on port 8001.");
        toast.error("Failed to connect to heart rate analysis service");
        stopScanning();
      };

      ws.onclose = () => {
        console.log("[OpenRPPGScanner] WebSocket closed");
      };
    } catch (err) {
      console.error("[OpenRPPGScanner] Failed to start scanning:", err);
      setError(
        err instanceof Error ? err.message : "Failed to access camera"
      );
      toast.error("Failed to access camera. Please grant camera permissions.");
      stopScanning();
    }
  }, [onComplete, stopScanning, saveMutation]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const getStatusMessage = () => {
    switch (status) {
      case "connecting":
        return "Connecting to AI service...";
      case "calibrating":
        return "Calibrating... Keep still and face the camera";
      case "measuring":
        return "Measuring heart rate...";
      case "stopped":
        return "Measurement stopped";
      default:
        return "Ready to measure your heart rate";
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-2">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            AI Heart Rate Scanner
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Powered by Open-rPPG • University of Washington Research
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm">
            <div className="p-6 bg-white/10 rounded-full mb-4">
              <VideoOff className="w-16 h-16 text-white/70" />
            </div>
            <p className="text-white/80 text-lg font-medium">Camera Off</p>
            <p className="text-white/60 text-sm mt-2">Click Start to begin measurement</p>
          </div>
        )}
        {isScanning && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">LIVE</span>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {isScanning && (
        <div className="space-y-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                {status === "calibrating" && <Loader2 className="w-4 h-4 animate-spin" />}
                {getStatusMessage()}
              </span>
              <span className="text-primary font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {heartRate && heartRate > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                <div className="text-xs text-muted-foreground font-medium mb-1">Heart Rate</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  {heartRate}
                </div>
                <div className="text-sm text-muted-foreground mt-1">BPM</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="text-xs text-muted-foreground font-medium mb-1">Confidence</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {Math.round(confidence * 100)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">%</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!isScanning ? (
          <Button 
            onClick={startScanning} 
            className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            <Video className="w-5 h-5 mr-2" />
            Start Measurement
          </Button>
        ) : (
          <Button 
            onClick={stopScanning} 
            variant="destructive" 
            className="flex-1 h-12 text-lg font-semibold"
          >
            <VideoOff className="w-5 h-5 mr-2" />
            Stop Measurement
          </Button>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          For Best Results:
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Position your face in the center of the frame</li>
          <li>• Ensure good lighting (natural light works best)</li>
          <li>• Stay still during the 15-second measurement</li>
          <li>• Avoid excessive movement or talking</li>
        </ul>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        This technology uses AI to detect subtle color changes in your face caused by blood flow
      </div>
    </Card>
  );
}
