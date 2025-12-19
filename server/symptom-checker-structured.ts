import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
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
  startAssessment: publicProcedure
    .input(z.object({}).optional())
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
  getNextQuestion: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      answers: z.record(z.string(), z.unknown()),
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

If you have enough information to make an assessment (after 10-14 questions depending on severity), set isComplete to true.
For routine issues: 10 questions is sufficient.
For complex or severe issues: continue up to 14 questions to gather comprehensive information.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a medical triage AI. Ask relevant follow-up questions.

${IRAQI_MEDICAL_CONTEXT_PROMPT}

Provide multiple choice options. Be efficient. Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

      // Extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }

      try {
        const parsed = JSON.parse(jsonContent);
        return {
          question: {
            id: `q_${currentStep + 1}`,
            text: parsed.question.text,
            textAr: parsed.question.textAr,
            type: "single" as const,
            options: parsed.question.options,
            required: true,
          },
          isComplete: parsed.isComplete || currentStep >= 13,
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
          isComplete: currentStep >= 13,
          currentStep: currentStep + 1,
        };
      }
    }),

  /**
   * Generate final assessment and recommendations
   */
  generateFinalAssessment: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      answers: z.record(z.string(), z.unknown()),
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

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert medical triage AI. Provide comprehensive assessments.

${IRAQI_MEDICAL_CONTEXT_PROMPT}

Consider Iraqi healthcare context and available facilities.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content || "";
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

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

  /**
   * Get detailed information about a specific condition
   * Returns causes, progression, when to seek care, and prevention tips
   */
  getConditionDetails: publicProcedure
    .input(
      z.object({
        conditionName: z.string(),
        language: z.enum(["en", "ar"]).optional().default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const { conditionName, language } = input;

      const systemPrompt = `You are a medical information expert. Provide detailed, accurate, and easy-to-understand information about medical conditions.
${IRAQI_MEDICAL_CONTEXT_PROMPT}

Provide information in ${language === "ar" ? "Arabic" : "English"}.

Return a JSON object with this exact structure:
{
  "causes": ["cause 1", "cause 2", "cause 3"],
  "typicalProgression": "description of how the condition typically progresses",
  "whenToSeekCare": ["warning sign 1", "warning sign 2", "warning sign 3"],
  "prevention": ["prevention tip 1", "prevention tip 2", "prevention tip 3"],
  "overview": "brief overview of the condition"
}`;

      const userPrompt = `Provide detailed medical information about: ${conditionName}

Include:
1. Common causes
2. Typical progression and timeline
3. When to seek medical care (warning signs)
4. Prevention tips
5. Brief overview

Return ONLY valid JSON, no markdown formatting.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        let content = "";
        if (typeof rawContent === "string") {
          content = rawContent;
        } else if (Array.isArray(rawContent) && rawContent[0]?.type === "text") {
          content = rawContent[0].text;
        }

        // Extract JSON from markdown code blocks if present
        let jsonContent = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }

        const details = JSON.parse(jsonContent);

        return {
          conditionName,
          causes: details.causes || [],
          typicalProgression: details.typicalProgression || "Information not available",
          whenToSeekCare: details.whenToSeekCare || [],
          prevention: details.prevention || [],
          overview: details.overview || "",
        };
      } catch (error) {
        console.error("Error getting condition details:", error);
        
        // Return fallback information
        return {
          conditionName,
          causes: ["Consult a healthcare provider for specific information"],
          typicalProgression: "Progression varies by individual. Consult a healthcare provider for personalized information.",
          whenToSeekCare: [
            "Severe or worsening symptoms",
            "Symptoms that don't improve with treatment",
            "New or unusual symptoms develop",
          ],
          prevention: ["Maintain a healthy lifestyle", "Follow medical advice", "Regular check-ups"],
          overview: "Please consult a healthcare provider for detailed information about this condition.",
        };
      }
    }),
});
