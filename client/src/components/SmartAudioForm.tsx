/**
 * SmartAudioForm Component
 * Intelligent voice-to-form system that transcribes Arabic audio
 * and automatically fills form fields using AI field detection
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, Languages } from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  name: string;
  label: string;
  value: string;
  confidence: number;
}

interface SmartAudioFormProps {
  fields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'select';
    placeholder?: string;
  }>;
  onFieldsDetected: (fields: Record<string, string>) => void;
  language?: 'ar' | 'en';
  disabled?: boolean;
}

export function SmartAudioForm({
  fields,
  onFieldsDetected,
  language = 'ar',
  disabled = false,
}: SmartAudioFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [detectedFields, setDetectedFields] = useState<FormField[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>(language);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success(currentLanguage === 'ar' ? 'بدأ التسجيل...' : 'Recording started...');
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'فشل الوصول إلى الميكروفون' : 'Failed to access microphone');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call backend to process audio and extract fields
        const response = await fetch('/api/trpc/smartForm.extractFieldsFromAudio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type,
            language: currentLanguage,
            fieldSchema: fields.map(f => ({
              name: f.name,
              label: f.label,
              type: f.type || 'text'
            }))
          })
        });

        const data = await response.json();
        
        if (data.result?.data?.fields) {
          setDetectedFields(data.result.data.fields);
          setShowConfirmation(true);
          toast.success(currentLanguage === 'ar' ? 'تم اكتشاف الحقول بنجاح' : 'Fields detected successfully');
        } else {
          toast.error(currentLanguage === 'ar' ? 'فشل اكتشاف الحقول' : 'Failed to detect fields');
        }
      };
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'فشلت معالجة الصوت' : 'Audio processing failed');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmFields = () => {
    const fieldValues: Record<string, string> = {};
    detectedFields.forEach(field => {
      fieldValues[field.name] = field.value;
    });
    onFieldsDetected(fieldValues);
    setShowConfirmation(false);
    setDetectedFields([]);
    toast.success(currentLanguage === 'ar' ? 'تم ملء النموذج' : 'Form filled successfully');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              {currentLanguage === 'ar' ? 'ملء النموذج بالصوت' : 'Voice Form Filling'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'ar' 
                ? 'تحدث بحرية وسيتم ملء الحقول تلقائياً' 
                : 'Speak freely and fields will be filled automatically'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
            disabled={isRecording || disabled}
            className="gap-2"
          >
            <Languages className="w-4 h-4" />
            {currentLanguage === 'ar' ? 'EN' : 'عربي'}
          </Button>
        </div>

        {/* Recording Controls */}
        {!showConfirmation && (
          <div className="flex flex-col items-center gap-4 py-6">
            {isRecording && (
              <div className="text-4xl font-mono font-bold text-primary animate-pulse">
                {formatTime(recordingTime)}
              </div>
            )}

            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isProcessing}
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {currentLanguage === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </>
              ) : isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  {currentLanguage === 'ar' ? 'إيقاف التسجيل' : 'Stop Recording'}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  {currentLanguage === 'ar' ? 'ابدأ التسجيل' : 'Start Recording'}
                </>
              )}
            </Button>

            {!isRecording && !isProcessing && (
              <p className="text-xs text-center text-muted-foreground max-w-md">
                {currentLanguage === 'ar' 
                  ? 'مثال: "اسم المريض أحمد محمد، العمر 35 سنة، يعاني من صداع وحمى منذ يومين"'
                  : 'Example: "Patient name is Ahmed Mohammed, age 35, suffering from headache and fever for two days"'}
              </p>
            )}
          </div>
        )}

        {/* Confirmation View */}
        {showConfirmation && detectedFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">
                {currentLanguage === 'ar' ? 'تم اكتشاف الحقول التالية:' : 'Detected fields:'}
              </span>
            </div>

            <div className="space-y-2">
              {detectedFields.map((field, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{field.label}</p>
                    <p className="text-sm text-muted-foreground">{field.value}</p>
                  </div>
                  <Badge variant={field.confidence > 0.8 ? "default" : "secondary"}>
                    {Math.round(field.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={confirmFields} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {currentLanguage === 'ar' ? 'تأكيد وملء النموذج' : 'Confirm & Fill Form'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmation(false);
                  setDetectedFields([]);
                }}
              >
                {currentLanguage === 'ar' ? 'إعادة التسجيل' : 'Re-record'}
              </Button>
            </div>
          </div>
        )}

        {/* Expected Fields */}
        {!showConfirmation && !isRecording && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">
              {currentLanguage === 'ar' ? 'الحقول المطلوبة:' : 'Expected fields:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {fields.map((field, index) => (
                <Badge key={index} variant="outline">
                  {field.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
