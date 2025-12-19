import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { TriageRecommendation } from "@/components/TriageRecommendation";

interface Question {
  id: string;
  text: string;
  textAr: string;
  type: "single" | "multiple" | "text";
  options?: Array<{
    value: string;
    label: string;
    labelAr: string;
  }>;
  required: boolean;
}

interface Answer {
  questionId: string;
  question: string;
  questionAr: string;
  answer: string;
  answerLabel: string;
  answerLabelAr: string;
}

export default function SymptomCheckerStructured() {
  const [sessionId, setSessionId] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [answerHistory, setAnswerHistory] = useState<Answer[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(3);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<any>(null);
  const [language, setLanguage] = useState<"en" | "ar">("ar");

  const startMutation = trpc.symptomCheckerStructured.startAssessment.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCurrentQuestion(data.questions[0]);
      setTotalSteps(data.totalSteps);
      setCurrentStep(0);
      toast.success(language === "ar" ? "بدأ التقييم" : "Assessment started");
    },
    onError: () => {
      toast.error(language === "ar" ? "فشل بدء التقييم" : "Failed to start assessment");
    },
  });

  const nextQuestionMutation = trpc.symptomCheckerStructured.getNextQuestion.useMutation({
    onSuccess: (data) => {
      if (data.isComplete) {
        setIsComplete(true);
        generateFinalAssessment();
      } else {
        setCurrentQuestion(data.question);
        setCurrentStep(data.currentStep);
        setSelectedOption("");
      }
    },
    onError: () => {
      toast.error(language === "ar" ? "فشل في الحصول على السؤال التالي" : "Failed to get next question");
    },
  });

  const finalAssessmentMutation = trpc.symptomCheckerStructured.generateFinalAssessment.useMutation({
    onSuccess: (data) => {
      setFinalAssessment(data);
      toast.success(language === "ar" ? "اكتمل التقييم" : "Assessment complete");
    },
    onError: () => {
      toast.error(language === "ar" ? "فشل في إنشاء التقييم النهائي" : "Failed to generate final assessment");
    },
  });

  const startAssessment = () => {
    setAnswers({});
    setAnswerHistory([]);
    setCurrentStep(0);
    setIsComplete(false);
    setFinalAssessment(null);
    startMutation.mutate();
  };

  const handleAnswerSelect = (value: string, label: string, labelAr: string) => {
    setSelectedOption(value);
  };

  const handleNext = () => {
    if (!selectedOption || !currentQuestion) return;

    const selectedOpt = currentQuestion.options?.find(opt => opt.value === selectedOption);
    
    // Save answer
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selectedOption,
    };
    setAnswers(newAnswers);

    // Add to history
    setAnswerHistory([
      ...answerHistory,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        questionAr: currentQuestion.textAr,
        answer: selectedOption,
        answerLabel: selectedOpt?.label || selectedOption,
        answerLabelAr: selectedOpt?.labelAr || selectedOption,
      },
    ]);

    // Get next question
    nextQuestionMutation.mutate({
      sessionId,
      answers: newAnswers,
      currentStep,
    });
  };

  const handleBack = () => {
    if (answerHistory.length === 0) return;

    // Remove last answer
    const newHistory = answerHistory.slice(0, -1);
    setAnswerHistory(newHistory);

    const lastAnswer = answerHistory[answerHistory.length - 1];
    const newAnswers = { ...answers };
    delete newAnswers[lastAnswer.questionId];
    setAnswers(newAnswers);

    setCurrentStep(Math.max(0, currentStep - 1));
    setSelectedOption("");
  };

  const generateFinalAssessment = () => {
    finalAssessmentMutation.mutate({
      sessionId,
      answers,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      answers: answerHistory,
      assessment: finalAssessment,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `symptom-assessment-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(language === "ar" ? "تم التصدير بنجاح" : "Exported successfully");
  };

  if (!sessionId) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {language === "ar" ? "فاحص الأعراض" : "Symptom Checker"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === "ar"
                ? "أجب على بعض الأسئلة للحصول على تقييم طبي شخصي"
                : "Answer a few questions to get a personalized medical assessment"}
            </p>
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <Button
              variant={language === "ar" ? "default" : "outline"}
              onClick={() => setLanguage("ar")}
            >
              العربية
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              onClick={() => setLanguage("en")}
            >
              English
            </Button>
          </div>

          <Button size="lg" onClick={startAssessment} disabled={startMutation.isPending}>
            {startMutation.isPending
              ? language === "ar"
                ? "جاري البدء..."
                : "Starting..."
              : language === "ar"
              ? "ابدأ التقييم"
              : "Start Assessment"}
          </Button>

          <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-left">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {language === "ar" ? "إخلاء المسؤولية" : "Disclaimer"}
            </h3>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "هذه الأداة للأغراض التعليمية فقط ولا تحل محل المشورة الطبية المهنية. استشر دائمًا مقدم الرعاية الصحية للحصول على التشخيص والعلاج المناسبين."
                : "This tool is for educational purposes only and does not replace professional medical advice. Always consult a healthcare provider for proper diagnosis and treatment."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isComplete && finalAssessment) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {language === "ar" ? "نتائج التقييم" : "Assessment Results"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "بناءً على إجاباتك، إليك تقييمنا الطبي"
                : "Based on your answers, here is our medical assessment"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              {language === "ar" ? "طباعة" : "Print"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileText className="w-4 h-4 mr-2" />
              {language === "ar" ? "تصدير" : "Export"}
            </Button>
            <Button onClick={startAssessment}>
              {language === "ar" ? "تقييم جديد" : "New Assessment"}
            </Button>
          </div>
        </div>

        {/* Conversation Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === "ar" ? "ملخص المحادثة" : "Conversation Summary"}
          </h2>
          <div className="space-y-3">
            {answerHistory.map((answer, index) => (
              <div key={index} className="flex gap-4 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground mb-1">
                    {language === "ar" ? answer.questionAr : answer.question}
                  </p>
                  <p className="font-semibold">
                    {language === "ar" ? answer.answerLabelAr : answer.answerLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Final Assessment */}
        <TriageRecommendation recommendations={finalAssessment} />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {language === "ar"
              ? `السؤال ${currentStep + 1} من ${totalSteps}+`
              : `Question ${currentStep + 1} of ${totalSteps}+`}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(((currentStep + 1) / (totalSteps + 3)) * 100)}%
          </span>
        </div>
        <Progress value={((currentStep + 1) / (totalSteps + 3)) * 100} />
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">
            {language === "ar" ? currentQuestion.textAr : currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerSelect(option.value, option.label, option.labelAr)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedOption === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {language === "ar" ? option.labelAr : option.label}
                  </span>
                  {selectedOption === option.value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={answerHistory.length === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {language === "ar" ? "السابق" : "Back"}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!selectedOption || nextQuestionMutation.isPending}
        >
          {nextQuestionMutation.isPending
            ? language === "ar"
              ? "جاري التحميل..."
              : "Loading..."
            : language === "ar"
            ? "التالي"
            : "Next"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Answer History Summary */}
      {answerHistory.length > 0 && (
        <Card className="p-6 mt-8">
          <h3 className="font-semibold mb-4">
            {language === "ar" ? "إجاباتك حتى الآن" : "Your Answers So Far"}
          </h3>
          <div className="space-y-2">
            {answerHistory.slice(-3).map((answer, index) => (
              <div key={index} className="text-sm">
                <span className="text-muted-foreground">
                  {language === "ar" ? answer.questionAr : answer.question}:
                </span>{" "}
                <span className="font-medium">
                  {language === "ar" ? answer.answerLabelAr : answer.answerLabel}
                </span>
              </div>
            ))}
            {answerHistory.length > 3 && (
              <p className="text-xs text-muted-foreground">
                {language === "ar"
                  ? `+ ${answerHistory.length - 3} إجابات أخرى`
                  : `+ ${answerHistory.length - 3} more answers`}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
