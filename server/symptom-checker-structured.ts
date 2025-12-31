import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { invokeGeminiFlash } from "./_core/gemini-dual";
import { IRAQI_MEDICAL_CONTEXT_PROMPT } from "@shared/iraqiMedicalContext";

/**
 * Simplified 10-Question Symptom Checker
 * Fixed set of 10 questions with simple inputs, Gemini-powered final assessment
 */

interface Question {
  id: string;
  text: string;
  textAr: string;
  type: "text" | "select";
  options?: Array<{
    value: string;
    label: string;
    labelAr: string;
  }>;
}

// Fixed 10 questions for symptom assessment
const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: "age",
    text: "What is your age?",
    textAr: "ما هو عمرك؟",
    type: "select",
    options: [
      { value: "0-12", label: "Child (0-12 years)", labelAr: "طفل (0-12 سنة)" },
      { value: "13-17", label: "Teenager (13-17 years)", labelAr: "مراهق (13-17 سنة)" },
      { value: "18-40", label: "Adult (18-40 years)", labelAr: "بالغ (18-40 سنة)" },
      { value: "41-60", label: "Middle-aged (41-60 years)", labelAr: "متوسط العمر (41-60 سنة)" },
      { value: "60+", label: "Senior (60+ years)", labelAr: "كبير السن (60+ سنة)" },
    ],
  },
  {
    id: "gender",
    text: "What is your gender?",
    textAr: "ما هو جنسك؟",
    type: "select",
    options: [
      { value: "male", label: "Male", labelAr: "ذكر" },
      { value: "female", label: "Female", labelAr: "أنثى" },
      { value: "other", label: "Other", labelAr: "آخر" },
    ],
  },
  {
    id: "chiefComplaint",
    text: "Describe your main symptom or concern in your own words",
    textAr: "صف عرضك أو مشكلتك الرئيسية بكلماتك الخاصة",
    type: "text",
  },
  {
    id: "duration",
    text: "How long have you had these symptoms?",
    textAr: "منذ متى وأنت تعاني من هذه الأعراض؟",
    type: "select",
    options: [
      { value: "hours", label: "A few hours", labelAr: "بضع ساعات" },
      { value: "1-3days", label: "1-3 days", labelAr: "1-3 أيام" },
      { value: "week", label: "About a week", labelAr: "حوالي أسبوع" },
      { value: "weeks", label: "Several weeks", labelAr: "عدة أسابيع" },
      { value: "months", label: "Months or longer", labelAr: "أشهر أو أكثر" },
    ],
  },
  {
    id: "severity",
    text: "How would you rate the severity of your symptoms?",
    textAr: "كيف تقيم شدة أعراضك؟",
    type: "select",
    options: [
      { value: "mild", label: "Mild - Barely noticeable", labelAr: "خفيفة - بالكاد ملحوظة" },
      { value: "moderate", label: "Moderate - Uncomfortable but manageable", labelAr: "متوسطة - مزعجة لكن يمكن تحملها" },
      { value: "severe", label: "Severe - Very distressing", labelAr: "شديدة - مؤلمة جداً" },
    ],
  },
  {
    id: "location",
    text: "Where in your body are you experiencing symptoms? (e.g., head, chest, stomach)",
    textAr: "أين تشعر بالأعراض في جسمك؟ (مثلاً: الرأس، الصدر، المعدة)",
    type: "text",
  },
  {
    id: "additionalSymptoms",
    text: "Do you have any other symptoms? (e.g., fever, nausea, fatigue)",
    textAr: "هل لديك أي أعراض أخرى؟ (مثلاً: حمى، غثيان، تعب)",
    type: "text",
  },
  {
    id: "triggers",
    text: "Does anything make your symptoms better or worse?",
    textAr: "هل هناك شيء يجعل أعراضك أفضل أو أسوأ؟",
    type: "text",
  },
  {
    id: "medicalHistory",
    text: "Do you have any chronic conditions or take regular medications?",
    textAr: "هل لديك أي أمراض مزمنة أو تتناول أدوية بانتظام؟",
    type: "text",
  },
  {
    id: "recentChanges",
    text: "Have there been any recent changes in your life, diet, or activities?",
    textAr: "هل حدثت أي تغييرات مؤخراً في حياتك أو نظامك الغذائي أو أنشطتك؟",
    type: "text",
  },
];

export const symptomCheckerStructuredRouter = router({
  /**
   * Start assessment - returns all 10 questions at once
   */
  startAssessment: publicProcedure
    .input(z.object({}).optional())
    .mutation(async () => {
      return {
        questions: ASSESSMENT_QUESTIONS,
        totalQuestions: ASSESSMENT_QUESTIONS.length,
      };
    }),

  /**
   * Generate final assessment using Gemini
   * Takes all 10 answers and produces comprehensive recommendation
   */
  generateAssessment: publicProcedure
    .input(
      z.object({
        answers: z.record(z.string(), z.any()),
        language: z.enum(["en", "ar"]).optional().default("ar"),
      })
    )
    .mutation(async ({ input }) => {
      const { answers, language } = input;

      const systemPrompt = `You are an expert medical AI assistant providing preliminary health assessments for patients in Iraq.

${IRAQI_MEDICAL_CONTEXT_PROMPT}

CRITICAL INSTRUCTIONS:
1. Provide responses in ${language === "ar" ? "Arabic" : "English"}
2. Be thorough, compassionate, and clear
3. Always prioritize patient safety
4. Provide actionable, specific recommendations
5. Consider Iraqi healthcare context and available resources
6. Analyze ALL provided information carefully

Return a JSON object with this EXACT structure:
{
  "urgencyLevel": "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF-CARE",
  "urgencyDescription": "Clear explanation of urgency level",
  "timelineForCare": "Specific timeline (e.g., 'Seek care immediately', 'Within 24 hours', 'Within a week')",
  "possibleConditions": [
    {
      "condition": "condition name",
      "confidence": 85,
      "description": "brief description",
      "severity": "mild" | "moderate" | "severe" | "critical"
    }
  ],
  "recommendedActions": [
    "specific action 1",
    "specific action 2",
    "specific action 3"
  ],
  "redFlagSymptoms": [
    "warning sign to watch for 1",
    "warning sign to watch for 2"
  ],
  "selfCareInstructions": [
    "self-care instruction 1",
    "self-care instruction 2",
    "self-care instruction 3"
  ],
  "specialistReferral": "specialist type if needed, or empty string",
  "emergencyWarning": "urgent warning if emergency situation, or empty string"
}`;

      // Format answers for AI
      const formattedAnswers = `
Patient Assessment:
1. Age: ${answers.age || "Not provided"}
2. Gender: ${answers.gender || "Not provided"}
3. Main Complaint: ${answers.chiefComplaint || "Not provided"}
4. Duration: ${answers.duration || "Not provided"}
5. Severity: ${answers.severity || "Not provided"}
6. Location: ${answers.location || "Not provided"}
7. Additional Symptoms: ${answers.additionalSymptoms || "None mentioned"}
8. Triggers/Relievers: ${answers.triggers || "None mentioned"}
9. Medical History: ${answers.medicalHistory || "None mentioned"}
10. Recent Changes: ${answers.recentChanges || "None mentioned"}
`;

      const userPrompt = `${formattedAnswers}

Based on this complete patient assessment, provide:
1. Urgency level (EMERGENCY/URGENT/ROUTINE/SELF-CARE)
2. Top 3-5 possible conditions with confidence scores (0-100)
3. Specific recommended actions
4. Red flag symptoms to watch for
5. Self-care instructions
6. Timeline for seeking care
7. Specialist referral if needed
8. Emergency warning if applicable

Return ONLY valid JSON, no markdown formatting.`;

      try {
        // Use Gemini Flash for fast triage (temperature 0.2 for strict adherence)
        const content = await invokeGeminiFlash(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          {
            temperature: 0.2,
            thinkingLevel: 'low',
            systemInstruction: 'Provide immediate triage assessment. Use urgency levels: Red (Emergency), Yellow (Urgent), Green (Routine). Be concise and actionable.'
          }
        );
        
        // content is already a string from invokeGeminiFlash
        console.log("[Symptom Checker] Raw AI response:", content);

        // Extract JSON from markdown code blocks if present
        let jsonContent = content.trim();
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }

        // Try to parse JSON
        let assessment;
        try {
          assessment = JSON.parse(jsonContent);
        } catch (parseError) {
          console.error("[Symptom Checker] JSON parse error:", parseError);
          console.error("[Symptom Checker] Failed content:", jsonContent);
          throw new Error("Failed to parse AI response as JSON");
        }

        // Validate required fields
        if (!assessment.urgencyLevel || !assessment.possibleConditions) {
          console.error("[Symptom Checker] Missing required fields in assessment:", assessment);
          throw new Error("AI response missing required fields");
        }

        return {
          success: true,
          urgencyLevel: assessment.urgencyLevel || "ROUTINE",
          urgencyDescription: assessment.urgencyDescription || "",
          timelineForCare: assessment.timelineForCare || "Consult a healthcare provider if symptoms persist",
          possibleConditions: assessment.possibleConditions || [],
          recommendedActions: assessment.recommendedActions || [],
          redFlagSymptoms: assessment.redFlagSymptoms || [],
          selfCareInstructions: assessment.selfCareInstructions || [],
          specialistReferral: assessment.specialistReferral || "",
          emergencyWarning: assessment.emergencyWarning || "",
        };
      } catch (error) {
        console.error("[Symptom Checker] Error generating assessment:", error);
        console.error("[Symptom Checker] Error details:", error instanceof Error ? error.message : String(error));

        // Return fallback assessment
        return {
          success: false,
          urgencyLevel: "ROUTINE",
          urgencyDescription: language === "ar"
            ? "يرجى استشارة مقدم الرعاية الصحية للحصول على تقييم مناسب"
            : "Please consult a healthcare provider for proper evaluation",
          timelineForCare: language === "ar"
            ? "استشر مقدم الرعاية الصحية في أقرب وقت ممكن"
            : "Consult a healthcare provider soon",
          possibleConditions: [],
          recommendedActions: [
            language === "ar"
              ? "استشر طبيبًا للحصول على تقييم مناسب"
              : "Consult a doctor for proper evaluation",
          ],
          redFlagSymptoms: [],
          selfCareInstructions: [
            language === "ar"
              ? "راقب الأعراض وسجل أي تغييرات"
              : "Monitor symptoms and note any changes",
          ],
          specialistReferral: "",
          emergencyWarning: "",
        };
      }
    }),

  /**
   * Get detailed information about a specific condition
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
        // Use Gemini Flash for fast triage (temperature 0.2 for strict adherence)
        const content = await invokeGeminiFlash(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          {
            temperature: 0.2,
            thinkingLevel: 'low',
            systemInstruction: 'Provide immediate triage assessment. Use urgency levels: Red (Emergency), Yellow (Urgent), Green (Routine). Be concise and actionable.'
          }
        );
        
        // content is already a string from invokeGeminiFlash

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
