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
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { TriageRecommendation } from "@/components/TriageRecommendation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Recommendations {
  urgencyLevel: "emergency" | "urgent" | "routine" | "self_care";
  urgencyDescription: string;
  possibleConditions: string[];
  recommendedActions: string[];
  specialistReferral?: string;
  redFlagSymptoms?: string[];
  selfCareInstructions?: string[];
  timelineForCare: string;
  emergencyWarning?: string;
}

export default function SymptomChecker() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize conversation on mount
  const startConversation = trpc.conversational.startConversation.useMutation({
    onSuccess: (data) => {
      setContext(data.context);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }]);
      setIsInitialized(true);
    },
    onError: () => {
      toast.error(
        language === "ar"
          ? "فشل بدء المحادثة. يرجى إعادة تحميل الصفحة."
          : "Failed to start conversation. Please reload the page."
      );
    }
  });

  // Send message mutation using conversational router
  const sendMessage = trpc.conversational.sendMessage.useMutation({
    onSuccess: (data) => {
      // Add assistant response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        },
      ]);
      
      // CRITICAL: Save context for next request
      setContext(data.context);
      
      // Handle final triage result
      if (data.triageResult) {
        const recommendations: Recommendations = {
          urgencyLevel: data.triageResult.urgency,
          urgencyDescription: `Assessment complete - ${data.triageResult.urgency} priority`,
          possibleConditions: data.triageResult.possibleConditions.map(c => c.name),
          recommendedActions: data.triageResult.recommendations,
          redFlagSymptoms: data.triageResult.redFlags,
          selfCareInstructions: [],
          timelineForCare: data.triageResult.urgency === "emergency" 
            ? "Seek immediate emergency care" 
            : data.triageResult.urgency === "urgent"
            ? "Seek care within 24 hours"
            : "Schedule appointment within a week",
          emergencyWarning: data.triageResult.urgency === "emergency" 
            ? "This appears to be a medical emergency. Please seek immediate care." 
            : undefined,
        };
        setRecommendations(recommendations);
      }
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
    if (!input.trim() || !isInitialized) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");

    // Send to conversational router with context
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize conversation on component mount
  useEffect(() => {
    startConversation.mutate({ language: language === "ar" ? "ar" : "en" });
  }, []); // Only run once on mount

  const t = {
    title: language === "ar" ? "فاحص الأعراض" : "Symptom Checker",
    subtitle:
      language === "ar"
        ? "احصل على تقييم فوري لأعراضك بواسطة الذكاء الاصطناعي"
        : "Get instant AI-powered assessment of your symptoms",
    placeholder:
      language === "ar"
        ? "اكتب أعراضك هنا..."
        : "Describe your symptoms here...",
    send: language === "ar" ? "إرسال" : "Send",
    typing: language === "ar" ? "جاري الكتابة..." : "Typing...",
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Chat Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {language === "ar"
                ? "محادثة التقييم الصحي"
                : "Health Assessment Chat"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
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
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
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
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4 bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.placeholder}
                  disabled={sendMessage.isPending || !isInitialized}
                  className="flex-1 rounded-xl border-2 focus:border-primary"
                />
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
                    ? "هذا التقييم للأغراض الإعلامية فقط ولا يحل محل الاستشارة الطبية المهنية. استشر دائماً مقدم الرعاية الصحية للحصول على التشخيص والعلاج المناسب."
                    : "This assessment is for informational purposes only and does not replace professional medical consultation. Always consult a healthcare provider for proper diagnosis and treatment."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Recommendations */}
        {recommendations && (
          <div className="mt-6">
            <TriageRecommendation
              recommendations={recommendations}
              onPrint={() => window.print()}
              onExport={() => {
                const dataStr = JSON.stringify(recommendations, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `triage-assessment-${new Date().toISOString()}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            />
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "ar" ? "كن محدداً" : "Be Specific"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "قدم تفاصيل واضحة حول أعراضك ومدتها"
                      : "Provide clear details about your symptoms and duration"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "ar" ? "كن صادقاً" : "Be Honest"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "شارك جميع الأعراض ذات الصلة للحصول على تقييم دقيق"
                      : "Share all relevant symptoms for accurate assessment"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === "ar" ? "حالة طوارئ؟" : "Emergency?"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "إذا كانت حالة طارئة، اتصل بالطوارئ فوراً"
                      : "If emergency, call emergency services immediately"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
