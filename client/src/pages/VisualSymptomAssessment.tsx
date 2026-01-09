/**
 * VisualSymptomAssessment - Image-based Symptom Assessment Page
 * 
 * Allows patients to upload photos of wounds, rashes, or visible symptoms
 * for AI-powered visual analysis using Med-Gemini multimodal capabilities.
 * 
 * Features:
 * - Image upload with drag & drop
 * - Body part selection
 * - Med-Gemini multimodal analysis
 * - ESI level visualization
 * - Chain-of-Thought reasoning display
 * - Full bilingual support (Arabic/English)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  Upload,
  X,
  ZoomIn,
  Trash2,
  Info,
  Sparkles,
  Eye
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ESIBadge, ESILevelCard, type ESILevel } from "@/components/ESIBadge";
import { ReasoningTransparencyPanel, type ChainOfThought } from "@/components/ReasoningTransparencyPanel";

// ============================================================================
// Types
// ============================================================================

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  bodyPart?: string;
  description?: string;
}

interface AnalysisResult {
  description: string;
  descriptionAr: string;
  findings: string[];
  findingsAr: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  possibleConditions: Array<{
    name: string;
    nameAr: string;
    probability: number;
    reasoning: string;
    reasoningAr: string;
  }>;
  recommendations: string[];
  recommendationsAr: string[];
  warningSignsToWatch: string[];
  warningSignsToWatchAr: string[];
  seekCareTimeframe: 'immediate' | 'within_24h' | 'within_week' | 'routine';
  confidence: number;
  chainOfThought: Array<{
    id: string;
    type: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    confidence: number;
    findings?: string[];
    findingsAr?: string[];
  }>;
}

// ============================================================================
// Body Part Options
// ============================================================================

const bodyPartOptions = [
  { value: 'head', label: { en: 'Head/Face', ar: 'الرأس/الوجه' } },
  { value: 'neck', label: { en: 'Neck', ar: 'الرقبة' } },
  { value: 'chest', label: { en: 'Chest', ar: 'الصدر' } },
  { value: 'abdomen', label: { en: 'Abdomen', ar: 'البطن' } },
  { value: 'back', label: { en: 'Back', ar: 'الظهر' } },
  { value: 'arm_left', label: { en: 'Left Arm', ar: 'الذراع الأيسر' } },
  { value: 'arm_right', label: { en: 'Right Arm', ar: 'الذراع الأيمن' } },
  { value: 'hand_left', label: { en: 'Left Hand', ar: 'اليد اليسرى' } },
  { value: 'hand_right', label: { en: 'Right Hand', ar: 'اليد اليمنى' } },
  { value: 'leg_left', label: { en: 'Left Leg', ar: 'الساق اليسرى' } },
  { value: 'leg_right', label: { en: 'Right Leg', ar: 'الساق اليمنى' } },
  { value: 'foot_left', label: { en: 'Left Foot', ar: 'القدم اليسرى' } },
  { value: 'foot_right', label: { en: 'Right Foot', ar: 'القدم اليمنى' } },
  { value: 'skin_general', label: { en: 'Skin (General)', ar: 'الجلد (عام)' } },
  { value: 'other', label: { en: 'Other', ar: 'أخرى' } },
];

// ============================================================================
// Severity to ESI Mapping
// ============================================================================

function severityToESI(severity: string): ESILevel {
  switch (severity) {
    case 'critical': return 1;
    case 'severe': return 2;
    case 'moderate': return 3;
    case 'mild': return 5;
    default: return 4;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function VisualSymptomAssessment() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  // State
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [bodyPart, setBodyPart] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  
  // API mutation
  const analyzeImage = trpc.medicalImage.uploadAndAnalyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      toast.success(isArabic ? 'تم تحليل الصورة بنجاح' : 'Image analyzed successfully');
    },
    onError: (error) => {
      toast.error(isArabic ? 'فشل تحليل الصورة' : 'Failed to analyze image');
      console.error('Analysis error:', error);
    },
  });

  // Generate unique ID
  const generateId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(isArabic 
        ? 'نوع الملف غير مدعوم. يرجى استخدام JPEG أو PNG أو WebP.'
        : 'File type not supported. Please use JPEG, PNG, or WebP.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isArabic 
        ? 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.'
        : 'File size too large. Maximum 10MB allowed.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setImage({
      id: generateId(),
      file,
      preview,
    });
    setAnalysisResult(null);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Remove image
  const removeImage = () => {
    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    setImage(null);
    setAnalysisResult(null);
  };

  // Submit for analysis
  const handleAnalyze = async () => {
    if (!image) {
      toast.error(isArabic ? 'يرجى رفع صورة أولاً' : 'Please upload an image first');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      
      analyzeImage.mutate({
        imageBase64: base64,
        mimeType: image.file.type,
        bodyPart: bodyPart || undefined,
        description: description || undefined,
        language: isArabic ? 'ar' : 'en',
      });
    };
    reader.readAsDataURL(image.file);
  };

  // Convert chain of thought to proper format
  const getChainOfThought = (): ChainOfThought | undefined => {
    if (!analysisResult?.chainOfThought) return undefined;
    
    return {
      steps: analysisResult.chainOfThought.map(step => ({
        id: step.id,
        type: step.type as any,
        title: step.title,
        titleAr: step.titleAr,
        description: step.description,
        descriptionAr: step.descriptionAr,
        confidence: step.confidence,
        findings: step.findings,
        findingsAr: step.findingsAr,
        status: 'completed' as const,
      })),
      overallConfidence: analysisResult.confidence,
      processingTime: 500,
      modelVersion: 'Med-Gemini Pro',
      dataSourcesUsed: ['Visual Analysis', 'Medical Knowledge Base', 'Dermatology Guidelines'],
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/patient/portal")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {isArabic ? "رجوع" : "Back"}
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Camera className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
                {isArabic ? "التقييم البصري للأعراض" : "Visual Symptom Assessment"}
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {isArabic 
                  ? "ارفع صورة للحصول على تحليل بالذكاء الاصطناعي"
                  : "Upload a photo for AI-powered analysis"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 font-semibold mb-1">
                  {isArabic ? "إخلاء مسؤولية طبية" : "Medical Disclaimer"}
                </p>
                <p className="text-sm text-amber-800">
                  {isArabic 
                    ? "هذه الأداة توفر معلومات صحية عامة وليست بديلاً عن الاستشارة الطبية المتخصصة. إذا كنت تعاني من حالة طوارئ طبية، اتصل بخدمات الطوارئ فوراً."
                    : "This tool provides general health information and is not a substitute for professional medical advice. If you're experiencing a medical emergency, call emergency services immediately."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {isArabic ? "رفع الصورة" : "Upload Image"}
                </CardTitle>
                <CardDescription>
                  {isArabic 
                    ? "ارفع صورة واضحة للعرض أو الجرح أو الطفح الجلدي"
                    : "Upload a clear photo of the symptom, wound, or rash"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Privacy notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      {isArabic 
                        ? "صورك محمية ومشفرة. تُستخدم فقط للتقييم الطبي."
                        : "Your images are protected and encrypted. Used only for medical assessment."
                      }
                    </p>
                  </div>
                </div>

                {/* Drop zone or preview */}
                {!image ? (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                      isDragging && "border-indigo-500 bg-indigo-50",
                      !isDragging && "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center",
                        isDragging ? "bg-indigo-100" : "bg-gray-100"
                      )}>
                        <Camera className={cn(
                          "w-8 h-8",
                          isDragging ? "text-indigo-600" : "text-gray-400"
                        )} />
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-700">
                          {isDragging 
                            ? (isArabic ? "أفلت الصورة هنا" : "Drop image here")
                            : (isArabic ? "اسحب وأفلت أو انقر للاختيار" : "Drag & drop or click to select")
                          }
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {isArabic ? "JPEG, PNG, WebP حتى 10 ميجابايت" : "JPEG, PNG, WebP up to 10MB"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.preview}
                        alt="Uploaded symptom"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Body part selector */}
                <div>
                  <Label className="text-sm font-medium">
                    {isArabic ? "منطقة الجسم" : "Body Area"}
                  </Label>
                  <select
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value)}
                    className="w-full mt-1 border rounded-md p-2"
                  >
                    <option value="">
                      {isArabic ? "اختر المنطقة..." : "Select area..."}
                    </option>
                    {bodyPartOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {isArabic ? option.label.ar : option.label.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium">
                    {isArabic ? "وصف إضافي (اختياري)" : "Additional description (optional)"}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isArabic 
                      ? "صف ما تشعر به أو متى بدأت الأعراض..."
                      : "Describe what you're experiencing or when symptoms started..."
                    }
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>

                {/* Analyze button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!image || analyzeImage.isPending}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {analyzeImage.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isArabic ? "جاري التحليل..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isArabic ? "تحليل بالذكاء الاصطناعي" : "Analyze with AI"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {analysisResult ? (
              <>
                {/* ESI Level Card */}
                <ESILevelCard level={severityToESI(analysisResult.severity)} />

                {/* Main Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-600" />
                      {isArabic ? "نتائج التحليل" : "Analysis Results"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-gray-700">
                        {isArabic ? analysisResult.descriptionAr : analysisResult.description}
                      </p>
                    </div>

                    {/* Findings */}
                    {analysisResult.findings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">
                          {isArabic ? "النتائج المرئية" : "Visual Findings"}
                        </h4>
                        <ul className="space-y-1">
                          {(isArabic ? analysisResult.findingsAr : analysisResult.findings).map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Possible Conditions */}
                    {analysisResult.possibleConditions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">
                          {isArabic ? "الحالات المحتملة" : "Possible Conditions"}
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.possibleConditions.map((condition, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">
                                  {isArabic ? condition.nameAr : condition.name}
                                </span>
                                <Badge variant="outline">
                                  {condition.probability}%
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {isArabic ? condition.reasoningAr : condition.reasoning}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysisResult.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900">
                          {isArabic ? "التوصيات" : "Recommendations"}
                        </h4>
                        <ul className="space-y-1">
                          {(isArabic ? analysisResult.recommendationsAr : analysisResult.recommendations).map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm text-gray-500">
                        {isArabic ? "مستوى الثقة:" : "Confidence:"}
                      </span>
                      <Progress value={analysisResult.confidence} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {analysisResult.confidence}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Reasoning Panel */}
                {getChainOfThought() && (
                  <ReasoningTransparencyPanel 
                    chainOfThought={getChainOfThought()!}
                    isExpanded={showReasoning}
                    onToggle={() => setShowReasoning(!showReasoning)}
                  />
                )}

                {/* Warning Signs */}
                {analysisResult.warningSignsToWatch.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        {isArabic ? "علامات تحذيرية" : "Warning Signs"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {(isArabic ? analysisResult.warningSignsToWatchAr : analysisResult.warningSignsToWatch).map((sign, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center py-12">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    {isArabic ? "لم يتم تحليل أي صورة بعد" : "No image analyzed yet"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isArabic 
                      ? "ارفع صورة وانقر على تحليل للحصول على النتائج"
                      : "Upload an image and click analyze to see results"
                    }
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
