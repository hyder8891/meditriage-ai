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
import { Loader2, Send, AlertTriangle, CheckCircle2, AlertCircle, Stethoscope, Calendar, Mic, MicOff } from "lucide-react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { AssessmentResultCard } from "@/components/AssessmentResultCard";

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

interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  reasoning?: string;
}

interface StructuredRecommendations {
  immediateActions?: string[];
  tests?: string[];
  imaging?: string[];
  referrals?: string[];
  lifestyle?: string[];
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
  mostLikelyCondition?: {
    condition: string;
    probability: number;
    reasoning: string;
  } | null;
  differentialDiagnosis?: DifferentialDiagnosis[];
  redFlags?: string[];
  structuredRecommendations?: StructuredRecommendations;
  resourceMatch?: {
    metadata: {
      name?: string;
      specialty?: string;
      location?: string;
      estimatedWaitTime?: number;
    };
    score: number;
  };
  evidence?: Array<{
    title: string;
    source: string;
    relevance?: number;
  }>;
  showActions?: boolean;
  conversationStage: "greeting" | "gathering" | "analyzing" | "complete";
  context?: any; // Context returned from backend
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
      const response = await startConversationMutation.mutateAsync({ language });
      setCurrentResponse(response);
      
      // Add assistant greeting to messages (use Arabic if available)
      setMessages([{
        role: "assistant",
        content: isArabic && response.messageAr ? response.messageAr : response.message,
        timestamp: Date.now()
      }]);

      // Initialize context if returned
      if (response.context) {
        setContext(response.context);
      }
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
      // Send to backend (use messages BEFORE adding current user message)
      // Don't use state 'messages' directly as it hasn't updated yet
      console.log("[Frontend] Sending to backend:", {
        message: messageText,
        conversationHistory: messages,
        context,
        language
      });
      const response = await sendMessageMutation.mutateAsync({
        message: messageText,
        conversationHistory: messages, // Use current messages (before adding user message)
        context,
        language
      });

      // Add assistant response to chat (use Arabic if available)
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: isArabic && response.messageAr ? response.messageAr : response.message,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse(response);

      // Update context with the returned context from backend
      // 🟢 CRITICAL: Must update state with NEW context from server
      if (response.context) {
        setContext(response.context);
      }
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
                className="rounded-full min-h-[44px] px-4 text-base md:text-sm md:min-h-[36px]"
              >
                    {isArabic && chip.textAr ? chip.textAr : chip.text}
                  </Button>
                ))}
              </div>
            )}

            {/* Assessment Result Card - Beautiful Structured Display */}
            {currentResponse?.triageLevel && currentResponse?.showActions && (
              <AssessmentResultCard
                result={{
                  triageLevel: currentResponse.triageLevel,
                  triageReason: currentResponse.triageReason,
                  triageReasonAr: currentResponse.triageReasonAr,
                  mostLikelyCondition: currentResponse.mostLikelyCondition,
                  differentialDiagnosis: currentResponse.differentialDiagnosis,
                  recommendations: currentResponse.recommendations,
                  recommendationsAr: currentResponse.recommendationsAr,
                  redFlags: currentResponse.redFlags,
                  structuredRecommendations: currentResponse.structuredRecommendations,
                  resourceMatch: currentResponse.resourceMatch,
                  evidence: currentResponse.evidence,
                }}
              />
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
                placeholder={isArabic ? "اكتب أعراضك هنا..." : "Type your symptoms here..."}
                disabled={isTyping}
                className="flex-1 min-h-[48px] text-base md:min-h-[40px] md:text-sm"
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isTyping || !inputValue.trim()}
                size="icon"
                className="min-h-[48px] min-w-[48px] md:min-h-[40px] md:min-w-[40px]"
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

// TriageDisplay has been replaced by AssessmentResultCard component for better structure and visuals
