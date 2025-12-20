/**
 * Audio Symptom Analysis Router
 * Processes audio input with Gemini Flash native audio support
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeGeminiFlashAudio } from "../_core/gemini-dual";
import { storagePut } from "../storage";

// Audio validation constants
const MAX_FILE_SIZE_MB = 16; // Gemini Flash limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FORMATS = ['audio/webm', 'audio/mp4', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'];

/**
 * Server-side audio validation
 */
function validateAudioServer(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum ${MAX_FILE_SIZE_MB}MB allowed.`
    };
  }

  // Check format
  if (!ALLOWED_FORMATS.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported audio format: ${mimeType}. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`
    };
  }

  // Check minimum size (at least 1KB)
  if (buffer.length < 1024) {
    return {
      valid: false,
      error: 'Audio file too small. Must be at least 1KB.'
    };
  }

  return { valid: true };
}

export const audioSymptomRouter = router({
  /**
   * Analyze symptoms from audio recording
   * Uses Gemini Flash native audio processing (no transcription needed)
   */
  analyzeAudioSymptoms: publicProcedure
    .input(
      z.object({
        audioBase64: z.string(),
        mimeType: z.string(),
        language: z.enum(['ar', 'en']).optional().default('ar'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(input.audioBase64, 'base64');

        // Server-side validation
        const validation = validateAudioServer(audioBuffer, input.mimeType);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload to storage for record keeping
        const audioKey = `symptom-audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${input.mimeType.split('/')[1]}`;
        const { url: audioUrl } = await storagePut(audioKey, audioBuffer, input.mimeType);

        // Process with Gemini Flash native audio
        const prompt = input.language === 'ar'
          ? `استمع إلى هذا التسجيل الصوتي للمريض واستخرج جميع المعلومات الطبية.

استخرج:
1. **الشكوى الرئيسية**: السبب الرئيسي للزيارة (مثل: ألم في الصدر، صداع، حمى)
2. **الأعراض**: جميع الأعراض المذكورة بالتفصيل
3. **العمر**: عمر المريض (إذا ذُكر)
4. **الجنس**: ذكر أو أنثى (إذا ذُكر)
5. **العلامات الحيوية** (إذا ذُكرت):
   - ضغط الدم (مثل: 120/80)
   - معدل ضربات القلب (مثل: 75)
   - درجة الحرارة (مثل: 37.5)
   - تشبع الأكسجين (مثل: 98)

قدم الإجابة بصيغة JSON:
{
  "chiefComplaint": "الشكوى الرئيسية",
  "symptoms": "وصف تفصيلي لجميع الأعراض",
  "patientAge": "العمر (أو null)",
  "patientGender": "male|female|null",
  "bloodPressure": "120/80 (أو null)",
  "heartRate": "75 (أو null)",
  "temperature": "37.5 (أو null)",
  "oxygenSaturation": "98 (أو null)"
}`
          : `Listen to this patient's audio recording and extract ALL medical information.

Extract:
1. **Chief Complaint**: Main reason for visit (e.g., chest pain, headache, fever)
2. **Symptoms**: All mentioned symptoms in detail
3. **Age**: Patient's age (if mentioned)
4. **Gender**: Male or female (if mentioned)
5. **Vital Signs** (if mentioned):
   - Blood pressure (e.g., 120/80)
   - Heart rate (e.g., 75)
   - Temperature (e.g., 37.5)
   - Oxygen saturation (e.g., 98)

Provide response in JSON format:
{
  "chiefComplaint": "main complaint",
  "symptoms": "detailed description of all symptoms",
  "patientAge": "age (or null)",
  "patientGender": "male|female|null",
  "bloodPressure": "120/80 (or null)",
  "heartRate": "75 (or null)",
  "temperature": "37.5 (or null)",
  "oxygenSaturation": "98 (or null)"
}`;

        // Invoke Gemini Flash with native audio processing
        const analysisText = await invokeGeminiFlashAudio(
          audioBuffer,
          input.mimeType,
          prompt,
          {
            temperature: 0.2,
            systemInstruction: 'You are a medical triage AI analyzing patient audio for symptom assessment. Listen carefully for vocal markers of distress, pain, or urgency. Consider Iraqi Arabic dialect and cultural context.'
          }
        );

        // Parse JSON response
        let analysis;
        try {
          const cleanText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          analysis = JSON.parse(cleanText);
        } catch {
          // Fallback if not JSON
          analysis = {
            chiefComplaint: analysisText.substring(0, 200),
            symptoms: analysisText,
            patientAge: null,
            patientGender: null,
            bloodPressure: null,
            heartRate: null,
            temperature: null,
            oxygenSaturation: null
          };
        }

        return {
          success: true,
          analysis,
          audioUrl,
          processingTime: Date.now(),
        };

      } catch (error) {
        console.error('[Audio Analysis] Error:', error);
        throw new Error(`Audio analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
