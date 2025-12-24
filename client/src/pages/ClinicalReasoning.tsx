import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  AlertTriangle, 
  Activity,
  FileText,
  ArrowLeft,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Shield,
  BookOpen,
  Calendar,
  Info,
  Mic,
  MessageSquare,
  Square,
  Trash2
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { useLanguage } from "@/contexts/LanguageContext";

function ClinicalReasoningContent() {
  const [, setLocation] = useLocation();
  const { strings } = useLanguage();
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [reasoning, setReasoning] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [useAudioInput, setUseAudioInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateDiagnosisMutation = trpc.clinical.generateDifferentialDiagnosis.useMutation({
    onSuccess: (data) => {
      setReasoning(data);
      toast.success("Differential diagnosis generated");
    },
    onError: (error) => {
      toast.error("Failed to generate diagnosis: " + error.message);
    },
  });

  const audioAnalysisMutation = trpc.audioSymptom.analyzeAudioSymptoms.useMutation({
    onSuccess: (data) => {
      if (data.analysis) {
        // Populate ALL form fields from audio analysis
        if (data.analysis.chiefComplaint) setChiefComplaint(data.analysis.chiefComplaint);
        if (data.analysis.symptoms) setSymptoms(data.analysis.symptoms);
        if (data.analysis.patientAge) setPatientAge(data.analysis.patientAge);
        if (data.analysis.patientGender) setPatientGender(data.analysis.patientGender);
        if (data.analysis.bloodPressure) setBloodPressure(data.analysis.bloodPressure);
        if (data.analysis.heartRate) setHeartRate(data.analysis.heartRate);
        if (data.analysis.temperature) setTemperature(data.analysis.temperature);
        if (data.analysis.oxygenSaturation) setOxygenSaturation(data.analysis.oxygenSaturation);
        
        // Switch to text mode and clear audio blob so Generate button works
        setUseAudioInput(false);
        setAudioBlob(null);
        
        toast.success("Audio analyzed - all fields populated! Click Generate to continue.");
      }
    },
    onError: (error) => {
      toast.error("Audio analysis failed: " + error.message);
    },
  });

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        toast.success("Audio recorded successfully");
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to access microphone: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleGenerate = async () => {
    // Audio input mode - process audio with Gemini
    if (useAudioInput && audioBlob) {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        
        reader.onloadend = () => {
          if (!reader.result) {
            toast.error("Failed to read audio file");
            return;
          }
          
          const base64Audio = (reader.result as string).split(',')[1];
          const mimeType = audioBlob.type;

          // Call audio analysis via tRPC (uses Gemini Flash)
          audioAnalysisMutation.mutate({
            audioBase64: base64Audio,
            mimeType,
            language: 'ar'
          });
        };
        
        reader.readAsDataURL(audioBlob);
        
      } catch (error) {
        toast.error("Audio processing failed: " + (error instanceof Error ? error.message : 'Unknown error'));
      }
      return;
    }

    // Text input mode
    if (!chiefComplaint || !symptoms) {
      toast.error("Please enter chief complaint and symptoms");
      return;
    }

    const symptomList = symptoms.split(",").map(s => s.trim()).filter(s => s);

    generateDiagnosisMutation.mutate({
      caseId: 1, // Temporary - in production, this would be from route params
      chiefComplaint,
      symptoms: symptomList,
      vitals: {
        bloodPressure,
        heartRate: heartRate && heartRate.trim() ? parseInt(heartRate) : undefined,
        temperature,
        oxygenSaturation: oxygenSaturation && oxygenSaturation.trim() ? parseInt(oxygenSaturation) : undefined,
      },
      patientAge: patientAge && patientAge.trim() ? parseInt(patientAge) : undefined,
      patientGender,
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {strings.clinicianPortal.clinicalReasoning.backToDashboard}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                {strings.clinicianPortal.clinicalReasoning.title}
                <Badge variant="default" className="bg-purple-600">{strings.clinicianPortal.clinicalReasoning.poweredBy}</Badge>
              </h1>
              <p className="text-gray-600 mt-1">{strings.clinicianPortal.clinicalReasoning.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {strings.clinicianPortal.clinicalReasoning.patientInfo.title}
              </CardTitle>
              <CardDescription>{strings.clinicianPortal.clinicalReasoning.patientInfo.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="complaint">{strings.clinicianPortal.clinicalReasoning.input.chiefComplaint}</Label>
                <Input
                  id="complaint"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={strings.clinicianPortal.clinicalReasoning.input.chiefComplaintPlaceholder}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="symptoms">{strings.clinicianPortal.clinicalReasoning.input.symptoms}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={!useAudioInput ? "default" : "outline"}
                      onClick={() => setUseAudioInput(false)}
                      size="sm"
                      type="button"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {strings.clinicianPortal.clinicalReasoning.input.textMode}
                    </Button>
                    <Button
                      variant={useAudioInput ? "default" : "outline"}
                      onClick={() => setUseAudioInput(true)}
                      size="sm"
                      type="button"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {strings.clinicianPortal.clinicalReasoning.input.voiceMode}
                    </Button>
                  </div>
                </div>
                {!useAudioInput ? (
                  <Textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder={strings.clinicianPortal.clinicalReasoning.input.symptomsPlaceholder}
                    rows={3}
                  />
                ) : (
                  <div className="space-y-3">
                    {!isRecording && !audioBlob && (
                      <Button
                        onClick={startRecording}
                        disabled={audioAnalysisMutation.isPending}
                        className="w-full"
                        size="lg"
                        type="button"
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        {strings.clinicianPortal.clinicalReasoning.input.startRecording}
                      </Button>
                    )}
                    
                    {isRecording && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3 p-4 bg-red-50 rounded-lg">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-lg font-medium">{strings.clinicianPortal.clinicalReasoning.input.recording} {recordingTime}s</span>
                        </div>
                        <Button
                          onClick={stopRecording}
                          className="w-full bg-red-600 hover:bg-red-700"
                          size="lg"
                          type="button"
                        >
                          <Square className="w-5 h-5 mr-2" />
                          {strings.clinicianPortal.clinicalReasoning.input.stopRecording}
                        </Button>
                      </div>
                    )}
                    
                    {audioBlob && !isRecording && (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">✓ Audio recorded ({Math.round(audioBlob.size / 1024)}KB)</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setAudioBlob(null);
                              setRecordingTime(0);
                            }}
                            variant="outline"
                            className="flex-1"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {strings.clinicianPortal.clinicalReasoning.input.deleteRecording}
                          </Button>
                          <Button
                            onClick={startRecording}
                            variant="outline"
                            className="flex-1"
                            type="button"
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            {strings.clinicianPortal.clinicalReasoning.input.reRecord}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">{strings.clinicianPortal.clinicalReasoning.input.patientAge}</Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder={strings.clinicianPortal.clinicalReasoning.input.patientAgePlaceholder}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">{strings.clinicianPortal.clinicalReasoning.input.patientGender}</Label>
                  <select
                    id="gender"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select</option>
                    <option value="male">{strings.clinicianPortal.clinicalReasoning.input.genderMale}</option>
                    <option value="female">{strings.clinicianPortal.clinicalReasoning.input.genderFemale}</option>
                    <option value="other">{strings.clinicianPortal.clinicalReasoning.input.genderOther}</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bp">{strings.clinicianPortal.clinicalReasoning.input.bloodPressure}</Label>
                    <Input
                      id="bp"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder={strings.clinicianPortal.clinicalReasoning.input.bloodPressurePlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr">{strings.clinicianPortal.clinicalReasoning.input.heartRate}</Label>
                    <Input
                      id="hr"
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder={strings.clinicianPortal.clinicalReasoning.input.heartRatePlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="temp">{strings.clinicianPortal.clinicalReasoning.input.temperature}</Label>
                    <Input
                      id="temp"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder={strings.clinicianPortal.clinicalReasoning.input.temperaturePlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spo2">{strings.clinicianPortal.clinicalReasoning.input.oxygenSaturation}</Label>
                    <Input
                      id="spo2"
                      type="number"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value)}
                      placeholder={strings.clinicianPortal.clinicalReasoning.input.oxygenSaturationPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateDiagnosisMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {generateDiagnosisMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {strings.clinicianPortal.clinicalReasoning.buttons.analyzing}
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    {strings.clinicianPortal.clinicalReasoning.buttons.generate}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {reasoning ? (
              <>
                {/* Differential Diagnosis */}
                <Card className="card-modern border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <TrendingUp className="w-5 h-5" />
                      {strings.clinicianPortal.clinicalReasoning.results.differentialDiagnosis}
                    </CardTitle>
                    <CardDescription>Ranked by likelihood</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reasoning.differentialDiagnosis.map((diagnosisItem: any, index: number) => {
                      const severityColors = {
                        mild: 'bg-green-50 border-green-200',
                        moderate: 'bg-yellow-50 border-yellow-200',
                        severe: 'bg-orange-50 border-orange-200',
                        critical: 'bg-red-50 border-red-200',
                      };
                      const severityBadgeColors = {
                        mild: 'bg-green-600',
                        moderate: 'bg-yellow-600',
                        severe: 'bg-orange-600',
                        critical: 'bg-red-600',
                      };
                      return (
                        <div key={index} className={`p-4 rounded-lg border ${severityColors[diagnosisItem.severity as keyof typeof severityColors] || 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 text-lg">{diagnosisItem.diagnosis}</h4>
                                <Badge className="bg-purple-600">{diagnosisItem.confidence}%</Badge>
                                <Badge className={severityBadgeColors[diagnosisItem.severity as keyof typeof severityBadgeColors] || 'bg-gray-600'}>
                                  {diagnosisItem.severity?.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{diagnosisItem.clinicalPresentation}</p>
                            </div>
                          </div>
                          <Progress value={diagnosisItem.confidence} className="h-2 mb-3" />
                          
                          {diagnosisItem.supportingEvidence && diagnosisItem.supportingEvidence.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Supporting Evidence:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {diagnosisItem.supportingEvidence.map((evidence: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-purple-600 mt-0.5">•</span>
                                    <span>{evidence}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {diagnosisItem.nextSteps && diagnosisItem.nextSteps.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Next Steps:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {diagnosisItem.nextSteps.map((step: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Clinical Reasoning */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      {strings.clinicianPortal.clinicalReasoning.results.clinicalReasoning}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {reasoning.reasoning}
                    </p>
                  </CardContent>
                </Card>

                {/* Recommended Tests */}
                {reasoning.recommendedTests && reasoning.recommendedTests.length > 0 && (
                  <Card className="card-modern border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <CheckCircle2 className="w-5 h-5" />
                        Recommended Diagnostic Tests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {reasoning.recommendedTests.map((test: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{test}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Red Flags */}
                {reasoning.redFlags && reasoning.redFlags.length > 0 && (
                  <Card className="card-modern border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <Shield className="w-5 h-5" />
                        Red Flags - Immediate Attention Required
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {reasoning.redFlags.map((flag: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-900 font-medium">{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Urgency Assessment */}
                <Card className="card-modern border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="w-5 h-5" />
                      Urgency Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900 font-semibold text-lg whitespace-pre-wrap">
                      {reasoning.urgencyAssessment}
                    </p>
                  </CardContent>
                </Card>

                {/* Patient Education */}
                {reasoning.patientEducation && (
                  <Card className="card-modern border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <BookOpen className="w-5 h-5" />
                        Patient Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reasoning.patientEducation}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Follow-up Recommendations */}
                {reasoning.followUpRecommendations && (
                  <Card className="card-modern border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <Calendar className="w-5 h-5" />
                        Follow-up Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {reasoning.followUpRecommendations}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="card-modern">
                <CardContent className="py-12 text-center">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">{strings.clinicianPortal.clinicalReasoning.results.noAnalysis}</p>
                  <p className="text-sm text-gray-400">
                    {strings.clinicianPortal.clinicalReasoning.results.enterInfo}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClinicalReasoning() {
  return (
    <ClinicianLayout>
      <ClinicalReasoningContent />
    </ClinicianLayout>
  );
}
