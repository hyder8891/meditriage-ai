import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Download,
  Sparkles,
  Lightbulb,
  FileText,
  Stethoscope,
  ClipboardList,
  HelpCircle,
  ArrowRight,
  Brain,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Streamdown } from "streamdown";

function SecondOpinionPrepContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [currentTreatment, setCurrentTreatment] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [customConcern, setCustomConcern] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  
  // Generated questions
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Common concerns
  const commonConcerns = [
    { id: "diagnosis-accuracy", label: language === 'ar' ? 'دقة التشخيص' : 'Diagnosis accuracy' },
    { id: "treatment-options", label: language === 'ar' ? 'خيارات العلاج البديلة' : 'Alternative treatment options' },
    { id: "side-effects", label: language === 'ar' ? 'الآثار الجانبية' : 'Side effects' },
    { id: "prognosis", label: language === 'ar' ? 'التوقعات المستقبلية' : 'Prognosis/Outlook' },
    { id: "surgery-necessity", label: language === 'ar' ? 'ضرورة الجراحة' : 'Surgery necessity' },
    { id: "medication-duration", label: language === 'ar' ? 'مدة العلاج' : 'Treatment duration' },
    { id: "lifestyle-changes", label: language === 'ar' ? 'تغييرات نمط الحياة' : 'Lifestyle changes' },
    { id: "cost-coverage", label: language === 'ar' ? 'التكلفة والتغطية' : 'Cost and coverage' },
  ];

  // Generate questions mutation
  const generateQuestionsMutation = trpc.medicalAssistant.generateSecondOpinionQuestions.useMutation({
    onSuccess: (data) => {
      setGeneratedQuestions(data.questions || []);
      setSelectedQuestions(data.questions || []);
      setIsGenerating(false);
      setStep(3);
    },
    onError: (error) => {
      toast.error(language === 'ar' ? 'فشل إنشاء الأسئلة' : 'Failed to generate questions');
      setIsGenerating(false);
    },
  });

  // Handle concern toggle
  const toggleConcern = (concernId: string) => {
    if (concerns.includes(concernId)) {
      setConcerns(concerns.filter(c => c !== concernId));
    } else {
      setConcerns([...concerns, concernId]);
    }
  };

  // Add custom concern
  const addCustomConcern = () => {
    if (customConcern.trim() && !concerns.includes(customConcern.trim())) {
      setConcerns([...concerns, customConcern.trim()]);
      setCustomConcern("");
    }
  };

  // Generate questions
  const handleGenerateQuestions = () => {
    if (!diagnosis.trim()) {
      toast.error(language === 'ar' ? 'الرجاء إدخال التشخيص' : 'Please enter your diagnosis');
      return;
    }
    setIsGenerating(true);
    generateQuestionsMutation.mutate({
      diagnosis,
      symptoms,
      currentTreatment,
      concerns: concerns.map(c => {
        const found = commonConcerns.find(cc => cc.id === c);
        return found ? found.label : c;
      }),
      additionalInfo,
      language,
    });
  };

  // Toggle question selection
  const toggleQuestion = (question: string) => {
    if (selectedQuestions.includes(question)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== question));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  // Copy questions to clipboard
  const copyQuestions = () => {
    const text = selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(language === 'ar' ? 'تم نسخ الأسئلة' : 'Questions copied to clipboard');
  };

  // Download questions
  const downloadQuestions = () => {
    const text = `${language === 'ar' ? 'أسئلة للرأي الثاني' : 'Second Opinion Questions'}\n\n` +
      `${language === 'ar' ? 'التشخيص' : 'Diagnosis'}: ${diagnosis}\n\n` +
      `${language === 'ar' ? 'الأسئلة' : 'Questions'}:\n` +
      selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'second-opinion-questions.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'تحضير للرأي الثاني' : 'Second Opinion Prep'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'جهّز أسئلتك قبل استشارة طبيب آخر'
              : 'Prepare your questions before consulting another doctor'}
          </p>
        </div>
        <MessageSquare className="w-10 h-10 text-rose-500" />
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">
              {language === 'ar' ? `الخطوة ${step} من 3` : `Step ${step} of 3`}
            </span>
            <span className="text-sm font-medium text-rose-600">
              {step === 1 ? (language === 'ar' ? 'معلومات التشخيص' : 'Diagnosis Info') :
               step === 2 ? (language === 'ar' ? 'مخاوفك' : 'Your Concerns') :
               (language === 'ar' ? 'أسئلتك' : 'Your Questions')}
            </span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Step 1: Diagnosis Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-500" />
              {language === 'ar' ? 'معلومات التشخيص' : 'Diagnosis Information'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'أدخل معلومات عن تشخيصك الحالي'
                : 'Enter information about your current diagnosis'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'التشخيص الحالي *' : 'Current Diagnosis *'}</Label>
              <Input
                placeholder={language === 'ar' ? 'مثال: ارتفاع ضغط الدم' : 'e.g., High blood pressure'}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'الأعراض التي تعاني منها' : 'Symptoms you\'re experiencing'}</Label>
              <Textarea
                placeholder={language === 'ar' ? 'صف أعراضك الرئيسية...' : 'Describe your main symptoms...'}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label>{language === 'ar' ? 'العلاج الحالي (إن وجد)' : 'Current Treatment (if any)'}</Label>
              <Textarea
                placeholder={language === 'ar' ? 'الأدوية أو العلاجات الحالية...' : 'Current medications or treatments...'}
                value={currentTreatment}
                onChange={(e) => setCurrentTreatment(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <Button 
              onClick={() => setStep(2)}
              disabled={!diagnosis.trim()}
              className="w-full bg-rose-500 hover:bg-rose-600"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Concerns */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-rose-500" />
              {language === 'ar' ? 'ما هي مخاوفك؟' : 'What are your concerns?'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'اختر المخاوف التي تريد مناقشتها مع الطبيب'
                : 'Select the concerns you want to discuss with the doctor'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {commonConcerns.map((concern) => (
                <div
                  key={concern.id}
                  onClick={() => toggleConcern(concern.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    concerns.includes(concern.id) 
                      ? 'border-rose-500 bg-rose-50' 
                      : 'border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={concerns.includes(concern.id)} />
                    <span className="text-sm">{concern.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom concerns */}
            <div className="pt-4 border-t">
              <Label>{language === 'ar' ? 'أضف مخاوف أخرى' : 'Add other concerns'}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder={language === 'ar' ? 'مخاوف إضافية...' : 'Additional concerns...'}
                  value={customConcern}
                  onChange={(e) => setCustomConcern(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomConcern()}
                />
                <Button variant="outline" onClick={addCustomConcern}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {concerns.filter(c => !commonConcerns.find(cc => cc.id === c)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {concerns.filter(c => !commonConcerns.find(cc => cc.id === c)).map((concern) => (
                    <Badge key={concern} variant="secondary" className="gap-1">
                      {concern}
                      <button onClick={() => toggleConcern(concern)}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Additional info */}
            <div>
              <Label>{language === 'ar' ? 'معلومات إضافية (اختياري)' : 'Additional Information (optional)'}</Label>
              <Textarea
                placeholder={language === 'ar' ? 'أي معلومات أخرى تريد مشاركتها...' : 'Any other information you want to share...'}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                {language === 'ar' ? 'السابق' : 'Back'}
              </Button>
              <Button 
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="flex-1 bg-rose-500 hover:bg-rose-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إنشاء الأسئلة' : 'Generate Questions'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generated Questions */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-rose-500" />
                {language === 'ar' ? 'أسئلتك المقترحة' : 'Your Suggested Questions'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'اختر الأسئلة التي تريد طرحها على الطبيب'
                  : 'Select the questions you want to ask the doctor'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedQuestions.map((question, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleQuestion(question)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedQuestions.includes(question) 
                      ? 'border-rose-500 bg-white' 
                      : 'border-slate-200 bg-white/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selectedQuestions.includes(question)} className="mt-1" />
                    <div className="flex-1">
                      <p className="text-slate-800">{question}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-rose-500" />
                {language === 'ar' ? 'ملخص' : 'Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">{language === 'ar' ? 'التشخيص' : 'Diagnosis'}</span>
                  <span className="font-medium">{diagnosis}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">{language === 'ar' ? 'عدد الأسئلة المختارة' : 'Selected Questions'}</span>
                  <Badge className="bg-rose-100 text-rose-800">{selectedQuestions.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
            <Button variant="outline" onClick={copyQuestions} disabled={selectedQuestions.length === 0}>
              <Copy className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'نسخ' : 'Copy'}
            </Button>
            <Button variant="outline" onClick={downloadQuestions} disabled={selectedQuestions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحميل' : 'Download'}
            </Button>
            <Button 
              onClick={() => setLocation('/patient/find-doctors')}
              className="bg-rose-500 hover:bg-rose-600"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
            </Button>
          </div>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                {language === 'ar' ? 'نصائح للاستشارة' : 'Consultation Tips'}
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {language === 'ar' 
                    ? 'أحضر جميع تقاريرك الطبية والفحوصات السابقة'
                    : 'Bring all your medical reports and previous tests'}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {language === 'ar' 
                    ? 'دوّن ملاحظاتك أثناء الاستشارة'
                    : 'Take notes during the consultation'}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {language === 'ar' 
                    ? 'لا تتردد في طلب توضيح إذا لم تفهم شيئاً'
                    : 'Don\'t hesitate to ask for clarification if you don\'t understand something'}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SecondOpinionPrep() {
  return (
    <PatientLayout>
      <SecondOpinionPrepContent />
    </PatientLayout>
  );
}
