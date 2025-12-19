import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, Loader2, FileImage, AlertCircle, CheckCircle, 
  ZoomIn, ZoomOut, Move, Pencil, Circle, ArrowRight, 
  Type, Ruler, RotateCw, Download, Trash2, X, Maximize2,
  Sun, Moon
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Annotation {
  id: string;
  type: 'arrow' | 'circle' | 'text' | 'line' | 'measure';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  radius?: number;
  text?: string;
  color: string;
}

interface ComparisonImage {
  url: string;
  label: string;
  analysis?: any;
}

export default function XRayAnalysis() {
  const { language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Image manipulation states
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  // Tool states
  const [activeTool, setActiveTool] = useState<'pan' | 'arrow' | 'circle' | 'text' | 'line' | 'measure' | null>('pan');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [measurementDistance, setMeasurementDistance] = useState<number | null>(null);
  
  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonImages, setComparisonImages] = useState<ComparisonImage[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const analyzeMutation = trpc.imaging.analyzeXRay.useMutation();

  // Convert file to base64
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
    setAnnotations([]);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setBrightness(100);
    setContrast(100);
    setRotation(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      
      // Add to comparison if in comparison mode
      if (comparisonMode && comparisonImages.length < 2) {
        setComparisonImages([...comparisonImages, { url, label: `Image ${comparisonImages.length + 1}` }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      const base64 = await fileToBase64(selectedFile);
      
      const result = await analyzeMutation.mutateAsync({
        imageBase64: base64,
        mimeType: selectedFile.type,
        clinicalContext: undefined,
        language,
      });

      setAnalysis(result);
      toast.success(language === 'ar' ? 'تم تحليل الصورة بنجاح' : 'Image analyzed successfully');
    } catch (error) {
      console.error('X-ray analysis error:', error);
      toast.error(language === 'ar' ? 'فشل تحليل الصورة' : 'Failed to analyze image');
    }
  };

  // Drawing functions
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || activeTool === 'pan') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setIsDrawing(true);
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: activeTool as any,
      startX: x,
      startY: y,
      color: '#ff0000',
    };
    setCurrentAnnotation(newAnnotation);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (currentAnnotation.type === 'circle') {
      const radius = Math.sqrt(
        Math.pow(x - currentAnnotation.startX, 2) + 
        Math.pow(y - currentAnnotation.startY, 2)
      );
      setCurrentAnnotation({ ...currentAnnotation, radius });
    } else if (currentAnnotation.type === 'measure') {
      const distance = Math.sqrt(
        Math.pow(x - currentAnnotation.startX, 2) + 
        Math.pow(y - currentAnnotation.startY, 2)
      );
      setMeasurementDistance(distance);
      setCurrentAnnotation({ ...currentAnnotation, endX: x, endY: y });
    } else {
      setCurrentAnnotation({ ...currentAnnotation, endX: x, endY: y });
    }
  };

  const handleCanvasMouseUp = () => {
    if (currentAnnotation) {
      setAnnotations([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  // Draw annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !previewUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2 + panX, -canvas.height / 2 + panY);
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Draw annotations
    ctx.save();
    ctx.scale(zoom, zoom);
    [...annotations, currentAnnotation].filter(Boolean).forEach((annotation) => {
      if (!annotation) return;
      
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2 / zoom;
      
      if (annotation.type === 'arrow' && annotation.endX && annotation.endY) {
        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(annotation.startX, annotation.startY);
        ctx.lineTo(annotation.endX, annotation.endY);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(annotation.endY - annotation.startY, annotation.endX - annotation.startX);
        ctx.beginPath();
        ctx.moveTo(annotation.endX, annotation.endY);
        ctx.lineTo(
          annotation.endX - 10 * Math.cos(angle - Math.PI / 6),
          annotation.endY - 10 * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(annotation.endX, annotation.endY);
        ctx.lineTo(
          annotation.endX - 10 * Math.cos(angle + Math.PI / 6),
          annotation.endY - 10 * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (annotation.type === 'circle' && annotation.radius) {
        ctx.beginPath();
        ctx.arc(annotation.startX, annotation.startY, annotation.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (annotation.type === 'line' && annotation.endX && annotation.endY) {
        ctx.beginPath();
        ctx.moveTo(annotation.startX, annotation.startY);
        ctx.lineTo(annotation.endX, annotation.endY);
        ctx.stroke();
      } else if (annotation.type === 'measure' && annotation.endX && annotation.endY) {
        // Draw measurement line
        ctx.beginPath();
        ctx.moveTo(annotation.startX, annotation.startY);
        ctx.lineTo(annotation.endX, annotation.endY);
        ctx.stroke();
        
        // Draw distance text
        const distance = Math.sqrt(
          Math.pow(annotation.endX - annotation.startX, 2) + 
          Math.pow(annotation.endY - annotation.startY, 2)
        );
        ctx.font = `${14 / zoom}px Arial`;
        ctx.fillText(
          `${distance.toFixed(1)}px`,
          (annotation.startX + annotation.endX) / 2,
          (annotation.startY + annotation.endY) / 2
        );
      }
    });
    ctx.restore();
  }, [previewUrl, zoom, panX, panY, brightness, contrast, rotation, annotations, currentAnnotation]);

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 5));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.25));
  const handleRotate = () => setRotation((rotation + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
  };
  
  const handleClearAnnotations = () => {
    setAnnotations([]);
    setCurrentAnnotation(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `xray-analysis-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const generateReport = () => {
    if (!analysis) {
      toast.error(language === 'ar' ? 'لا يوجد تحليل لإنشاء تقرير' : 'No analysis available to generate report');
      return;
    }

    const canvas = canvasRef.current;
    const imageDataUrl = canvas ? canvas.toDataURL() : previewUrl;

    // Create report HTML
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>X-Ray Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .findings { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .finding-item { margin: 15px 0; padding: 10px; background: white; border-left: 4px solid #2563eb; }
          .severity { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
          .severity-high { background: #fee2e2; color: #991b1b; }
          .severity-medium { background: #fef3c7; color: #92400e; }
          .severity-low { background: #d1fae5; color: #065f46; }
          .image-container { text-align: center; margin: 30px 0; }
          .image-container img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; }
          .recommendations { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>X-Ray Analysis Report</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div class="image-container">
          <h2>X-Ray Image</h2>
          <img src="${imageDataUrl}" alt="X-Ray with annotations" />
        </div>

        <div class="findings">
          <h2>Analysis Findings</h2>
          ${analysis.findings?.map((finding: any, idx: number) => `
            <div class="finding-item">
              <h3>${idx + 1}. ${finding.title || finding.description}</h3>
              <p><span class="severity severity-${finding.severity?.toLowerCase() || 'low'}">${finding.severity || 'Normal'}</span></p>
              <p>${finding.description || finding.details || ''}</p>
              ${finding.location ? `<p><strong>Location:</strong> ${finding.location}</p>` : ''}
            </div>
          `).join('') || '<p>No specific findings detected.</p>'}
        </div>

        ${analysis.diagnosis ? `
          <div class="recommendations">
            <h2>Diagnosis</h2>
            <p>${analysis.diagnosis}</p>
          </div>
        ` : ''}

        ${analysis.recommendations?.length > 0 ? `
          <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
              ${analysis.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>Disclaimer:</strong> This report is generated by AI-assisted analysis and should be reviewed by a qualified radiologist or physician. It is not a substitute for professional medical diagnosis.</p>
          <p><strong>MediTriage AI Pro</strong> - Advanced Medical Triage System</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xray-report-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileImage className="w-8 h-8" />
            {language === 'ar' ? 'تحليل الأشعة السينية المتقدم' : 'Advanced X-Ray Analysis'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' 
              ? 'أدوات احترافية لتحليل الصور الطبية مع التكبير والتعليقات والقياسات'
              : 'Professional medical imaging tools with zoom, annotations, and measurements'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Upload & Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تحميل الصورة' : 'Upload Image'}</CardTitle>
            <CardDescription>
              {language === 'ar' ? 'اختر صورة أشعة سينية للتحليل' : 'Select an X-ray image to analyze'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="xray-upload"
              />
              <label htmlFor="xray-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {language === 'ar' ? 'انقر لتحميل' : 'Click to upload'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'PNG, JPG (حتى 10MB)' : 'PNG, JPG (up to 10MB)'}
                </p>
              </label>
            </div>

            {previewUrl && (
              <>
                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'AI Analysis'}
                    </>
                  )}
                </Button>

                {/* Tools */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">
                    {language === 'ar' ? 'أدوات التعليق' : 'Annotation Tools'}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={activeTool === 'pan' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('pan')}
                    >
                      <Move className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'arrow' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('arrow')}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('circle')}
                    >
                      <Circle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('line')}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeTool === 'measure' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTool('measure')}
                    >
                      <Ruler className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAnnotations}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {language === 'ar' ? 'التكبير' : 'Zoom'} ({(zoom * 100).toFixed(0)}%)
                  </Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Slider
                      value={[zoom]}
                      onValueChange={(v) => setZoom(v[0])}
                      min={0.25}
                      max={5}
                      step={0.25}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {language === 'ar' ? 'السطوع' : 'Brightness'} ({brightness}%)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Moon className="w-4 h-4" />
                    <Slider
                      value={[brightness]}
                      onValueChange={(v) => setBrightness(v[0])}
                      min={0}
                      max={200}
                      step={10}
                      className="flex-1"
                    />
                    <Sun className="w-4 h-4" />
                  </div>
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {language === 'ar' ? 'التباين' : 'Contrast'} ({contrast}%)
                  </Label>
                  <Slider
                    value={[contrast]}
                    onValueChange={(v) => setContrast(v[0])}
                    min={0}
                    max={200}
                    step={10}
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تدوير' : 'Rotate'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تحميل الصورة' : 'Download Image'}
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={generateReport}
                    disabled={!analysis}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setComparisonMode(!comparisonMode)}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'مقارنة' : 'Compare'}
                  </Button>
                </div>
              </>
            )}

            {/* Warning */}
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {language === 'ar'
                  ? 'هذا التحليل للمساعدة فقط ولا يعتبر تشخيصاً طبياً نهائياً'
                  : 'This analysis is for assistance only and not a final medical diagnosis'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Center Panel - Image Viewer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'عارض الصور' : 'Image Viewer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <div ref={containerRef} className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="X-ray"
                  className="hidden"
                  onLoad={() => {
                    const canvas = canvasRef.current;
                    const img = imageRef.current;
                    if (canvas && img) {
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                
                {/* Measurement Display */}
                {measurementDistance && (
                  <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
                    {language === 'ar' ? 'المسافة:' : 'Distance:'} {measurementDistance.toFixed(1)}px
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center bg-slate-100 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <FileImage className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>{language === 'ar' ? 'لم يتم تحميل صورة' : 'No image uploaded'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {language === 'ar' ? 'نتائج التحليل' : 'Analysis Results'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {language === 'ar' ? 'النتائج' : 'Findings'}
                  </h3>
                  <p className="text-sm whitespace-pre-line">{analysis.findings}</p>
                </div>
                {analysis.interpretation && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {language === 'ar' ? 'التفسير' : 'Interpretation'}
                    </h3>
                    <p className="text-sm whitespace-pre-line">{analysis.interpretation}</p>
                  </div>
                )}
                {analysis.recommendations && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {language === 'ar' ? 'التوصيات' : 'Recommendations'}
                    </h3>
                    <p className="text-sm whitespace-pre-line">{analysis.recommendations}</p>
                  </div>
                )}
              </div>

              {/* Overall Assessment */}
              {analysis.overallAssessment && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-sm text-blue-900 mb-2">
                    {language === 'ar' ? 'التقييم العام' : 'Overall Assessment'}
                  </h3>
                  <p className="text-sm text-blue-800">{analysis.overallAssessment}</p>
                </div>
              )}

              {/* Urgency Level */}
              {analysis.urgency && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {language === 'ar' ? 'مستوى الإلحاح:' : 'Urgency Level:'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    analysis.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                    analysis.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                    analysis.urgency === 'semi-urgent' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {analysis.urgency.toUpperCase()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detected Abnormalities */}
          {analysis.abnormalities && analysis.abnormalities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  {language === 'ar' ? 'الشذوذات المكتشفة' : 'Detected Abnormalities'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? 'تم اكتشاف الشذوذات التالية بواسطة الذكاء الاصطناعي مع درجات الثقة'
                    : 'AI-detected abnormalities with confidence scores'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.abnormalities.map((abn: any, index: number) => (
                    <div 
                      key={index} 
                      className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
                      style={{
                        borderColor: abn.severity === 'critical' ? '#ef4444' :
                                   abn.severity === 'high' ? '#f97316' :
                                   abn.severity === 'medium' ? '#eab308' : '#22c55e',
                        backgroundColor: abn.severity === 'critical' ? '#fef2f2' :
                                       abn.severity === 'high' ? '#fff7ed' :
                                       abn.severity === 'medium' ? '#fefce8' : '#f0fdf4'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{abn.type}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {language === 'ar' ? 'الموقع:' : 'Location:'} <span className="font-medium">{abn.location}</span>
                          </p>
                          <p className="text-sm">{abn.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            abn.severity === 'critical' ? 'bg-red-600 text-white' :
                            abn.severity === 'high' ? 'bg-orange-600 text-white' :
                            abn.severity === 'medium' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                          }`}>
                            {abn.severity.toUpperCase()}
                          </span>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {language === 'ar' ? 'الثقة' : 'Confidence'}
                            </div>
                            <div className="text-lg font-bold">
                              {abn.confidence}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Confidence Bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all"
                            style={{
                              width: `${abn.confidence}%`,
                              backgroundColor: abn.severity === 'critical' ? '#ef4444' :
                                             abn.severity === 'high' ? '#f97316' :
                                             abn.severity === 'medium' ? '#eab308' : '#22c55e'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {language === 'ar'
                      ? 'هذه النتائج تم إنشاؤها بواسطة الذكاء الاصطناعي ويجب مراجعتها من قبل أخصائي أشعة مؤهل'
                      : 'These findings are AI-generated and should be reviewed by a qualified radiologist'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Comparison View */}
      {comparisonMode && comparisonImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'عرض المقارنة' : 'Comparison View'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {comparisonImages.map((img, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{img.label}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setComparisonImages(comparisonImages.filter((_, i) => i !== idx))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <img src={img.url} alt={img.label} className="w-full h-64 object-contain bg-slate-900 rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
