/**
 * Smart Form Router
 * Handles intelligent audio-to-form field extraction using Gemini Flash
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { invokeLLM } from '../_core/llm';

export const smartFormRouter = router({
  extractFieldsFromAudio: publicProcedure
    .input(z.object({
      audioBase64: z.string(),
      mimeType: z.string(),
      language: z.enum(['ar', 'en']),
      fieldSchema: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { audioBase64, mimeType, language, fieldSchema } = input;

      // Build field extraction prompt
      const fieldDescriptions = fieldSchema.map(f => 
        `- ${f.name} (${f.label}): ${f.type}`
      ).join('\n');

      const systemPrompt = language === 'ar' ? `
أنت نظام ذكي لاستخراج البيانات من الكلام الطبي العراقي.
استمع إلى التسجيل الصوتي واستخرج المعلومات التالية:

${fieldDescriptions}

قم بإرجاع JSON بالتنسيق التالي:
{
  "fields": [
    {
      "name": "اسم الحقل",
      "label": "التسمية",
      "value": "القيمة المستخرجة",
      "confidence": 0.95
    }
  ],
  "transcription": "النص الكامل للتسجيل"
}

ملاحظات:
- استخدم اللهجة العراقية في الفهم
- confidence يجب أن يكون بين 0 و 1
- إذا لم تجد قيمة لحقل، اتركه فارغاً مع confidence منخفض
- كن دقيقاً في استخراج الأعمار والتواريخ والأرقام
      ` : `
You are an intelligent system for extracting data from medical speech.
Listen to the audio recording and extract the following information:

${fieldDescriptions}

Return JSON in this format:
{
  "fields": [
    {
      "name": "field_name",
      "label": "Label",
      "value": "extracted value",
      "confidence": 0.95
    }
  ],
  "transcription": "full transcription"
}

Notes:
- confidence should be between 0 and 1
- If no value found for a field, leave empty with low confidence
- Be precise with ages, dates, and numbers
      `;

      try {
        // Use Gemini Flash for fast audio processing
        const result = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract the fields from this audio recording.' },
                {
                  type: 'file_url',
                  file_url: {
                    url: `data:${mimeType};base64,${audioBase64}`,
                    mime_type: mimeType as any,
                  },
                },
              ],
            },
          ],
        });

        // Parse the response
        const content = result.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error('No valid response from AI');
        }
        
        // Extract JSON from markdown code blocks if present
        let jsonStr: string = content;
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        
        const parsed = JSON.parse(jsonStr);
        return {
          fields: parsed.fields,
          transcription: parsed.transcription,
        };
      } catch (error) {
        console.error('Smart form extraction error:', error);
        throw new Error('Failed to extract fields from audio');
      }
    }),
});
