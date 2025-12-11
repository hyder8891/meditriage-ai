import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Mic, MicOff, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function Triage() {
  const { strings, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatMutation = trpc.triage.chat.useMutation();
  const uploadAudioMutation = trpc.voice.upload.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % strings.loadingSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, strings.loadingSteps.length]);

  // Start conversation
  useEffect(() => {
    if (messages.length === 0) {
      handleSendMessage("Hello");
    }
  }, []);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        messages: [...messages, userMessage].map(m => ({
          role: m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system',
          content: m.content,
        })),
        language,
      });

      const content = typeof response.content === 'string' ? response.content : '';
      const assistantMessage: Message = {
        role: 'assistant',
        content,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Check if summary is ready
      const responseText = typeof response.content === 'string' ? response.content : '';
      if (responseText.includes('SUMMARY_READY')) {
        setTimeout(() => {
          setLocation('/advice');
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(strings.errors.api);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error(strings.voice.notSupported);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) return;

        // Upload audio
        const uploadResult = await uploadAudioMutation.mutateAsync({
          audioData: base64Audio,
          mimeType: 'audio/webm',
        });

        // Transcribe
        const transcription = await transcribeMutation.mutateAsync({
          audioUrl: uploadResult.url,
          language,
        });

        // Send transcribed text
        if (transcription.text) {
          setInput(transcription.text);
          await handleSendMessage(transcription.text);
        }
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      toast.error(strings.errors.generic);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = (response: string) => {
    handleSendMessage(response);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">{strings.triageTitle}</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'
            }`}
          >
            <Streamdown>{message.content}</Streamdown>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message chat-message-assistant flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {strings.loadingSteps[loadingStep]}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses */}
      {!isLoading && messages.length > 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickResponse(strings.quickResponses.yes)}
          >
            {strings.quickResponses.yes}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickResponse(strings.quickResponses.no)}
          >
            {strings.quickResponses.no}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickResponse(strings.quickResponses.unsure)}
          >
            {strings.quickResponses.unsure}
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={isRecording ? "recording-pulse" : ""}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={strings.inputPlaceholder}
            disabled={isLoading || isRecording}
            className="flex-1"
          />
          
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading || isRecording}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
