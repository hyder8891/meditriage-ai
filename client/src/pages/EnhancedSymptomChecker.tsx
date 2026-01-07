/**
 * EnhancedSymptomChecker - AI Assessment with Structured Outcome Display
 * 
 * Features:
 * - Strict language adherence throughout assessment
 * - Structured outcome panel below chat (not in chat messages)
 * - Intelligent clinic/hospital/pharmacy recommendations
 * - Concise, understandable results without references
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  Send,
  User,
  Loader2,
  Info,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { VoiceInput } from "@/components/VoiceInput";
import { StructuredOutcomePanel } from "@/components/StructuredOutcomePanel";
import { useLocation } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StructuredOutcome {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  severityLabel: string;
  primaryCondition: {
    name: string;
    confidence: number;
    briefExplanation: string;
  };
  otherConditions: Array<{
    name: string;
    confidence: number;
  }>;
  immediateActions: string[];
  requiredTests: Array<{
    name: string;
    reason: string;
    urgency: 'routine' | 'soon' | 'urgent';
  }>;
  specialistReferral?: {
    specialty: string;
    reason: string;
  };
  selfCareTips: string[];
  warningSignsToWatch: string[];
  recommendedFacilities: {
    clinics: any[];
    pharmacies: any[];
    hospitals: any[];
  };
}

export default function EnhancedSymptomChecker() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<any>(null);
  const [structuredOutcome, setStructuredOutcome] = useState<StructuredOutcome | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize conversation
  const startConversation = trpc.enhancedConversational.startConversation.useMutation({
    onSuccess: (data) => {
      setContext(data.context);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }]);
      setIsInitialized(true);
      setIsComplete(false);
      setStructuredOutcome(null);
    },
    onError: () => {
      toast.error(
        language === "ar"
          ? "فشل بدء المحادثة. يرجى إعادة تحميل الصفحة."
          : "Failed to start conversation. Please reload the page."
      );
    }
  });

  // Send message mutation
  const sendMessage = trpc.enhancedConversational.sendMessage.useMutation({
    onSuccess: (data: any) => {
      // Add assistant response to messages (only if not complete)
      if (data.conversationStage !== 'complete') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Assessment complete - show structured outcome
        setIsComplete(true);
        if (data.structuredOutcome) {
          setStructuredOutcome(data.structuredOutcome);
        }
      }
      
      // Save context for next request
      setContext(data.context);
    },
    onError: (error: any) => {
      toast.error(
        language === "ar"
          ? "حدث خطأ. يرجى المحاولة مرة أخرى."
          : "An error occurred. Please try again."
      );
      console.error("Send message error:", error);
    },
  });

  const handleSend = () => {
    if (!input.trim() || !isInitialized || isComplete) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");

    // Send to enhanced conversational router
    sendMessage.mutate({
      message: messageToSend,
      context: context,
      language: language === "ar" ? "ar" : "en"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setContext(null);
    setStructuredOutcome(null);
    setIsComplete(false);
    setIsInitialized(false);
    startConversation.mutate({ language: language === "ar" ? "ar" : "en" });
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (sendMessage.isPending || startConversation.isPending) {
      scrollToBottom();
    }
  }, [sendMessage.isPending, startConversation.isPending]);

  // Initialize on mount
  useEffect(() => {
    startConversation.mutate({ language: language === "ar" ? "ar" : "en" });
  }, []);

  const t = {
    title: language === "ar" ? "فاحص الأعراض الذكي" : "Smart Symptom Checker",
    subtitle: language === "ar"
      ? "احصل على تقييم طبي شامل مع توصيات العيادات"
      : "Get comprehensive medical assessment with clinic recommendations",
    placeholder: language === "ar"
      ? "اكتب أعراضك هنا..."
      : "Describe your symptoms here...",
    send: language === "ar" ? "إرسال" : "Send",
    typing: language === "ar" ? "جاري التحليل..." : "Analyzing...",
    restart: language === "ar" ? "بدء تقييم جديد" : "Start New Assessment",
    back: language === "ar" ? "رجوع" : "Back"
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Button>
            {isComplete && (
              <Button
                variant="outline"
                onClick={handleRestart}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t.restart}
              </Button>
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{t.title}</h1>
            </div>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        {/* Chat Card */}
        <Card className="shadow-xl border-2 mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {language === "ar" ? "محادثة التقييم الصحي" : "Health Assessment Chat"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar
                      className={`h-10 w-10 ${
                        message.role === "assistant"
                          ? "bg-primary/10"
                          : "bg-slate-200"
                      }`}
                    >
                      <AvatarFallback>
                        {message.role === "assistant" ? (
                          <Activity className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-slate-600" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`flex-1 max-w-[80%] ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-white ml-auto"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 px-2">
                        {message.timestamp.toLocaleTimeString(
                          language === "ar" ? "ar-IQ" : "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {(sendMessage.isPending || startConversation.isPending) && (
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 bg-primary/10">
                      <AvatarFallback>
                        <Activity className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {t.typing}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </ScrollArea>

            {/* Input Area */}
            {!isComplete && (
              <div className="border-t p-4 bg-white">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t.placeholder}
                        disabled={sendMessage.isPending || !isInitialized}
                        className="flex-1 rounded-xl border-2 focus:border-primary"
                        autoComplete="off"
                      />
                      <VoiceInput
                        onTranscript={(text) => setInput((prev) => prev + (prev ? " " : "") + text)}
                        language={language === "ar" ? "ar-SA" : "en-US"}
                        placeholder={
                          language === "ar"
                            ? "انقر على الميكروفون للتحدث"
                            : "Click microphone to speak"
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessage.isPending || !isInitialized}
                    className="rounded-xl px-6"
                    size="lg"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span className="ml-2 hidden sm:inline">{t.send}</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Disclaimer */}
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    {language === "ar"
                      ? "هذا التقييم للأغراض الإعلامية فقط ولا يحل محل الاستشارة الطبية المهنية."
                      : "This assessment is for informational purposes only and does not replace professional medical consultation."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Structured Outcome Panel - Displayed Below Chat */}
        {isComplete && structuredOutcome && (
          <StructuredOutcomePanel
            outcome={structuredOutcome}
            onBookAppointment={(clinicId) => {
              setLocation(`/patient/appointments?clinic=${clinicId}`);
            }}
            onCallEmergency={() => {
              window.location.href = "tel:122";
            }}
            onCallClinic={(phone) => {
              window.location.href = `tel:${phone}`;
            }}
          />
        )}
      </div>
    </div>
  );
}
