/**
 * Audio Input Component
 * Native audio recording for Iraqi Arabic symptom input
 * Leverages Gemini Flash's native audio processing (no transcription needed)
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Trash2, Upload, Languages } from 'lucide-react';
import { toast } from 'sonner';

interface AudioInputProps {
  onAudioCapture: (audioBlob: Blob, audioUrl: string) => void;
  onClear?: () => void;
  initialLanguage?: 'ar' | 'en';
  maxDuration?: number; // seconds
  maxFileSizeMB?: number; // megabytes
  disabled?: boolean;
  showLanguageToggle?: boolean;
}

// Audio validation constants
const MAX_FILE_SIZE_MB = 16; // Gemini Flash limit
const MAX_DURATION_SECONDS = 180; // 3 minutes
const ALLOWED_FORMATS = ['audio/webm', 'audio/mp4', 'audio/mp3', 'audio/wav', 'audio/mpeg'];

export function AudioInput({
  onAudioCapture,
  onClear,
  initialLanguage = 'ar',
  maxDuration = 120, // 2 minutes default
  maxFileSizeMB = MAX_FILE_SIZE_MB,
  disabled = false,
  showLanguageToggle = true,
}: AudioInputProps) {
  const [language, setLanguage] = useState<'ar' | 'en'>(initialLanguage);
  
  // Update language when initialLanguage prop changes
  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    console.log('[AudioInput] Starting recording...');
    try {
      // Request microphone permission
      console.log('[AudioInput] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      console.log('[AudioInput] Microphone access granted');
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      console.log('[AudioInput] Creating MediaRecorder with mimeType:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        console.log('[AudioInput] Data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('[AudioInput] Total chunks:', audioChunksRef.current.length);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('[AudioInput] Recording stopped, chunks collected:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[AudioInput] Audio blob created, size:', audioBlob.size, 'bytes');
        
        // Validate audio quality
        const validation = validateAudio(audioBlob, recordingTime);
        if (!validation.valid) {
          toast.error(
            language === 'ar'
              ? `خطأ في التسجيل: ${validation.error}`
              : `Recording error: ${validation.error}`
          );
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        const url = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        onAudioCapture(audioBlob, url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      console.log('[AudioInput] Starting MediaRecorder...');
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      console.log('[AudioInput] Recording started successfully');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
            toast.warning(
              language === 'ar' 
                ? `تم الوصول إلى الحد الأقصى للمدة (${maxDuration} ثانية)`
                : `Maximum duration reached (${maxDuration} seconds)`
            );
          }
          
          return newTime;
        });
      }, 1000);

      toast.success(
        language === 'ar' 
          ? 'بدأ التسجيل... تحدث بوضوح عن أعراضك'
          : 'Recording started... Speak clearly about your symptoms'
      );

    } catch (error) {
      console.error('[AudioInput] Error starting recording:', error);
      console.error('[AudioInput] Error name:', (error as Error).name);
      console.error('[AudioInput] Error message:', (error as Error).message);
      toast.error(
        language === 'ar'
          ? `فشل الوصول إلى الميكروفون: ${(error as Error).message}`
          : `Failed to access microphone: ${(error as Error).message}`
      );
    }
  };

  // Stop recording
  const stopRecording = () => {
    console.log('[AudioInput] Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[AudioInput] MediaRecorder state:', mediaRecorderRef.current.state);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.success(
        language === 'ar'
          ? 'تم إيقاف التسجيل'
          : 'Recording stopped'
      );
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast.info(language === 'ar' ? 'استئناف التسجيل' : 'Recording resumed');
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast.info(language === 'ar' ? 'تم إيقاف التسجيل مؤقتاً' : 'Recording paused');
      }
    }
  };

  // Play/Pause audio
  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Clear recording
  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (onClear) onClear();
    
    toast.info(language === 'ar' ? 'تم حذف التسجيل' : 'Recording cleared');
  };

  // Validate audio quality
  const validateAudio = (blob: Blob, duration: number): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = blob.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      return {
        valid: false,
        error: language === 'ar'
          ? `حجم الملف كبير جداً (${fileSizeMB.toFixed(1)}MB). الحد الأقصى ${maxFileSizeMB}MB`
          : `File too large (${fileSizeMB.toFixed(1)}MB). Maximum ${maxFileSizeMB}MB`
      };
    }

    // Check duration
    if (duration > MAX_DURATION_SECONDS) {
      return {
        valid: false,
        error: language === 'ar'
          ? `التسجيل طويل جداً (${duration}s). الحد الأقصى ${MAX_DURATION_SECONDS}s`
          : `Recording too long (${duration}s). Maximum ${MAX_DURATION_SECONDS}s`
      };
    }

    // Check format
    if (!ALLOWED_FORMATS.includes(blob.type)) {
      return {
        valid: false,
        error: language === 'ar'
          ? `تنسيق غير مدعوم: ${blob.type}`
          : `Unsupported format: ${blob.type}`
      };
    }

    // Check minimum duration (at least 1 second)
    if (duration < 1) {
      return {
        valid: false,
        error: language === 'ar'
          ? 'التسجيل قصير جداً. يجب أن يكون ثانية واحدة على الأقل'
          : 'Recording too short. Must be at least 1 second'
      };
    }

    return { valid: true };
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'إدخال صوتي' : 'Voice Input'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'سجل الأعراض باللهجة العراقية' 
                : 'Record symptoms in English'}
            </p>
          </div>
          {showLanguageToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              disabled={isRecording || disabled}
              className="gap-2"
            >
              <Languages className="w-4 h-4" />
              {language === 'ar' ? 'EN' : 'عربي'}
            </Button>
          )}
          <div className="text-2xl font-mono font-bold text-primary">
            {formatTime(recordingTime)}
          </div>
        </div>

        {/* Recording Controls */}
        {!audioUrl && (
          <div className="flex flex-col items-center gap-4 py-8">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={disabled}
                className="h-20 w-20 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <div className="flex gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={togglePause}
                  className="h-16 w-16 rounded-full"
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-16 w-16 rounded-full"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </div>
            )}

            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">
                  {isPaused 
                    ? (language === 'ar' ? 'متوقف مؤقتاً' : 'Paused')
                    : (language === 'ar' ? 'جاري التسجيل...' : 'Recording...')}
                </span>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground max-w-sm">
              {language === 'ar'
                ? 'اضغط على زر الميكروفون وتحدث بوضوح. صف أعراضك، متى بدأت، وشدتها.'
                : 'Press the microphone button and speak clearly. Describe your symptoms, when they started, and their severity.'}
            </p>
          </div>
        )}

        {/* Playback Controls */}
        {audioUrl && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={togglePlayback}
                className="h-16 w-16 rounded-full"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={clearRecording}
                className="h-16 w-16 rounded-full"
              >
                <Trash2 className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">
                {language === 'ar' ? 'التسجيل جاهز' : 'Recording ready'}
              </span>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              {language === 'ar'
                ? 'استمع إلى التسجيل أو احذفه لتسجيل مرة أخرى'
                : 'Listen to your recording or clear to record again'}
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold">
            {language === 'ar' ? '💡 نصائح للتسجيل الجيد:' : '💡 Tips for good recording:'}
          </h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>
              {language === 'ar'
                ? '• تحدث في مكان هادئ بدون ضوضاء في الخلفية'
                : '• Speak in a quiet place without background noise'}
            </li>
            <li>
              {language === 'ar'
                ? '• اقترب من الميكروفون (15-20 سم)'
                : '• Stay close to the microphone (15-20 cm)'}
            </li>
            <li>
              {language === 'ar'
                ? '• تحدث بوضوح وبسرعة طبيعية'
                : '• Speak clearly at a natural pace'}
            </li>
            <li>
              {language === 'ar'
                ? '• اذكر جميع الأعراض ومدتها وشدتها'
                : '• Mention all symptoms, their duration, and severity'}
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
