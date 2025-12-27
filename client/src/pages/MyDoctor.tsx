import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mic, AlertTriangle, Activity, FileText, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface VitalSigns {
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
}

interface AnalysisResult {
  triageRecordId: number;
  differentialDiagnoses: Array<{
    diagnosisName: string;
    diagnosisNameAr: string;
    likelihoodScore: number;
    clinicalReasoning: string;
    clinicalReasoningAr: string;
    matchingSymptoms: string[];
    riskFactors: string[];
  }>;
  recommendedTests: Array<{
    testName: string;
    testNameAr: string;
    reasoning: string;
    reasoningAr: string;
    priority: string;
  }>;
  redFlags: Array<{
    flag: string;
    flagAr: string;
    severity: string;
    action: string;
    actionAr: string;
  }>;
  urgencyAssessment: {
    level: string;
    reasoning: string;
    reasoningAr: string;
    recommendedAction: string;
    recommendedActionAr: string;
    timeframe: string;
    timeframeAr: string;
  };
}

export default function MyDoctor() {
  const [language, setLanguage] = useState<"en" | "ar">("ar");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Form state
  const [complaints, setComplaints] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [heartRate, setHeartRate] = useState("");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = trpc.clinicalReasoning.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data as AnalysisResult);
      toast.success(language === "ar" ? "تم التحليل بنجاح" : "Analysis completed successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success(language === "ar" ? "بدأ التسجيل..." : "Recording started...");
    } catch (error) {
      toast.error(language === "ar" ? "فشل الوصول إلى الميكروفون" : "Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success(language === "ar" ? "تم إيقاف التسجيل" : "Recording stopped");
    }
  };

  const handleAnalyze = async () => {
    if (!complaints || !chiefComplaint || !age) {
      toast.error(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    const vitalSigns: VitalSigns = {};
    if (heartRate) vitalSigns.heartRate = parseInt(heartRate);
    if (bpSystolic && bpDiastolic) {
      vitalSigns.bloodPressure = {
        systolic: parseInt(bpSystolic),
        diastolic: parseInt(bpDiastolic),
      };
    }
    if (temperature) vitalSigns.temperature = parseFloat(temperature);
    if (oxygenSaturation) vitalSigns.oxygenSaturation = parseInt(oxygenSaturation);

    analyzeMutation.mutate({
      patientInfo: {
        complaints,
        chiefComplaint,
        age: parseInt(age),
        gender,
        vitalSigns,
      },
      language,
    });
  };

  const isRTL = language === "ar";

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container max-w-7xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {language === "ar" ? "طبيبي My Doctor" : "My Doctor طبيبي"}
            </h1>
            <p className="text-gray-600 mt-2">
              {language === "ar"
                ? "تحليل البيانات السريرية لتحليل الذكاء الاصطناعي"
                : "AI-Powered Clinical Reasoning Analysis"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="font-semibold"
          >
            {language === "ar" ? "English" : "العربية"}
          </Button>
        </div>

        {!analysisResult ? (
          /* Input Form */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card className="shadow-lg border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <FileText className="w-5 h-5" />
                  {language === "ar" ? "معلومات المريض" : "Patient Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {language === "ar" ? "الشكوى الرئيسية *" : "Chief Complaint *"}
                  </Label>
                  <Input
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder={language === "ar" ? "ألم شديد في الحلق وصعوبة في البلع" : "Severe throat pain and difficulty swallowing"}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <span>{language === "ar" ? "الشكوى *" : "Complaints *"}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="h-8"
                    >
                      <Mic className="w-4 h-4 mr-1" />
                      {isRecording
                        ? language === "ar"
                          ? "إيقاف"
                          : "Stop"
                        : language === "ar"
                        ? "صوت"
                        : "Voice"}
                    </Button>
                  </Label>
                  <Textarea
                    value={complaints}
                    onChange={(e) => setComplaints(e.target.value)}
                    placeholder={
                      language === "ar"
                        ? "الحاق، وجود احمرار شديد (Erythema) وتورم في الاللوزتين مع وجود بقع بيضاء (Exudate)..."
                        : "Burning, severe redness (Erythema) and swelling in the tonsils with white patches (Exudate)..."
                    }
                    rows={5}
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      {language === "ar" ? "العمر *" : "Age *"}
                    </Label>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      {language === "ar" ? "جنس المريض" : "Gender"}
                    </Label>
                    <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{language === "ar" ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{language === "ar" ? "أنثى" : "Female"}</SelectItem>
                        <SelectItem value="other">{language === "ar" ? "آخر" : "Other"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vital Signs */}
            <Card className="shadow-lg border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Activity className="w-5 h-5" />
                  {language === "ar" ? "العلامات الحيوية" : "Vital Signs"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {language === "ar" ? "معدل ضربات القلب (نبضة/دقيقة)" : "Heart Rate (bpm)"}
                  </Label>
                  <Input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="88"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {language === "ar" ? "ضغط الدم (mmHg)" : "Blood Pressure (mmHg)"}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <Input
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      placeholder={language === "ar" ? "الانقباضي 120" : "Systolic 120"}
                    />
                    <Input
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      placeholder={language === "ar" ? "الانبساطي 75" : "Diastolic 75"}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {language === "ar" ? "درجة الحرارة (°C)" : "Temperature (°C)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="38.5"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {language === "ar" ? "تشبع الأكسجين (%)" : "Oxygen Saturation (%)"}
                  </Label>
                  <Input
                    type="number"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                    placeholder="98"
                    className="mt-1.5"
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg shadow-lg"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {language === "ar" ? "جاري التحليل..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Stethoscope className="w-5 h-5 mr-2" />
                      {language === "ar" ? "إنشاء التشخيص التفاضلي" : "Generate Differential Diagnosis"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            <Button
              onClick={() => setAnalysisResult(null)}
              variant="outline"
              className="mb-4"
            >
              {language === "ar" ? "← تحليل جديد" : "← New Analysis"}
            </Button>

            {/* Differential Diagnoses */}
            <Card className="shadow-xl border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="text-2xl">
                  {language === "ar" ? "التشخيص التفاضلي" : "Differential Diagnosis"}
                </CardTitle>
                <p className="text-purple-100 text-sm">
                  {language === "ar" ? "مرتبة حسب الاحتمالية" : "Ranked by likelihood"}
                </p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {analysisResult.differentialDiagnoses.map((diagnosis, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-purple-500 bg-purple-50/50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-purple-900">
                        {language === "ar" ? diagnosis.diagnosisNameAr : diagnosis.diagnosisName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-purple-600">
                          {diagnosis.likelihoodScore}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-gray-700">
                      <p className="font-semibold text-sm text-purple-700">
                        {language === "ar" ? "الفحص السريري:" : "Clinical Examination:"}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {language === "ar"
                          ? diagnosis.clinicalReasoningAr
                          : diagnosis.clinicalReasoning}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Tests */}
            <Card className="shadow-xl border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <CardTitle className="text-xl">
                  {language === "ar" ? "الفحوصات التشخيصية الموصى بها" : "Recommended Diagnostic Tests"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {analysisResult.recommendedTests.map((test, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">
                        {language === "ar" ? test.testNameAr : test.testName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {language === "ar" ? test.reasoningAr : test.reasoning}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        test.priority === "immediate"
                          ? "bg-red-100 text-red-700"
                          : test.priority === "urgent"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {test.priority}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Red Flags */}
            {analysisResult.redFlags.length > 0 && (
              <Card className="shadow-xl border-red-300 bg-red-50">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertTriangle className="w-6 h-6" />
                    {language === "ar" ? "العلامات الحمراء - يتطلب اهتمامًا فوريًا" : "Red Flags - Immediate Attention Required"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {analysisResult.redFlags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-white border-l-4 border-red-500 rounded-r-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-900">
                          {language === "ar" ? flag.flagAr : flag.flag}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {language === "ar" ? flag.actionAr : flag.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Urgency Assessment */}
            <Card className="shadow-xl border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <CardTitle className="text-xl">
                  {language === "ar" ? "تقييم الطوارئ" : "Urgency Assessment"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-600">
                      {language === "ar" ? "المستوى:" : "Level:"}
                    </span>
                    <span
                      className={`px-4 py-2 rounded-full font-bold text-lg ${
                        analysisResult.urgencyAssessment.level === "emergency"
                          ? "bg-red-100 text-red-700"
                          : analysisResult.urgencyAssessment.level === "urgent"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {analysisResult.urgencyAssessment.level.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      {language === "ar" ? "التوصية:" : "Recommendation:"}
                    </p>
                    <p className="text-gray-800">
                      {language === "ar"
                        ? analysisResult.urgencyAssessment.recommendedActionAr
                        : analysisResult.urgencyAssessment.recommendedAction}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      {language === "ar" ? "الإطار الزمني:" : "Timeframe:"}
                    </p>
                    <p className="text-gray-800 font-semibold">
                      {language === "ar"
                        ? analysisResult.urgencyAssessment.timeframeAr
                        : analysisResult.urgencyAssessment.timeframe}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
