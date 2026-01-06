import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Video, VideoOff, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface OpenRPPGScannerProps {
  onComplete?: (result: { heartRate: number; confidence: number }) => void;
}

export function OpenRPPGScanner({ onComplete }: OpenRPPGScannerProps) {
  const { language } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const signalBufferRef = useRef<number[]>([]);
  const frameCountRef = useRef<number>(0);

  const saveMutation = trpc.vitals.logVital.useMutation();

  // rPPG algorithm: Extract green channel signal from face region
  const extractGreenSignal = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number): number => {
    // Sample from center region (face area)
    const centerX = width / 2;
    const centerY = height / 2;
    const sampleWidth = width * 0.4;
    const sampleHeight = height * 0.4;
    
    const imageData = ctx.getImageData(
      centerX - sampleWidth / 2,
      centerY - sampleHeight / 2,
      sampleWidth,
      sampleHeight
    );
    
    let greenSum = 0;
    let pixelCount = 0;
    
    // Extract green channel (index 1 in RGBA)
    for (let i = 1; i < imageData.data.length; i += 4) {
      greenSum += imageData.data[i];
      pixelCount++;
    }
    
    return greenSum / pixelCount;
  }, []);

  // Calculate heart rate from signal buffer using FFT-like peak detection
  const calculateHeartRate = useCallback((signal: number[]): { bpm: number; confidence: number } => {
    if (signal.length < 60) {
      return { bpm: 0, confidence: 0 };
    }

    // Remove DC component (mean)
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const normalized = signal.map(v => v - mean);

    // Simple peak detection
    const peaks: number[] = [];
    for (let i = 1; i < normalized.length - 1; i++) {
      if (normalized[i] > normalized[i - 1] && normalized[i] > normalized[i + 1] && normalized[i] > 0) {
        peaks.push(i);
      }
    }

    if (peaks.length < 2) {
      return { bpm: 0, confidence: 0 };
    }

    // Calculate average interval between peaks
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Convert to BPM (assuming 10 fps sampling rate)
    const fps = 10;
    const bpm = Math.round((60 * fps) / avgInterval);

    // Calculate confidence based on interval consistency
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval; // Coefficient of variation
    const confidence = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));

    // Validate BPM range (40-200 is physiologically reasonable)
    if (bpm < 40 || bpm > 200) {
      return { bpm: 0, confidence: 0 };
    }

    return { bpm, confidence };
  }, []);

  const stopScanning = useCallback(() => {
    console.log("[OpenRPPGScanner] Stopping scan...");
    
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
    signalBufferRef.current = [];
    frameCountRef.current = 0;
  }, []);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      console.log("[OpenRPPGScanner] Component unmounting, cleaning up resources");
      // Stop any ongoing scanning
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setHeartRate(null);
      setConfidence(0);
      setProgress(0);
      setStatus("connecting");
      signalBufferRef.current = [];
      frameCountRef.current = 0;

      console.log("[OpenRPPGScanner] Requesting camera access...");

      // Request camera access (back camera for finger-based measurement)
      // Using environment (back) camera with torch for better blood flow detection
      let stream: MediaStream;
      try {
        // First try back camera with torch
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { exact: "environment" },
          },
        });
        
        // Try to enable torch/flashlight for better results
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        if (capabilities?.torch) {
          await (track as MediaStreamTrack & { applyConstraints: (constraints: MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> }) => Promise<void> }).applyConstraints({
            advanced: [{ torch: true }]
          });
          console.log("[OpenRPPGScanner] Torch enabled for better measurement");
        }
      } catch (backCamError) {
        console.log("[OpenRPPGScanner] Back camera not available, falling back to front camera");
        // Fallback to front camera if back camera fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      console.log("[OpenRPPGScanner] Camera started, beginning measurement...");
      setStatus("calibrating");
      setIsScanning(true);

      const targetFrames = 150; // 15 seconds at 10 fps

      // Start processing frames
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

            // Extract green channel signal
            const greenValue = extractGreenSignal(ctx, canvas.width, canvas.height);
            signalBufferRef.current.push(greenValue);
            frameCountRef.current++;

            const currentProgress = Math.min(100, (frameCountRef.current / targetFrames) * 100);
            setProgress(currentProgress);

            // Update status
            if (frameCountRef.current < 30) {
              setStatus("calibrating");
            } else {
              setStatus("measuring");
              
              // Calculate heart rate continuously after calibration
              const result = calculateHeartRate(signalBufferRef.current);
              if (result.bpm > 0) {
                setHeartRate(result.bpm);
                setConfidence(result.confidence);
              }
            }

            // Complete after target frames
            if (frameCountRef.current >= targetFrames) {
              const finalResult = calculateHeartRate(signalBufferRef.current);
              
              if (finalResult.bpm > 0 && finalResult.confidence > 30) {
                // Save to database
                saveMutation.mutate({
                  heartRate: finalResult.bpm,
                  confidence: finalResult.confidence,
                  stress: finalResult.bpm > 100 ? "HIGH" : finalResult.bpm < 60 ? "LOW" : "NORMAL",
                  measurementDuration: 15,
                });

                toast.success(
                  language === 'ar' 
                    ? `✅ اكتمل القياس: ${finalResult.bpm} نبضة/دقيقة (دقة ${finalResult.confidence}%)`
                    : `✅ Measurement complete: ${finalResult.bpm} BPM (${finalResult.confidence}% confidence)`
                );

                if (onComplete) {
                  onComplete({
                    heartRate: finalResult.bpm,
                    confidence: finalResult.confidence,
                  });
                }
              } else {
                toast.error(
                  language === 'ar'
                    ? "فشل القياس. يرجى المحاولة مرة أخرى مع إضاءة أفضل وحركة أقل."
                    : "Measurement failed. Please try again with better lighting and less movement."
                );
              }

              stopScanning();
            }
          }
        }
      }, 100); // Process at 10 fps
    } catch (err) {
      console.error("[OpenRPPGScanner] Failed to start scanning:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      setError(
        language === 'ar'
          ? "فشل الوصول إلى الكاميرا. يرجى منح أذونات الكاميرا."
          : errorMessage
      );
      toast.error(
        language === 'ar'
          ? "فشل الوصول إلى الكاميرا. يرجى منح أذونات الكاميرا."
          : "Failed to access camera. Please grant camera permissions."
      );
      stopScanning();
    }
  }, [onComplete, stopScanning, saveMutation, extractGreenSignal, calculateHeartRate, language]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const getStatusMessage = () => {
    const messages = {
      connecting: language === 'ar' ? "جاري الاتصال..." : "Connecting...",
      calibrating: language === 'ar' ? "جاري المعايرة... ابق ثابتاً" : "Calibrating... Keep still",
      measuring: language === 'ar' ? "جاري قياس معدل ضربات القلب..." : "Measuring heart rate...",
      stopped: language === 'ar' ? "توقف القياس" : "Measurement stopped",
      idle: language === 'ar' ? "جاهز لقياس معدل ضربات القلب" : "Ready to measure your heart rate",
    };
    return messages[status as keyof typeof messages] || messages.idle;
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-2">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            {language === 'ar' ? 'ماسح معدل ضربات القلب بالذكاء الاصطناعي' : 'AI Heart Rate Scanner'}
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'مدعوم بتقنية rPPG' : 'Powered by rPPG Technology'}
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
            <p className="text-white/80 text-lg font-medium">
              {language === 'ar' ? 'الكاميرا متوقفة' : 'Camera Off'}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {language === 'ar' ? 'انقر فوق ابدأ لبدء القياس' : 'Click Start to begin measurement'}
            </p>
          </div>
        )}
        {isScanning && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">
              {language === 'ar' ? 'مباشر' : 'LIVE'}
            </span>
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
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  {language === 'ar' ? 'معدل ضربات القلب' : 'Heart Rate'}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  {heartRate}
                </div>
                <div className="text-sm text-muted-foreground mt-1">BPM</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="text-xs text-muted-foreground font-medium mb-1">
                  {language === 'ar' ? 'الدقة' : 'Confidence'}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {confidence}
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
            {language === 'ar' ? 'بدء القياس' : 'Start Measurement'}
          </Button>
        ) : (
          <Button 
            onClick={stopScanning} 
            variant="destructive" 
            className="flex-1 h-12 text-lg font-semibold"
          >
            <VideoOff className="w-5 h-5 mr-2" />
            {language === 'ar' ? 'إيقاف القياس' : 'Stop Measurement'}
          </Button>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {language === 'ar' ? 'للحصول على أفضل النتائج:' : 'For Best Results:'}
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• {language === 'ar' ? 'ضع وجهك في مركز الإطار' : 'Position your face in the center of the frame'}</li>
          <li>• {language === 'ar' ? 'تأكد من الإضاءة الجيدة (الضوء الطبيعي أفضل)' : 'Ensure good lighting (natural light works best)'}</li>
          <li>• {language === 'ar' ? 'ابق ثابتاً أثناء القياس لمدة 15 ثانية' : 'Stay still during the 15-second measurement'}</li>
          <li>• {language === 'ar' ? 'تجنب الحركة الزائدة أو الكلام' : 'Avoid excessive movement or talking'}</li>
        </ul>
      </div>

      <div className="text-xs text-center text-muted-foreground">
        {language === 'ar'
          ? 'تستخدم هذه التقنية الذكاء الاصطناعي لاكتشاف التغيرات الدقيقة في اللون في وجهك الناتجة عن تدفق الدم'
          : 'This technology uses AI to detect subtle color changes in your face caused by blood flow'}
      </div>
    </Card>
  );
}
