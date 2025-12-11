import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, FileImage, AlertCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface XRayUploadProps {
  onAnalysisComplete?: (analysis: {
    findings: string;
    interpretation: string;
    recommendations: string;
    imageUrl: string;
  }) => void;
  clinicalContext?: string;
}

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

export default function XRayUpload({ onAnalysisComplete, clinicalContext }: XRayUploadProps) {
  const { language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<{
    findings: string;
    interpretation: string;
    recommendations: string;
  } | null>(null);

  // Use secure backend endpoint
  const analyzeMutation = trpc.imaging.analyzeXRay.useMutation();

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

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      const base64 = await fileToBase64(selectedFile);
      
      // Call secure backend endpoint
      const result = await analyzeMutation.mutateAsync({
        imageBase64: base64,
        mimeType: selectedFile.type,
        clinicalContext,
        language,
      });

      setAnalysis(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          ...result,
          imageUrl: previewUrl,
        });
      }

      toast.success(language === 'ar' ? 'تم تحليل الصورة بنجاح' : 'Image analyzed successfully');
    } catch (error) {
      console.error('X-ray analysis error:', error);
      toast.error(language === 'ar' ? 'فشل تحليل الصورة' : 'Failed to analyze image');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="w-5 h-5" />
          {language === 'ar' ? 'تحليل الأشعة السينية' : 'X-Ray Analysis'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'قم بتحميل صورة الأشعة السينية أو الصورة الطبية للحصول على تحليل بالذكاء الاصطناعي'
            : 'Upload an X-ray or medical image for AI-powered analysis'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="xray-upload"
          />
          <label htmlFor="xray-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium mb-1">
              {language === 'ar' ? 'انقر لتحميل الصورة' : 'Click to upload image'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'PNG, JPG, JPEG (حتى 10 ميجابايت)' : 'PNG, JPG, JPEG (up to 10MB)'}
            </p>
          </label>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-3">
            <img
              src={previewUrl}
              alt="X-ray preview"
              className="w-full max-h-96 object-contain rounded-lg border"
            />
            <Button
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
              className="w-full"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تحليل الصورة' : 'Analyze Image'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <Alert>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong className="block mb-1">
                    {language === 'ar' ? 'النتائج:' : 'Findings:'}
                  </strong>
                  <p className="text-sm whitespace-pre-line">{analysis.findings}</p>
                </div>
                {analysis.interpretation && (
                  <div>
                    <strong className="block mb-1">
                      {language === 'ar' ? 'التفسير:' : 'Interpretation:'}
                    </strong>
                    <p className="text-sm whitespace-pre-line">{analysis.interpretation}</p>
                  </div>
                )}
                {analysis.recommendations && (
                  <div>
                    <strong className="block mb-1">
                      {language === 'ar' ? 'التوصيات:' : 'Recommendations:'}
                    </strong>
                    <p className="text-sm whitespace-pre-line">{analysis.recommendations}</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {language === 'ar'
              ? 'هذا التحليل يتم بواسطة الذكاء الاصطناعي ولا يعتبر تشخيصاً طبياً. استشر طبيباً مؤهلاً دائماً.'
              : 'This analysis is AI-generated and not a medical diagnosis. Always consult a qualified physician.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
