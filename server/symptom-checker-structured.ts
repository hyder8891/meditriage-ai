import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeDeepSeek } from "./_core/deepseek";
import { IRAQI_MEDICAL_CONTEXT_PROMPT } from "@shared/iraqiMedicalContext";

/**
 * Structured Symptom Checker with Question Flow
 * Provides step-by-step triage with multiple choice options
 */

interface Question {
  id: string;
  text: string;
  textAr: string;
  type: "single" | "multiple" | "text";
  options?: Array<{
    value: string;
    label: string;
    labelAr: string;
  }>;
  required: boolean;
}

interface ConversationState {
  answers: Record<string, any>;
  currentStep: number;
  completed: boolean;
}

export const symptomCheckerStructuredRouter = router({
  /**
   * Start new symptom assessment
   * Returns initial triage questions
   */
  startAssessment: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Initial triage questions
      const initialQuestions: Question[] = [
        {
          id: "age",
          text: "What is your age?",
          textAr: "ما هو عمرك؟",
          type: "single",
          options: [
            { value: "0-2", label: "Infant (0-2 years)", labelAr: "رضيع (0-2 سنة)" },
            { value: "3-12", label: "Child (3-12 years)", labelAr: "طفل (3-12 سنة)" },
            { value: "13-17", label: "Teenager (13-17 years)", labelAr: "مراهق (13-17 سنة)" },
            { value: "18-40", label: "Adult (18-40 years)", labelAr: "بالغ (18-40 سنة)" },
            { value: "41-60", label: "Middle-aged (41-60 years)", labelAr: "متوسط العمر (41-60 سنة)" },
            { value: "60+", label: "Senior (60+ years)", labelAr: "كبير السن (60+ سنة)" },
          ],
          required: true,
        },
        {
          id: "gender",
          text: "What is your gender?",
          textAr: "ما هو جنسك؟",
          type: "single",
          options: [
            { value: "male", label: "Male", labelAr: "ذكر" },
            { value: "female", label: "Female", labelAr: "أنثى" },
          ],
          required: true,
        },
        {
          id: "chiefComplaint",
          text: "What is your main concern or symptom?",
          textAr: "ما هي مشكلتك أو عرضك الرئيسي؟",
          type: "single",
          options: [
            { value: "pain", label: "Pain or discomfort", labelAr: "ألم أو انزعاج" },
            { value: "fever", label: "Fever or chills", labelAr: "حمى أو قشعريرة" },
            { value: "breathing", label: "Breathing problems", labelAr: "مشاكل في التنفس" },
            { value: "digestive", label: "Digestive issues", labelAr: "مشاكل هضمية" },
            { value: "skin", label: "Skin problems", labelAr: "مشاكل جلدية" },
            { value: "neurological", label: "Headache or dizziness", labelAr: "صداع أو دوخة" },
            { value: "injury", label: "Injury or trauma", labelAr: "إصابة أو صدمة" },
            { value: "other", label: "Other", labelAr: "أخرى" },
          ],
          required: true,
        },
      ];

      return {
        sessionId: `session_${Date.now()}`,
        questions: initialQuestions,
        currentStep: 0,
        totalSteps: 3,
      };
    }),

  /**
   * Get next question based on previous answers
   */
  getNextQuestion: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      answers: z.record(z.any()),
      currentStep: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { answers, currentStep } = input;

      // Generate next question based on chief complaint and previous answers
      const prompt = `Based on this patient information:
Age: ${answers.age}
Gender: ${answers.gender}
Chief Complaint: ${answers.chiefComplaint}
Previous Answers: ${JSON.stringify(answers)}

Generate the next most important clinical question to ask. Provide 4-6 multiple choice options that are medically relevant.

Return JSON in this exact format:
{
  "question": {
    "text": "English question text",
    "textAr": "Arabic question text",
    "options": [
      {"value": "option1", "label": "English label", "labelAr": "Arabic label"}
    ]
  },
  "isComplete": false
}

If you have enough information to make an assessment (after 5-7 questions), set isComplete to true.`;

      const response = await invokeDeepSeek({
        messages: [
          {
            role: "system",
            content: `You are a medical triage AI. Ask relevant follow-up questions based on symptoms.

${IRAQI_MEDICAL_CONTEXT_PROMPT}

Always provide multiple choice options. Be thorough but efficient.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "";

      try {
        const parsed = JSON.parse(content);
        return {
          question: {
            id: `q_${currentStep + 1}`,
            text: parsed.question.text,
            textAr: parsed.question.textAr,
            type: "single" as const,
            options: parsed.question.options,
            required: true,
          },
          isComplete: parsed.isComplete || currentStep >= 7,
          currentStep: currentStep + 1,
        };
      } catch (e) {
        // Fallback question if parsing fails
        return {
          question: {
            id: `q_${currentStep + 1}`,
            text: "How long have you been experiencing these symptoms?",
            textAr: "منذ متى وأنت تعاني من هذه الأعراض؟",
            type: "single" as const,
            options: [
              { value: "hours", label: "A few hours", labelAr: "بضع ساعات" },
              { value: "days", label: "1-3 days", labelAr: "1-3 أيام" },
              { value: "week", label: "About a week", labelAr: "حوالي أسبوع" },
              { value: "weeks", label: "Several weeks", labelAr: "عدة أسابيع" },
              { value: "months", label: "Months or longer", labelAr: "أشهر أو أكثر" },
            ],
            required: true,
          },
          isComplete: currentStep >= 7,
          currentStep: currentStep + 1,
        };
      }
    }),

  /**
   * Generate final assessment and recommendations
   */
  generateFinalAssessment: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      answers: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { answers } = input;

      // Generate comprehensive assessment
      const prompt = `Perform comprehensive medical triage assessment based on this patient information:

${Object.entries(answers).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}

Provide a detailed JSON assessment with this exact structure:
{
  "urgency": {
    "level": "emergency|urgent|semi-urgent|routine",
    "score": 8,
    "reasoning": "explanation of urgency level"
  },
  "possibleConditions": [
    {
      "condition": "condition name",
      "confidence": 85,
      "description": "brief description",
      "severity": "mild|moderate|severe|critical"
    }
  ],
  "recommendations": {
    "immediate": ["actions to take right now"],
    "shortTerm": ["actions within 24-48 hours"],
    "longTerm": ["follow-up care"]
  },
  "redFlags": ["warning signs requiring immediate attention"],
  "selfCare": ["home care instructions if appropriate"],
  "specialistReferral": {
    "needed": true,
    "specialty": "specialty name",
    "urgency": "immediate|soon|routine"
  },
  "patientEducation": "key information for the patient",
  "monitoringInstructions": "what to watch for"
}`;

      const response = await invokeDeepSeek({
        messages: [
          {
            role: "system",
            content: `You are an expert medical triage AI. Provide comprehensive, evidence-based assessments.

${IRAQI_MEDICAL_CONTEXT_PROMPT}

Consider Iraqi healthcare context, common diseases, and available facilities.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2500,
      });

      const content = response.choices[0]?.message?.content || "";

      try {
        const assessment = JSON.parse(content);
        return {
          ...assessment,
          conversationSummary: answers,
          timestamp: new Date().toISOString(),
        };
      } catch (e) {
        // Fallback assessment
        return {
          urgency: {
            level: "routine",
            score: 5,
            reasoning: "Unable to generate full assessment. Please consult a healthcare provider.",
          },
          possibleConditions: [],
          recommendations: {
            immediate: ["Consult with a healthcare provider"],
            shortTerm: [],
            longTerm: [],
          },
          redFlags: [],
          selfCare: [],
          specialistReferral: {
            needed: true,
            specialty: "General Practitioner",
            urgency: "routine",
          },
          patientEducation: "Please seek medical advice for proper evaluation.",
          monitoringInstructions: "Monitor your symptoms and seek help if they worsen.",
          conversationSummary: answers,
          timestamp: new Date().toISOString(),
        };
      }
    }),
});
