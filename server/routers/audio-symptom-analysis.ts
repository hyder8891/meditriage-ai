/**
 * Audio Symptom Analysis Router
 * Processes audio input with Gemini Flash native audio support
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeGeminiFlashAudio } from "../_core/gemini-dual";
import { storagePut } from "../storage";

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

        // Upload to storage for record keeping
        const audioKey = `symptom-audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${input.mimeType.split('/')[1]}`;
        const { url: audioUrl } = await storagePut(audioKey, audioBuffer, input.mimeType);

        // Process with Gemini Flash native audio
        const prompt = input.language === 'ar'
          ? `استمع إلى هذا التسجيل الصوتي للمريض وقم بتحليل الأعراض.

قدم تقييماً شاملاً يتضمن:
1. **الأعراض المذكورة**: قائمة بجميع الأعراض التي ذكرها المريض
2. **مستوى الإلحاح**: (طارئ/عاجل/شبه عاجل/روتيني)
3. **التشخيص المحتمل**: الحالات الطبية المحتملة
4. **التوصيات**: ماذا يجب أن يفعل المريض
5. **علامات الخطر**: أي علامات تحذيرية تتطلب عناية فورية

انتبه إلى:
- نبرة الصوت (ألم، ضيق تنفس، ضعف)
- السياق العراقي والثقافي
- الأمراض الشائعة في العراق

قدم الإجابة بصيغة JSON:
{
  "symptoms": ["symptom1", "symptom2"],
  "urgency": "emergency|urgent|semi-urgent|routine",
  "urgencyReason": "explanation",
  "possibleConditions": [{"name": "condition", "probability": 0.8, "reasoning": "why"}],
  "recommendations": ["recommendation1", "recommendation2"],
  "redFlags": ["flag1", "flag2"],
  "nextSteps": "what to do next",
  "estimatedWaitTime": "time estimate",
  "vocalMarkers": "observations about voice (pain, distress, etc.)"
}`
          : `Listen to this patient's audio recording and analyze their symptoms.

Provide a comprehensive assessment including:
1. **Mentioned Symptoms**: List all symptoms the patient described
2. **Urgency Level**: (emergency/urgent/semi-urgent/routine)
3. **Possible Diagnosis**: Potential medical conditions
4. **Recommendations**: What the patient should do
5. **Red Flags**: Any warning signs requiring immediate attention

Pay attention to:
- Voice tone (pain, breathing difficulty, weakness)
- Iraqi cultural context
- Common diseases in Iraq

Provide response in JSON format:
{
  "symptoms": ["symptom1", "symptom2"],
  "urgency": "emergency|urgent|semi-urgent|routine",
  "urgencyReason": "explanation",
  "possibleConditions": [{"name": "condition", "probability": 0.8, "reasoning": "why"}],
  "recommendations": ["recommendation1", "recommendation2"],
  "redFlags": ["flag1", "flag2"],
  "nextSteps": "what to do next",
  "estimatedWaitTime": "time estimate",
  "vocalMarkers": "observations about voice (pain, distress, etc.)"
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
            symptoms: [analysisText],
            urgency: 'semi-urgent',
            urgencyReason: 'Unable to parse structured response',
            possibleConditions: [],
            recommendations: [analysisText],
            redFlags: [],
            nextSteps: 'Please consult a healthcare provider',
            estimatedWaitTime: 'Unknown',
            vocalMarkers: 'Analysis completed'
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
