import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  Loader2, 
  FileImage, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft,
  Scan,
  Activity,
  Heart,
  Eye,
  Microscope,
  Bone,
  Brain,
  Zap,
  X,
  Download,
  Share2,
  History,
  Clock,
  Camera
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AppLogo } from "@/components/AppLogo";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// Imaging modality types
type ImagingModality = 'xray' | 'mri' | 'ct' | 'ultrasound' | 'mammography' | 'ecg' | 'pathology' | 'retinal' | 'pet' | 'dexa' | 'fluoroscopy';

interface ModalityInfo {
  id: ImagingModality;
  icon: React.ComponentType<{ className?: string }>;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  color: string;
}

const modalities: ModalityInfo[] = [
  { id: 'xray', icon: Bone, nameEn: 'X-Ray', nameAr: 'الأشعة السينية', descEn: 'Bones, chest, joints', descAr: 'العظام، الصدر، المفاصل', color: 'from-blue-500 to-cyan-500' },
  { id: 'ct', icon: Scan, nameEn: 'CT Scan', nameAr: 'الأشعة المقطعية', descEn: 'Detailed cross-sections', descAr: 'مقاطع تفصيلية', color: 'from-purple-500 to-indigo-500' },
  { id: 'mri', icon: Brain, nameEn: 'MRI', nameAr: 'الرنين المغناطيسي', descEn: 'Soft tissues, brain, spine', descAr: 'الأنسجة الرخوة، الدماغ، العمود الفقري', color: 'from-rose-500 to-pink-500' },
  { id: 'ultrasound', icon: Activity, nameEn: 'Ultrasound', nameAr: 'الموجات فوق الصوتية', descEn: 'Organs, pregnancy, vessels', descAr: 'الأعضاء، الحمل، الأوعية', color: 'from-teal-500 to-emerald-500' },
  { id: 'ecg', icon: Heart, nameEn: 'ECG/EKG', nameAr: 'تخطيط القلب', descEn: 'Heart rhythm analysis', descAr: 'تحليل نظم القلب', color: 'from-red-500 to-rose-500' },
  { id: 'mammography', icon: FileImage, nameEn: 'Mammography', nameAr: 'تصوير الثدي', descEn: 'Breast imaging', descAr: 'تصوير الثدي', color: 'from-pink-500 to-fuchsia-500' },
  { id: 'retinal', icon: Eye, nameEn: 'Retinal Scan', nameAr: 'فحص الشبكية', descEn: 'Eye fundus imaging', descAr: 'تصوير قاع العين', color: 'from-amber-500 to-orange-500' },
  { id: 'pathology', icon: Microscope, nameEn: 'Pathology', nameAr: 'علم الأمراض', descEn: 'Tissue samples', descAr: 'عينات الأنسجة', color: 'from-violet-500 to-purple-500' },
  { id: 'pet', icon: Zap, nameEn: 'PET Scan', nameAr: 'التصوير البوزيتروني', descEn: 'Metabolic activity', descAr: 'النشاط الأيضي', color: 'from-yellow-500 to-amber-500' },
  { id: 'dexa', icon: Bone, nameEn: 'DEXA Scan', nameAr: 'قياس كثافة العظام', descEn: 'Bone density', descAr: 'كثافة العظام', color: 'from-slate-500 to-gray-500' },
];

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if device is mobile
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export default function MedicalImaging() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // State
  const [selectedModality, setSelectedModality] = useState<ImagingModality | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [clinicalContext, setClinicalContext] = useState("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("");
  const [bodyPart, setBodyPart] = useState("");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    findings: string;
    interpretation: string;
    recommendations: string;
    abnormalities: Array<{
      type: string;
      location: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      confidence: number;
      description: string;
    }>;
    overallAssessment: string;
    urgency: 'routine' | 'semi-urgent' | 'urgent' | 'emergency';
    technicalQuality?: {
      rating: 'poor' | 'fair' | 'good' | 'excellent';
      issues?: string[];
    };
    differentialDiagnosis?: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Use the comprehensive medical image analysis endpoint
  const analyzeMutation = trpc.imaging.analyzeMedicalImage.useMutation({
    onError: (error) => {
      console.error('Medical image analysis error:', error);
      setAnalysisError(error.message);
      toast.error(language === 'ar' ? 'فشل تحليل الصورة: ' + error.message : 'Failed to analyze image: ' + error.message);
    },
    onSuccess: (result) => {
      setAnalysis(result);
      setActiveTab("results");
      setAnalysisError(null);
      toast.success(language === 'ar' ? 'تم تحليل الصورة بنجاح' : 'Image analyzed successfully');
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'يرجى تحميل ملف صورة' : 'Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' : 'File too large (max 10MB)');
      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setAnalysisError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedModality) {
      toast.error(language === 'ar' ? 'يرجى اختيار نوع الفحص والصورة' : 'Please select imaging type and upload an image');
      return;
    }

    setAnalysisError(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      
      await analyzeMutation.mutateAsync({
        imageBase64: base64,
        mimeType: selectedFile.type,
        modality: selectedModality,
        clinicalContext: clinicalContext || undefined,
        patientAge: patientAge ? parseInt(patientAge) : undefined,
        patientGender: patientGender as 'male' | 'female' | 'other' | undefined,
        bodyPart: bodyPart || undefined,
        language,
      });
    } catch (error) {
      // Error is handled by onError callback
      console.error('Analysis error:', error);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setAnalysis(null);
    setAnalysisError(null);
    setClinicalContext("");
    setPatientAge("");
    setPatientGender("");
    setBodyPart("");
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-600 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'semi-urgent': return 'bg-yellow-500 text-black';
      case 'routine': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getQualityColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSelectedModalityInfo = () => {
    return modalities.find(m => m.id === selectedModality);
  };

  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/patient/portal')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'العودة' : 'Back'}
              </Button>
              <AppLogo href="/patient/portal" size="sm" showText={!isMobile} />
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {language === 'ar' ? 'تحليل الصور الطبية' : 'Medical Image Analysis'}
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              {language === 'ar' 
                ? 'قم بتحميل صورك الطبية للحصول على تحليل بالذكاء الاصطناعي'
                : 'Upload your medical images for AI-powered analysis'}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="text-xs md:text-sm">
                <Upload className="w-4 h-4 mr-1 md:mr-2" />
                {language === 'ar' ? 'رفع' : 'Upload'}
              </TabsTrigger>
              <TabsTrigger value="results" disabled={!analysis} className="text-xs md:text-sm">
                <CheckCircle className="w-4 h-4 mr-1 md:mr-2" />
                {language === 'ar' ? 'النتائج' : 'Results'}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm">
                <History className="w-4 h-4 mr-1 md:mr-2" />
                {language === 'ar' ? 'السجل' : 'History'}
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              {/* Step 1: Select Modality - Mobile Dropdown / Desktop Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold">1</span>
                    {language === 'ar' ? 'اختر نوع الفحص' : 'Select Imaging Type'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {language === 'ar' 
                      ? 'اختر نوع الصورة الطبية للحصول على تحليل متخصص'
                      : 'Choose the type of medical image for specialized analysis'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mobile: Dropdown Select */}
                  <div className="md:hidden">
                    <Select 
                      value={selectedModality || ""} 
                      onValueChange={(value) => setSelectedModality(value as ImagingModality)}
                    >
                      <SelectTrigger className="w-full h-14">
                        <SelectValue placeholder={language === 'ar' ? 'اختر نوع الفحص...' : 'Select imaging type...'}>
                          {selectedModality && (
                            <div className="flex items-center gap-3">
                              {(() => {
                                const modality = getSelectedModalityInfo();
                                if (!modality) return null;
                                const Icon = modality.icon;
                                return (
                                  <>
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${modality.color} flex items-center justify-center`}>
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-left">
                                      <p className="font-medium">{language === 'ar' ? modality.nameAr : modality.nameEn}</p>
                                      <p className="text-xs text-slate-500">{language === 'ar' ? modality.descAr : modality.descEn}</p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {modalities.map((modality) => {
                          const Icon = modality.icon;
                          return (
                            <SelectItem key={modality.id} value={modality.id} className="py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${modality.color} flex items-center justify-center`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">{language === 'ar' ? modality.nameAr : modality.nameEn}</p>
                                  <p className="text-xs text-slate-500">{language === 'ar' ? modality.descAr : modality.descEn}</p>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop: Card Grid */}
                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {modalities.map((modality) => {
                      const Icon = modality.icon;
                      const isSelected = selectedModality === modality.id;
                      return (
                        <button
                          key={modality.id}
                          onClick={() => setSelectedModality(modality.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            isSelected 
                              ? 'border-rose-500 bg-rose-50 shadow-md' 
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${modality.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <p className="font-medium text-sm text-slate-900">
                            {language === 'ar' ? modality.nameAr : modality.nameEn}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {language === 'ar' ? modality.descAr : modality.descEn}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Upload Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold">2</span>
                    {language === 'ar' ? 'رفع الصورة' : 'Upload Image'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-colors ${
                      previewUrl ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="medical-image-upload"
                    />
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img
                          src={previewUrl}
                          alt="Medical image preview"
                          className="max-h-48 md:max-h-64 mx-auto rounded-lg border shadow-sm"
                        />
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium text-sm truncate max-w-[200px]">{selectedFile?.name}</span>
                          <Button variant="ghost" size="sm" onClick={resetForm}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="medical-image-upload" className="cursor-pointer block">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                          <div className="flex items-center gap-3">
                            <Upload className="w-10 h-10 md:w-12 md:h-12 text-slate-400" />
                            <Camera className="w-8 h-8 md:w-10 md:h-10 text-slate-400 md:hidden" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 mb-1">
                              {language === 'ar' ? 'انقر لتحميل أو التقاط صورة' : 'Click to upload or take a photo'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {language === 'ar' ? 'PNG, JPG, JPEG (حتى 10 ميجابايت)' : 'PNG, JPG, JPEG (up to 10MB)'}
                            </p>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Additional Context (Optional) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">3</span>
                    {language === 'ar' ? 'معلومات إضافية (اختياري)' : 'Additional Context (Optional)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'العمر' : 'Age'}</Label>
                      <Input 
                        type="number" 
                        placeholder={language === 'ar' ? 'مثال: 45' : 'e.g., 45'}
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الجنس' : 'Gender'}</Label>
                      <Select value={patientGender} onValueChange={setPatientGender}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر' : 'Select'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{language === 'ar' ? 'ذكر' : 'Male'}</SelectItem>
                          <SelectItem value="female">{language === 'ar' ? 'أنثى' : 'Female'}</SelectItem>
                          <SelectItem value="other">{language === 'ar' ? 'آخر' : 'Other'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'منطقة الجسم' : 'Body Part'}</Label>
                      <Input 
                        placeholder={language === 'ar' ? 'مثال: الصدر، الركبة' : 'e.g., Chest, Knee'}
                        value={bodyPart}
                        onChange={(e) => setBodyPart(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'السياق السريري' : 'Clinical Context'}</Label>
                    <Textarea 
                      placeholder={language === 'ar' 
                        ? 'صف الأعراض أو سبب الفحص...'
                        : 'Describe symptoms or reason for examination...'}
                      value={clinicalContext}
                      onChange={(e) => setClinicalContext(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {analysisError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'ar' ? 'خطأ: ' : 'Error: '}{analysisError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Analyze Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || !selectedModality || analyzeMutation.isPending}
                  className="w-full md:w-auto px-8 md:px-12 py-6 text-lg bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5 mr-2" />
                      {language === 'ar' ? 'تحليل الصورة' : 'Analyze Image'}
                    </>
                  )}
                </Button>
              </div>

              {/* Disclaimer */}
              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  {language === 'ar'
                    ? 'هذا التحليل يتم بواسطة الذكاء الاصطناعي ولا يعتبر تشخيصاً طبياً. استشر طبيباً مؤهلاً دائماً للحصول على تشخيص دقيق.'
                    : 'This analysis is AI-generated and not a medical diagnosis. Always consult a qualified physician for accurate diagnosis.'}
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
              {analysis && (
                <>
                  {/* Urgency Banner */}
                  <div className={`p-4 rounded-xl ${
                    analysis.urgency === 'emergency' ? 'bg-red-100 border-2 border-red-500' :
                    analysis.urgency === 'urgent' ? 'bg-orange-100 border-2 border-orange-500' :
                    analysis.urgency === 'semi-urgent' ? 'bg-yellow-100 border-2 border-yellow-500' :
                    'bg-green-100 border-2 border-green-500'
                  }`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getUrgencyColor(analysis.urgency)}>
                          {language === 'ar' 
                            ? analysis.urgency === 'emergency' ? 'طوارئ' :
                              analysis.urgency === 'urgent' ? 'عاجل' :
                              analysis.urgency === 'semi-urgent' ? 'شبه عاجل' : 'روتيني'
                            : analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1)}
                        </Badge>
                        <span className="font-medium">
                          {language === 'ar' ? 'مستوى الإلحاح' : 'Urgency Level'}
                        </span>
                      </div>
                      {analysis.technicalQuality && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">
                            {language === 'ar' ? 'جودة الصورة:' : 'Image Quality:'}
                          </span>
                          <span className={`font-medium ${getQualityColor(analysis.technicalQuality.rating)}`}>
                            {language === 'ar' 
                              ? analysis.technicalQuality.rating === 'excellent' ? 'ممتازة' :
                                analysis.technicalQuality.rating === 'good' ? 'جيدة' :
                                analysis.technicalQuality.rating === 'fair' ? 'مقبولة' : 'ضعيفة'
                              : analysis.technicalQuality.rating.charAt(0).toUpperCase() + analysis.technicalQuality.rating.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Preview */}
                  {previewUrl && (
                    <Card>
                      <CardContent className="p-4">
                        <img
                          src={previewUrl}
                          alt="Analyzed medical image"
                          className="max-h-40 md:max-h-48 mx-auto rounded-lg border"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Overall Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={isArabic ? 'text-right' : 'text-left'}>{language === 'ar' ? 'التقييم العام' : 'Overall Assessment'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base ${isArabic ? 'text-right' : 'text-left'}`}>{analysis.overallAssessment}</p>
                    </CardContent>
                  </Card>

                  {/* Findings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={isArabic ? 'text-right' : 'text-left'}>{language === 'ar' ? 'النتائج' : 'Findings'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base ${isArabic ? 'text-right' : 'text-left'}`}>{analysis.findings}</p>
                    </CardContent>
                  </Card>

                  {/* Abnormalities */}
                  {analysis.abnormalities && analysis.abnormalities.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className={isArabic ? 'text-right' : 'text-left'}>{language === 'ar' ? 'الشذوذات المكتشفة' : 'Detected Abnormalities'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysis.abnormalities.map((abnormality, index) => (
                            <div key={index} className={`p-4 bg-slate-50 rounded-lg border ${isArabic ? 'text-right' : 'text-left'}`}>
                              <div className={`flex flex-col md:flex-row items-start justify-between mb-2 gap-2 ${isArabic ? 'md:flex-row-reverse' : ''}`}>
                                <div>
                                  <span className="font-medium text-slate-900">{abnormality.type}</span>
                                  <span className="text-slate-500 mx-2">•</span>
                                  <span className="text-slate-600">{abnormality.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getSeverityColor(abnormality.severity)}>
                                    {language === 'ar' 
                                      ? abnormality.severity === 'critical' ? 'حرج' :
                                        abnormality.severity === 'high' ? 'عالي' :
                                        abnormality.severity === 'medium' ? 'متوسط' : 'منخفض'
                                      : abnormality.severity}
                                  </Badge>
                                  <span className="text-sm text-slate-500">
                                    {abnormality.confidence}% {language === 'ar' ? 'ثقة' : 'confidence'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600">{abnormality.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Interpretation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={isArabic ? 'text-right' : 'text-left'}>{language === 'ar' ? 'التفسير السريري' : 'Clinical Interpretation'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base ${isArabic ? 'text-right' : 'text-left'}`}>{analysis.interpretation}</p>
                    </CardContent>
                  </Card>

                  {/* Differential Diagnosis */}
                  {analysis.differentialDiagnosis && analysis.differentialDiagnosis.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className={isArabic ? 'text-right' : 'text-left'}>{language === 'ar' ? 'التشخيصات التفريقية' : 'Differential Diagnosis'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className={`space-y-1 ${isArabic ? 'list-disc pr-5 text-right' : 'list-disc pl-5 text-left'}`}>
                          {analysis.differentialDiagnosis.map((diagnosis, index) => (
                            <li key={index} className="text-slate-700 text-sm md:text-base">{diagnosis}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className={isArabic ? 'text-right' : 'text-left'}>{language === 'ar' ? 'التوصيات' : 'Recommendations'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-base ${isArabic ? 'text-right' : 'text-left'}`}>{analysis.recommendations}</p>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex flex-col md:flex-row gap-3 justify-center">
                    <Button variant="outline" onClick={resetForm} className="w-full md:w-auto">
                      <Upload className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تحليل صورة جديدة' : 'Analyze New Image'}
                    </Button>
                    <Button variant="outline" className="w-full md:w-auto">
                      <Download className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تحميل التقرير' : 'Download Report'}
                    </Button>
                    <Button variant="outline" className="w-full md:w-auto">
                      <Share2 className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'مشاركة مع الطبيب' : 'Share with Doctor'}
                    </Button>
                  </div>

                  {/* Disclaimer */}
                  <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      {language === 'ar'
                        ? 'هذا التحليل يتم بواسطة الذكاء الاصطناعي ولا يعتبر تشخيصاً طبياً. استشر طبيباً مؤهلاً دائماً للحصول على تشخيص دقيق.'
                        : 'This analysis is AI-generated and not a medical diagnosis. Always consult a qualified physician for accurate diagnosis.'}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {language === 'ar' ? 'سجل التحليلات' : 'Analysis History'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' 
                      ? 'عرض تحليلات الصور الطبية السابقة'
                      : 'View your previous medical image analyses'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{language === 'ar' ? 'لا توجد تحليلات سابقة' : 'No previous analyses'}</p>
                    <p className="text-sm mt-1">
                      {language === 'ar' 
                        ? 'ستظهر تحليلاتك هنا بعد إجراء أول تحليل'
                        : 'Your analyses will appear here after your first analysis'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
