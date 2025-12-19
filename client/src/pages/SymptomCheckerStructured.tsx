import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { TriageRecommendation } from "@/components/TriageRecommendation";
import { Loader2, Stethoscope, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  text: string;
  textAr: string;
  type: "text" | "select";
  options?: Array<{
    value: string;
    label: string;
    labelAr: string;
  }>;
}

export default function SymptomCheckerStructured() {
  const { language } = useLanguage();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<any>(null);

  const startMutation = trpc.symptomCheckerStructured.startAssessment.useMutation();
  const assessMutation = trpc.symptomCheckerStructured.generateAssessment.useMutation();

  const t = {
    title: language === "ar" ? "فحص الأعراض" : "Symptom Checker",
    subtitle: language === "ar"
      ? "أجب عن 10 أسئلة بسيطة للحصول على تقييم طبي شامل"
      : "Answer 10 simple questions to get a comprehensive medical assessment",
    start: language === "ar" ? "ابدأ التقييم" : "Start Assessment",
    submit: language === "ar" ? "احصل على التقييم" : "Get Assessment",
    submitting: language === "ar" ? "جاري التحليل..." : "Analyzing...",
    required: language === "ar" ? "مطلوب" : "Required",
    optional: language === "ar" ? "اختياري" : "Optional",
    fillAll: language === "ar"
      ? "يرجى ملء جميع الحقول المطلوبة"
      : "Please fill all required fields",
    newAssessment: language === "ar" ? "تقييم جديد" : "New Assessment",
  };

  const handleStart = async () => {
    const result = await startMutation.mutateAsync({});
    setQuestions(result.questions);
    setStarted(true);
  };

  const handleSubmit = async () => {
    // Validate required fields (first 7 questions)
    const requiredFields = questions.slice(0, 7).map(q => q.id);
    const missingFields = requiredFields.filter(id => !answers[id] || answers[id].trim() === "");
    
    if (missingFields.length > 0) {
      toast.error(t.fillAll);
      return;
    }

    const result = await assessMutation.mutateAsync({
      answers,
      language,
    });

    if (result.success) {
      setAssessment(result);
      toast.success(language === "ar" ? "اكتمل التقييم" : "Assessment complete");
    } else {
      toast.error(language === "ar" ? "فشل التقييم" : "Assessment failed");
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleReset = () => {
    setAssessment(null);
    setAnswers({});
    setStarted(false);
  };

  if (assessment) {
    return (
      <div className="container mx-auto py-8">
        <TriageRecommendation
          recommendations={assessment}
          onPrint={() => window.print()}
          onExport={() => {
            const dataStr = JSON.stringify(assessment, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "assessment.json";
            link.click();
          }}
        />
        <div className="mt-6 text-center">
          <Button onClick={handleReset} variant="outline" size="lg">
            {t.newAssessment}
          </Button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Stethoscope className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl mb-2">{t.title}</CardTitle>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={handleStart}
              size="lg"
              disabled={startMutation.isPending}
              className="min-w-[200px]"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "ar" ? "جاري التحميل..." : "Loading..."}
                </>
              ) : (
                <>
                  {t.start}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            {t.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const isRequired = index < 7; // First 7 questions are required
              const questionText = language === "ar" ? question.textAr : question.text;

              return (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id} className="text-base">
                    {index + 1}. {questionText}
                    {isRequired && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {!isRequired && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t.optional})
                      </span>
                    )}
                  </Label>

                  {question.type === "select" && question.options ? (
                    <Select
                      value={answers[question.id] || ""}
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      <SelectTrigger id={question.id}>
                        <SelectValue placeholder={language === "ar" ? "اختر..." : "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {language === "ar" ? option.labelAr : option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      {question.id === "chiefComplaint" ||
                      question.id === "additionalSymptoms" ||
                      question.id === "triggers" ||
                      question.id === "medicalHistory" ||
                      question.id === "recentChanges" ? (
                        <Textarea
                          id={question.id}
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder={language === "ar" ? "اكتب هنا..." : "Type here..."}
                          rows={3}
                          className="resize-none"
                        />
                      ) : (
                        <Input
                          id={question.id}
                          type="text"
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder={language === "ar" ? "اكتب هنا..." : "Type here..."}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}

            <div className="pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={assessMutation.isPending}
                className="w-full"
                size="lg"
              >
                {assessMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    {t.submit}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
