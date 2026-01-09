/**
 * MedicalImageUpload - Image Upload Component for Visual Assessment
 * 
 * Enables patients to upload wound/rash/symptom photos for
 * Med-Gemini multimodal analysis.
 * 
 * Features:
 * - Drag and drop support
 * - Image preview and management
 * - S3 upload integration
 * - Multiple image support
 * - Image annotation capabilities
 * - Full bilingual support (Arabic/English)
 */

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  Trash2,
  Plus,
  Info,
  Eye,
  FileImage
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  uploadProgress: number;
  s3Url?: string;
  s3Key?: string;
  description?: string;
  bodyPart?: string;
  analysisResult?: ImageAnalysisResult;
}

export interface ImageAnalysisResult {
  description: string;
  descriptionAr?: string;
  findings: string[];
  findingsAr?: string[];
  severity?: 'mild' | 'moderate' | 'severe';
  recommendations?: string[];
  recommendationsAr?: string[];
  confidence: number;
}

interface MedicalImageUploadProps {
  onImagesChange?: (images: UploadedImage[]) => void;
  onAnalysisComplete?: (results: ImageAnalysisResult[]) => void;
  maxImages?: number;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
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
// Component
// ============================================================================

export function MedicalImageUpload({
  onImagesChange,
  onAnalysisComplete,
  maxImages = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxSizeMB = 10,
  disabled = false,
  className
}: MedicalImageUploadProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID
  const generateId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return isArabic 
        ? 'نوع الملف غير مدعوم. يرجى استخدام JPEG أو PNG أو WebP.'
        : 'File type not supported. Please use JPEG, PNG, or WebP.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return isArabic 
        ? `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB} ميجابايت.`
        : `File size too large. Maximum ${maxSizeMB}MB allowed.`;
    }
    return null;
  };

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    if (fileArray.length > remainingSlots) {
      toast.warning(
        isArabic 
          ? `يمكنك إضافة ${remainingSlots} صورة فقط.`
          : `You can only add ${remainingSlots} more image(s).`
      );
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);
    const newImages: UploadedImage[] = [];

    for (const file of filesToProcess) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({
        id: generateId(),
        file,
        preview,
        uploadStatus: 'pending',
        uploadProgress: 0,
      });
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    }
  }, [images, maxImages, isArabic, onImagesChange]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  // Update image description
  const updateImageDescription = (id: string, description: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, description } : img
    );
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  // Update image body part
  const updateImageBodyPart = (id: string, bodyPart: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, bodyPart } : img
    );
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  // Upload image to S3
  const uploadImage = async (image: UploadedImage): Promise<UploadedImage> => {
    // Update status to uploading
    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, uploadStatus: 'uploading', uploadProgress: 0 } : img
    ));

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', image.file);
      formData.append('type', 'medical_image');
      if (image.bodyPart) {
        formData.append('bodyPart', image.bodyPart);
      }
      if (image.description) {
        formData.append('description', image.description);
      }

      // Upload to server
      const response = await fetch('/api/upload/medical-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update image with S3 URL
      const updatedImage: UploadedImage = {
        ...image,
        uploadStatus: 'completed',
        uploadProgress: 100,
        s3Url: result.url,
        s3Key: result.key,
      };

      setImages(prev => prev.map(img => 
        img.id === image.id ? updatedImage : img
      ));

      return updatedImage;
    } catch (error) {
      console.error('Upload error:', error);
      
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, uploadStatus: 'error', uploadProgress: 0 } : img
      ));

      toast.error(
        isArabic 
          ? 'فشل رفع الصورة. يرجى المحاولة مرة أخرى.'
          : 'Failed to upload image. Please try again.'
      );

      return { ...image, uploadStatus: 'error' };
    }
  };

  // Upload all pending images
  const uploadAllImages = async () => {
    const pendingImages = images.filter(img => img.uploadStatus === 'pending');
    
    for (const image of pendingImages) {
      await uploadImage(image);
    }
  };

  // Get uploaded images for analysis
  const getUploadedImages = () => {
    return images.filter(img => img.uploadStatus === 'completed');
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="w-5 h-5 text-blue-600" />
          {isArabic ? "رفع صور الأعراض" : "Upload Symptom Images"}
        </CardTitle>
        <CardDescription>
          {isArabic 
            ? "ارفع صوراً للجروح أو الطفح الجلدي أو الأعراض المرئية للتحليل بالذكاء الاصطناعي"
            : "Upload photos of wounds, rashes, or visible symptoms for AI analysis"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Privacy notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {isArabic 
                ? "صورك محمية ومشفرة. تُستخدم فقط للتقييم الطبي ولن تُشارك مع أطراف ثالثة."
                : "Your images are protected and encrypted. They are only used for medical assessment and will not be shared with third parties."
              }
            </p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all",
            isDragging && "border-blue-500 bg-blue-50",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && !isDragging && "border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              isDragging ? "bg-blue-100" : "bg-gray-100"
            )}>
              {isDragging ? (
                <Upload className="w-8 h-8 text-blue-600" />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="font-medium text-gray-700">
                {isDragging 
                  ? (isArabic ? "أفلت الصور هنا" : "Drop images here")
                  : (isArabic ? "اسحب وأفلت الصور أو انقر للاختيار" : "Drag & drop images or click to select")
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isArabic 
                  ? `JPEG, PNG, WebP حتى ${maxSizeMB} ميجابايت`
                  : `JPEG, PNG, WebP up to ${maxSizeMB}MB`
                }
              </p>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {images.length}/{maxImages} {isArabic ? "صور" : "images"}
            </Badge>
          </div>
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {isArabic ? "الصور المرفوعة" : "Uploaded Images"}
              </h4>
              {images.some(img => img.uploadStatus === 'pending') && (
                <Button
                  size="sm"
                  onClick={uploadAllImages}
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isArabic ? "رفع الكل" : "Upload All"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="border rounded-lg overflow-hidden bg-white"
                >
                  {/* Image preview */}
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={image.preview}
                      alt="Medical image"
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Status overlay */}
                    {image.uploadStatus === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm">{image.uploadProgress}%</p>
                        </div>
                      </div>
                    )}
                    
                    {image.uploadStatus === 'completed' && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isArabic ? "تم الرفع" : "Uploaded"}
                        </Badge>
                      </div>
                    )}
                    
                    {image.uploadStatus === 'error' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {isArabic ? "فشل" : "Failed"}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="w-8 h-8"
                        onClick={() => setPreviewImage(image)}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="w-8 h-8"
                        onClick={() => removeImage(image.id)}
                        disabled={disabled}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Image details */}
                  <div className="p-3 space-y-3">
                    {/* Body part selector */}
                    <div>
                      <Label className="text-xs text-gray-500">
                        {isArabic ? "منطقة الجسم" : "Body Area"}
                      </Label>
                      <select
                        value={image.bodyPart || ''}
                        onChange={(e) => updateImageBodyPart(image.id, e.target.value)}
                        className="w-full mt-1 text-sm border rounded-md p-2"
                        disabled={disabled}
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
                      <Label className="text-xs text-gray-500">
                        {isArabic ? "وصف إضافي (اختياري)" : "Additional description (optional)"}
                      </Label>
                      <Textarea
                        value={image.description || ''}
                        onChange={(e) => updateImageDescription(image.id, e.target.value)}
                        placeholder={isArabic 
                          ? "صف ما تظهره الصورة..."
                          : "Describe what the image shows..."
                        }
                        className="mt-1 text-sm resize-none"
                        rows={2}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add more button */}
        {images.length > 0 && images.length < maxImages && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isArabic ? "إضافة صورة أخرى" : "Add Another Image"}
          </Button>
        )}
      </CardContent>

      {/* Image preview modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage.preview}
              alt="Full size preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default MedicalImageUpload;
