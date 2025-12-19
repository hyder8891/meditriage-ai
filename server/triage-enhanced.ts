import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeDeepSeek } from "./_core/deepseek";
import { SYSTEM_PROMPT_TRIAGE } from "@shared/localization";
import { IRAQI_MEDICAL_CONTEXT_PROMPT } from "@shared/iraqiMedicalContext";

const FINAL_RECOMMENDATION_PROMPT = `
Based on the conversation, provide a comprehensive final assessment in the following JSON format:

{
  "urgencyLevel": "emergency" | "urgent" | "routine" | "self-care",
  "urgencyDescription": "Brief explanation of urgency level",
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "recommendedActions": [
    "Action 1 with timeline",
    "Action 2 with timeline"
  ],
  "specialistReferral": "Type of specialist to see (if applicable)",
  "redFlagSymptoms": ["symptom1", "symptom2"] (if any),
  "selfCareInstructions": ["instruction1", "instruction2"],
  "timelineForCare": "When to seek care (e.g., 'within 24 hours', 'this week')",
  "emergencyWarning": "Warning text if emergency (or null)"
}

Urgency Level Guidelines:
- **emergency**: Life-threatening symptoms requiring immediate ER visit (chest pain, difficulty breathing, severe bleeding, stroke symptoms, severe allergic reaction)
- **urgent**: Serious symptoms requiring care within 24 hours (high fever, severe pain, persistent vomiting, signs of infection)
- **routine**: Non-urgent symptoms that should be evaluated by doctor within a week
- **self-care**: Minor symptoms manageable at home with monitoring

Provide the response ONLY as valid JSON, no additional text.
`;

export const triageEnhancedRouter = router({
  // Enhanced symptom checker with structured final recommendations
  chatWithRecommendations: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })),
      language: z.enum(['en', 'ar']).default('en'),
      requestFinalAssessment: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const { messages, language, requestFinalAssessment } = input;
      
      const systemMessage = {
        role: 'system' as const,
        content: SYSTEM_PROMPT_TRIAGE + '\n\n' + IRAQI_MEDICAL_CONTEXT_PROMPT + 
          (language === 'ar' ? '\n\n**MANDATORY**: You MUST respond in pure Arabic only. No English words whatsoever.' : ''),
      };
      
      // If requesting final assessment, add the recommendation prompt
      const finalMessages = requestFinalAssessment 
        ? [
            systemMessage,
            ...messages,
            {
              role: 'user' as const,
              content: FINAL_RECOMMENDATION_PROMPT,
            }
          ]
        : (messages[0]?.role === 'system' ? messages : [systemMessage, ...messages]);

      const response = await invokeDeepSeek({
        messages: finalMessages,
        temperature: requestFinalAssessment ? 0.3 : 0.7, // Lower temperature for structured output
      });

      const content = response.choices[0]?.message?.content || '';

      // If final assessment requested, try to parse JSON
      if (requestFinalAssessment) {
        try {
          // Extract JSON from response (in case there's extra text)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const recommendations = JSON.parse(jsonMatch[0]);
            return {
              content,
              recommendations,
              usage: response.usage,
              isFinalAssessment: true,
            };
          }
        } catch (error) {
          console.error('Failed to parse recommendations JSON:', error);
        }
      }

      return {
        content,
        recommendations: null,
        usage: response.usage,
        isFinalAssessment: false,
      };
    }),
});
