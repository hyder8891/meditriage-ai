/**
 * ModernSymptomChecker - Conversational AI Assessment
 * 
 * Chat-based UI for patient symptom assessment with:
 * - Message bubbles (user/assistant)
 * - Smart chip quick replies
 * - Visual triage display
 * - Action buttons (Find Doctor, Book Appointment)
 * - Arabic RTL support
 */

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, AlertTriangle, CheckCircle2, AlertCircle, Stethoscope, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { useLanguage } from "@/contexts/LanguageContext";

// ============================================================================
// Types
// ============================================================================

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface QuickReplyChip {
  text: string;
  textAr?: string;
  value: string;
}

interface AssessmentResponse {
  message: string;
  messageAr?: string;
  quickReplies?: QuickReplyChip[];
  triageLevel?: "green" | "yellow" | "red";
  triageReason?: string;
  triageReasonAr?: string;
  recommendations?: string[];
  recommendationsAr?: string[];
  differentialDiagnosis?: Array<{
    condition: string;
    conditionAr?: string;
    probability: number;
    reasoning: string;
  }>;
  showActions?: boolean;
  conversationStage: "greeting" | "gathering" | "analyzing" | "complete";
}

// ============================================================================
// Component
// ============================================================================

export default function ModernSymptomChecker() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AssessmentResponse | null>(null);
  const [context, setContext] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.conversational.sendMessage.useMutation();
  const startConversationMutation = trpc.conversational.startConversation.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Start conversation on mount
  useEffect(() => {
    handleStartConversation();
  }, []);

  const handleStartConversation = async () => {
    try {
      const response = await startConversationMutation.mutateAsync();
      setCurrentResponse(response);
      
      // Add assistant greeting to messages
      setMessages([{
        role: "assistant",
        content: response.message,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message to chat
    const userMessage: ConversationMessage = {
      role: "user",
      content: messageText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send to backend
      const response = await sendMessageMutation.mutateAsync({
        message: messageText,
        conversationHistory: messages,
        context
      });

      // Add assistant response to chat
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: response.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse(response);

      // Update context if needed
      // (In a real implementation, extract context from response)
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ConversationMessage = {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (chip: QuickReplyChip) => {
    handleSendMessage(chip.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isArabic ? "تقييم صحي بالذكاء الاصطناعي" : "AI Health Assessment"}
          </h1>
          <p className="text-gray-600">
            {isArabic 
              ? "أخبرني عن أعراضك، وسأساعدك في تقييم حالتك"
              : "Tell me about your symptoms, and I'll help assess your condition"
            }
          </p>
        </div>

        {/* Chat Container */}
        <Card className="bg-white shadow-xl border-0 overflow-hidden">
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}

            {/* Quick Reply Chips */}
            {currentResponse?.quickReplies && currentResponse.quickReplies.length > 0 && !isTyping && (
              <div className="flex flex-wrap gap-2 mt-4">
                {currentResponse.quickReplies.map((chip, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(chip)}
                    className="rounded-full"
                  >
                    {isArabic && chip.textAr ? chip.textAr : chip.text}
                  </Button>
                ))}
              </div>
            )}

            {/* Triage Display */}
            {currentResponse?.triageLevel && (
              <TriageDisplay
                level={currentResponse.triageLevel}
                reason={currentResponse.triageReason || ""}
                recommendations={currentResponse.recommendations || []}
                differentialDiagnosis={currentResponse.differentialDiagnosis || []}
              />
            )}

            {/* Action Buttons */}
            {currentResponse?.showActions && (
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setLocation("/patient/care-locator")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  {isArabic ? "ابحث عن طبيب" : "Find a Doctor"}
                </Button>
                <Button
                  onClick={() => setLocation("/patient/appointments")}
                  variant="outline"
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {isArabic ? "احجز موعد" : "Book Appointment"}
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isArabic ? "اكتب رسالتك..." : "Type your message..."}
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isTyping || !inputValue.trim()}
                size="icon"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Medical Disclaimer */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            ⚕️ {isArabic 
              ? "هذه أداة تقييم مدعومة بالذكاء الاصطناعي ولا تحل محل المشورة الطبية المهنية."
              : "This is an AI-powered assessment tool and does not replace professional medical advice."
            }
          </p>
          <p>
            {isArabic
              ? "في حالات الطوارئ، اتصل بخدمات الطوارئ المحلية فوراً."
              : "For emergencies, call your local emergency services immediately."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="text-sm">
          <Streamdown>{message.content}</Streamdown>
        </div>
        <div
          className={`text-xs mt-1 ${
            isUser ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

interface TriageDisplayProps {
  level: "green" | "yellow" | "red";
  reason: string;
  recommendations: string[];
  differentialDiagnosis: Array<{
    condition: string;
    probability: number;
    reasoning: string;
  }>;
}

function TriageDisplay({ level, reason, recommendations, differentialDiagnosis }: TriageDisplayProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const triageConfig = {
    green: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      label: "Routine Care",
      labelAr: "رعاية روتينية"
    },
    yellow: {
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      label: "Urgent Care",
      labelAr: "رعاية عاجلة"
    },
    red: {
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      label: "Emergency",
      labelAr: "طوارئ"
    }
  };

  const config = triageConfig[level];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 p-6 mt-6`}>
      {/* Triage Level */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-8 h-8 ${config.color}`} />
        <div>
          <h3 className={`text-xl font-bold ${config.color}`}>
            {isArabic ? config.labelAr : config.label}
          </h3>
          <p className="text-sm text-gray-600">{reason}</p>
        </div>
      </div>

      {/* Differential Diagnosis */}
      {differentialDiagnosis.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            {isArabic ? "الحالات المحتملة:" : "Possible Conditions:"}
          </h4>
          <div className="space-y-2">
            {differentialDiagnosis.map((dx, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{dx.condition}</span>
                  <Badge variant="secondary">{Math.round(dx.probability * 100)}%</Badge>
                </div>
                <p className="text-sm text-gray-600">{dx.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">
            {isArabic ? "التوصيات:" : "Recommendations:"}
          </h4>
          <ul className="space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
