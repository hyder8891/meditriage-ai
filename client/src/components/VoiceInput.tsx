import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: "ar-SA" | "en-US";
  placeholder?: string;
  className?: string;
}

export function VoiceInput({
  onTranscript,
  language = "ar-SA",
  placeholder,
  className = "",
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (final) {
        onTranscript(final.trim());
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      
      let errorMessage = "حدث خطأ في التعرف على الصوت";
      if (language === "en-US") {
        errorMessage = "Voice recognition error occurred";
      }

      switch (event.error) {
        case "no-speech":
          errorMessage = language === "ar-SA" 
            ? "لم يتم اكتشاف صوت. يرجى المحاولة مرة أخرى."
            : "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage = language === "ar-SA"
            ? "لم يتم العثور على ميكروفون. يرجى التحقق من إعدادات الميكروفون."
            : "No microphone found. Please check your microphone settings.";
          break;
        case "not-allowed":
          errorMessage = language === "ar-SA"
            ? "تم رفض الوصول إلى الميكروفون. يرجى السماح بالوصول إلى الميكروفون."
            : "Microphone access denied. Please allow microphone access.";
          break;
        case "network":
          errorMessage = language === "ar-SA"
            ? "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت."
            : "Network error. Please check your internet connection.";
          break;
      }

      toast({
        title: language === "ar-SA" ? "خطأ" : "Error",
        description: errorMessage,
        variant: "destructive",
      });

      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscript, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        toast({
          title: language === "ar-SA" ? "خطأ" : "Error",
          description:
            language === "ar-SA"
              ? "فشل بدء التعرف على الصوت"
              : "Failed to start voice recognition",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={toggleListening}
          className="shrink-0"
          title={
            isListening
              ? language === "ar-SA"
                ? "إيقاف التسجيل"
                : "Stop recording"
              : language === "ar-SA"
              ? "بدء التسجيل الصوتي"
              : "Start voice recording"
          }
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {language === "ar-SA" ? "جاري الاستماع..." : "Listening..."}
            </span>
          </div>
        )}
      </div>

      {interimTranscript && (
        <div className="text-sm text-muted-foreground italic p-2 bg-muted/50 rounded-md">
          {interimTranscript}
        </div>
      )}

      {placeholder && !isListening && !interimTranscript && (
        <div className="text-xs text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  );
}
