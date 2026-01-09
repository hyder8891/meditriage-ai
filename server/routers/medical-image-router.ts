/**
 * Medical Image Upload Router
 * Handles image upload for visual symptom assessment with Med-Gemini multimodal analysis
 * 
 * Features:
 * - S3 storage integration
 * - Med-Gemini multimodal analysis
 * - Chain-of-Thought reasoning for transparency
 * - Bilingual support (Arabic/English)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { storagePut, storageGet } from "../storage";
import { invokeGemini } from "../_core/gemini";
import { nanoid } from "nanoid";

// ============================================================================
// Types
// ============================================================================

export interface VisualSymptomAnalysis {
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
  chainOfThought: ChainOfThoughtStep[];
}

export interface ChainOfThoughtStep {
  id: string;
  type: 'observation' | 'analysis' | 'differential' | 'evidence' | 'conclusion';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  confidence: number;
  findings?: string[];
  findingsAr?: string[];
}

// ============================================================================
// Body Part Configuration
// ============================================================================

const bodyPartContext: Record<string, { en: string; ar: string }> = {
  head: { en: 'Head/Face region', ar: 'منطقة الرأس/الوجه' },
  neck: { en: 'Neck region', ar: 'منطقة الرقبة' },
  chest: { en: 'Chest/Thorax region', ar: 'منطقة الصدر' },
  abdomen: { en: 'Abdominal region', ar: 'منطقة البطن' },
  back: { en: 'Back region', ar: 'منطقة الظهر' },
  arm_left: { en: 'Left arm', ar: 'الذراع الأيسر' },
  arm_right: { en: 'Right arm', ar: 'الذراع الأيمن' },
  hand_left: { en: 'Left hand', ar: 'اليد اليسرى' },
  hand_right: { en: 'Right hand', ar: 'اليد اليمنى' },
  leg_left: { en: 'Left leg', ar: 'الساق اليسرى' },
  leg_right: { en: 'Right leg', ar: 'الساق اليمنى' },
  foot_left: { en: 'Left foot', ar: 'القدم اليسرى' },
  foot_right: { en: 'Right foot', ar: 'القدم اليمنى' },
  skin_general: { en: 'Skin (general)', ar: 'الجلد (عام)' },
  other: { en: 'Other body area', ar: 'منطقة أخرى من الجسم' },
};

// ============================================================================
// Analysis Prompt
// ============================================================================

function generateVisualSymptomPrompt(
  bodyPart: string,
  description: string,
  language: 'en' | 'ar'
): string {
  const bodyPartInfo = bodyPartContext[bodyPart] || bodyPartContext.other;
  
  const prompt = language === 'ar'
    ? `أنت طبيب أمراض جلدية وطبيب طوارئ خبير. قم بتحليل هذه الصورة الطبية للأعراض المرئية.

منطقة الجسم: ${bodyPartInfo.ar}
${description ? `وصف المريض: ${description}` : ''}

قم بتحليل الصورة بشكل منهجي باستخدام التفكير المتسلسل (Chain-of-Thought):

الخطوة 1 - الملاحظة: صف ما تراه بدقة (اللون، الحجم، الشكل، الملمس، الحدود)
الخطوة 2 - التحليل: حلل الخصائص المرئية وعلاقتها بالحالات الطبية المحتملة
الخطوة 3 - التشخيص التفريقي: قدم قائمة بالحالات المحتملة مع احتمالية كل منها
الخطوة 4 - الأدلة: اذكر الأدلة الداعمة لكل تشخيص محتمل
الخطوة 5 - الخلاصة: قدم التقييم النهائي والتوصيات

قدم الإجابة بصيغة JSON التالية:
{
  "description": "وصف تفصيلي بالإنجليزية",
  "descriptionAr": "وصف تفصيلي بالعربية",
  "findings": ["نتيجة 1", "نتيجة 2"],
  "findingsAr": ["نتيجة 1 بالعربية", "نتيجة 2 بالعربية"],
  "severity": "mild|moderate|severe|critical",
  "possibleConditions": [
    {
      "name": "اسم الحالة بالإنجليزية",
      "nameAr": "اسم الحالة بالعربية",
      "probability": 75,
      "reasoning": "السبب بالإنجليزية",
      "reasoningAr": "السبب بالعربية"
    }
  ],
  "recommendations": ["توصية 1", "توصية 2"],
  "recommendationsAr": ["توصية 1 بالعربية", "توصية 2 بالعربية"],
  "warningSignsToWatch": ["علامة تحذيرية 1"],
  "warningSignsToWatchAr": ["علامة تحذيرية 1 بالعربية"],
  "seekCareTimeframe": "immediate|within_24h|within_week|routine",
  "confidence": 85,
  "chainOfThought": [
    {
      "id": "step-1",
      "type": "observation",
      "title": "Visual Observation",
      "titleAr": "الملاحظة المرئية",
      "description": "Description in English",
      "descriptionAr": "الوصف بالعربية",
      "confidence": 90,
      "findings": ["finding 1"],
      "findingsAr": ["نتيجة 1"]
    }
  ]
}`
    : `You are an expert dermatologist and emergency physician. Analyze this medical image of visible symptoms.

Body Part: ${bodyPartInfo.en}
${description ? `Patient Description: ${description}` : ''}

Analyze the image systematically using Chain-of-Thought reasoning:

Step 1 - Observation: Describe what you see precisely (color, size, shape, texture, borders)
Step 2 - Analysis: Analyze visual characteristics and their relation to potential medical conditions
Step 3 - Differential Diagnosis: Provide a list of possible conditions with probability for each
Step 4 - Evidence: State supporting evidence for each potential diagnosis
Step 5 - Conclusion: Provide final assessment and recommendations

Provide response in the following JSON format:
{
  "description": "Detailed description in English",
  "descriptionAr": "Detailed description in Arabic",
  "findings": ["finding 1", "finding 2"],
  "findingsAr": ["نتيجة 1", "نتيجة 2"],
  "severity": "mild|moderate|severe|critical",
  "possibleConditions": [
    {
      "name": "Condition name in English",
      "nameAr": "اسم الحالة بالعربية",
      "probability": 75,
      "reasoning": "Reasoning in English",
      "reasoningAr": "السبب بالعربية"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "recommendationsAr": ["توصية 1", "توصية 2"],
  "warningSignsToWatch": ["warning sign 1"],
  "warningSignsToWatchAr": ["علامة تحذيرية 1"],
  "seekCareTimeframe": "immediate|within_24h|within_week|routine",
  "confidence": 85,
  "chainOfThought": [
    {
      "id": "step-1",
      "type": "observation",
      "title": "Visual Observation",
      "titleAr": "الملاحظة المرئية",
      "description": "Description in English",
      "descriptionAr": "الوصف بالعربية",
      "confidence": 90,
      "findings": ["finding 1"],
      "findingsAr": ["نتيجة 1"]
    }
  ]
}`;

  return prompt;
}

// ============================================================================
// Router
// ============================================================================

export const medicalImageRouter = router({
  /**
   * Upload a medical image for visual symptom assessment
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64 encoded image data"),
        mimeType: z.string().describe("Image MIME type (image/jpeg, image/png, etc.)"),
        bodyPart: z.string().optional().describe("Body part shown in image"),
        description: z.string().optional().describe("Patient description of the symptom"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id || 'anonymous';
        const fileKey = `medical-images/${userId}/${nanoid()}.${input.mimeType.split('/')[1] || 'jpg'}`;
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(input.imageBase64, 'base64');
        
        // Validate file size (max 10MB)
        if (imageBuffer.length > 10 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image size exceeds 10MB limit",
          });
        }
        
        // Upload to S3
        const { url, key } = await storagePut(fileKey, imageBuffer, input.mimeType);
        
        return {
          success: true,
          url,
          key,
          message: "Image uploaded successfully",
        };
      } catch (error) {
        console.error("Medical image upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload image",
        });
      }
    }),

  /**
   * Analyze a medical image for visual symptom assessment using Med-Gemini
   */
  analyzeImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64 encoded image data"),
        mimeType: z.string().describe("Image MIME type"),
        bodyPart: z.string().optional().describe("Body part shown in image"),
        description: z.string().optional().describe("Patient description of the symptom"),
        language: z.enum(['en', 'ar']).default('en').describe("Response language"),
      })
    )
    .mutation(async ({ input }): Promise<VisualSymptomAnalysis> => {
      try {
        const prompt = generateVisualSymptomPrompt(
          input.bodyPart || 'other',
          input.description || '',
          input.language
        );

        console.log(`[Medical Image Analysis] Analyzing image with Med-Gemini, body part: ${input.bodyPart || 'unspecified'}`);

        // Use Gemini Pro for multimodal analysis
        const response = await invokeGemini({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${input.mimeType};base64,${input.imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.3,
          maxTokens: 4000,
        });

        // Parse JSON response
        let analysisResult: VisualSymptomAnalysis;
        try {
          // Extract JSON from response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in response");
          }
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError);
          // Return a default structured response
          analysisResult = {
            description: "Unable to analyze image. Please try again or consult a healthcare provider.",
            descriptionAr: "تعذر تحليل الصورة. يرجى المحاولة مرة أخرى أو استشارة مقدم الرعاية الصحية.",
            findings: ["Image analysis inconclusive"],
            findingsAr: ["تحليل الصورة غير حاسم"],
            severity: 'moderate',
            possibleConditions: [],
            recommendations: ["Consult a healthcare provider for proper evaluation"],
            recommendationsAr: ["استشر مقدم الرعاية الصحية للتقييم المناسب"],
            warningSignsToWatch: [],
            warningSignsToWatchAr: [],
            seekCareTimeframe: 'within_week',
            confidence: 30,
            chainOfThought: [{
              id: 'error',
              type: 'conclusion',
              title: 'Analysis Error',
              titleAr: 'خطأ في التحليل',
              description: 'Unable to complete analysis',
              descriptionAr: 'تعذر إكمال التحليل',
              confidence: 30,
            }],
          };
        }

        return analysisResult;
      } catch (error) {
        console.error("Medical image analysis error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to analyze image",
        });
      }
    }),

  /**
   * Upload and analyze image in one step
   */
  uploadAndAnalyze: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe("Base64 encoded image data"),
        mimeType: z.string().describe("Image MIME type"),
        bodyPart: z.string().optional().describe("Body part shown in image"),
        description: z.string().optional().describe("Patient description of the symptom"),
        language: z.enum(['en', 'ar']).default('en').describe("Response language"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id || 'anonymous';
        const fileKey = `medical-images/${userId}/${nanoid()}.${input.mimeType.split('/')[1] || 'jpg'}`;
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(input.imageBase64, 'base64');
        
        // Validate file size (max 10MB)
        if (imageBuffer.length > 10 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image size exceeds 10MB limit",
          });
        }
        
        // Upload to S3
        const { url, key } = await storagePut(fileKey, imageBuffer, input.mimeType);

        // Analyze image
        const prompt = generateVisualSymptomPrompt(
          input.bodyPart || 'other',
          input.description || '',
          input.language
        );

        console.log(`[Medical Image] Upload and analyze, body part: ${input.bodyPart || 'unspecified'}`);

        const response = await invokeGemini({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${input.mimeType};base64,${input.imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.3,
          maxTokens: 4000,
        });

        // Parse JSON response
        let analysisResult: VisualSymptomAnalysis;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in response");
          }
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError);
          analysisResult = {
            description: "Unable to analyze image. Please try again or consult a healthcare provider.",
            descriptionAr: "تعذر تحليل الصورة. يرجى المحاولة مرة أخرى أو استشارة مقدم الرعاية الصحية.",
            findings: ["Image analysis inconclusive"],
            findingsAr: ["تحليل الصورة غير حاسم"],
            severity: 'moderate',
            possibleConditions: [],
            recommendations: ["Consult a healthcare provider for proper evaluation"],
            recommendationsAr: ["استشر مقدم الرعاية الصحية للتقييم المناسب"],
            warningSignsToWatch: [],
            warningSignsToWatchAr: [],
            seekCareTimeframe: 'within_week',
            confidence: 30,
            chainOfThought: [{
              id: 'error',
              type: 'conclusion',
              title: 'Analysis Error',
              titleAr: 'خطأ في التحليل',
              description: 'Unable to complete analysis',
              descriptionAr: 'تعذر إكمال التحليل',
              confidence: 30,
            }],
          };
        }

        return {
          upload: {
            success: true,
            url,
            key,
          },
          analysis: analysisResult,
        };
      } catch (error) {
        console.error("Medical image upload and analysis error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to process image",
        });
      }
    }),

  /**
   * Get presigned URL for an uploaded image
   */
  getImageUrl: protectedProcedure
    .input(
      z.object({
        key: z.string().describe("S3 key of the image"),
      })
    )
    .query(async ({ input }) => {
      try {
        const { url } = await storageGet(input.key, 3600); // 1 hour expiry
        return { url };
      } catch (error) {
        console.error("Get image URL error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get image URL",
        });
      }
    }),
});

export default medicalImageRouter;
