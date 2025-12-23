/**
 * Conversational Assessment Engine
 * 
 * Implements intelligent, context-aware conversational flow for symptom assessment
 * with exactly 10 questions before providing diagnosis
 */

import { invokeLLM } from "./_core/llm";

// ============================================================================
// Types
// ============================================================================

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationContext {
  symptoms: string[];
  duration?: string;
  severity?: string;
  location?: string;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  associatedSymptoms?: string[];
  medicalHistory?: string[];
  medications?: string[];
  age?: number;
  gender?: string;
  questionCount?: number; // NEW: Track question count
}

export interface QuickReplyChip {
  text: string;
  textAr: string;
  value: string;
}

export interface AssessmentResponse {
  message: string;
  messageAr?: string;
  quickReplies?: QuickReplyChip[];
  conversationStage: "greeting" | "gathering" | "analyzing";
  triageResult?: {
    urgency: "emergency" | "urgent" | "routine" | "self_care";
    possibleConditions: Array<{
      name: string;
      probability: number;
      reasoning: string;
    }>;
    recommendations: string[];
  };
  updatedContext?: Partial<ConversationContext>;
}

// ============================================================================
// Constants
// ============================================================================

const TOTAL_QUESTIONS = 10;

// ============================================================================
// Main Processing Function
// ============================================================================

export async function processConversationalAssessment(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  context: Partial<ConversationContext>,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Initialize question count if not present
  if (context.questionCount === undefined) {
    context.questionCount = 0;
  }

  // Determine current conversation stage
  const stage = determineConversationStage(conversationHistory, context);

  // Route to appropriate handler
  switch (stage) {
    case "greeting":
      return handleGreeting(userMessage, context, language);
    case "gathering":
      return handleContextGathering(userMessage, conversationHistory, context, language);
    case "analyzing":
      return handleAnalysis(userMessage, conversationHistory, context, language);
    default:
      return handleGreeting(userMessage, context, language);
  }
}

// ============================================================================
// Stage Detection
// ============================================================================

function determineConversationStage(
  history: ConversationMessage[],
  context: Partial<ConversationContext>
): "greeting" | "gathering" | "analyzing" {
  // First message = greeting
  if (history.length === 0) {
    return "greeting";
  }

  // NEW: Check if we've reached 10 questions
  if (context.questionCount && context.questionCount >= TOTAL_QUESTIONS) {
    return "analyzing";
  }

  // If we have enough context, move to analysis
  const hasSymptoms = context.symptoms && context.symptoms.length > 0;
  const hasDuration = !!context.duration;
  const hasSeverity = !!context.severity;

  // OLD LOGIC: Move to analysis after 3 key pieces of info
  // NEW LOGIC: Only move to analysis after 10 questions
  // if (hasSymptoms && hasDuration && hasSeverity) {
  //   return "analyzing";
  // }

  // Otherwise, keep gathering context
  return "gathering";
}

// ============================================================================
// Stage 1: Greeting & Initial Symptoms
// ============================================================================

async function handleGreeting(
  userMessage: string,
  context: Partial<ConversationContext>,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Extract symptoms from initial message
  const symptoms = await extractSymptoms(userMessage);

  // Generate empathetic greeting with follow-up question
  const languageInstruction = language === "ar" 
    ? "Respond in Arabic (العربية). Use natural, conversational Arabic."
    : "Respond in English.";

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a compassionate medical AI assistant. The patient has just described their symptoms. 
Respond with:
1. Brief empathetic acknowledgment (1 sentence)
2. ONE specific follow-up question to understand duration or severity
Keep it conversational and caring. Use simple language.
${languageInstruction}`
      },
      {
        role: "user",
        content: userMessage
      }
    ]
  });

  const content = response.choices[0].message.content;
  const message = (typeof content === 'string' ? content : "I understand. Can you tell me more about when these symptoms started?") || "I understand. Can you tell me more about when these symptoms started?";

  // Generate quick reply chips for common durations
  const quickReplies: QuickReplyChip[] = [
    { text: "Just today", textAr: "اليوم فقط", value: "today" },
    { text: "2-3 days", textAr: "٢-٣ أيام", value: "2-3_days" },
    { text: "About a week", textAr: "حوالي أسبوع", value: "week" },
    { text: "More than a week", textAr: "أكثر من أسبوع", value: "more_than_week" }
  ];

  return {
    message,
    quickReplies,
    conversationStage: "gathering",
    updatedContext: { 
      symptoms,
      questionCount: 1 // Start counting questions
    }
  };
}

// ============================================================================
// Stage 2: Context Gathering (Follow-up Questions)
// ============================================================================

async function handleContextGathering(
  userMessage: string,
  history: ConversationMessage[],
  context: Partial<ConversationContext>,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Update context with new information
  const updatedContext = await updateContextFromMessage(userMessage, context);

  // Increment question count
  const currentQuestionCount = updatedContext.questionCount || 0;
  updatedContext.questionCount = currentQuestionCount + 1;

  console.log(`[DEBUG] Question count: ${updatedContext.questionCount}/${TOTAL_QUESTIONS}`);
  console.log(`[DEBUG] Context state:`, JSON.stringify(updatedContext, null, 2));

  // Check if we've reached 10 questions
  if (updatedContext.questionCount >= TOTAL_QUESTIONS) {
    console.log(`[DEBUG] Reached question limit, moving to analysis phase`);
    return handleAnalysis(userMessage, history, updatedContext, language);
  }

  // Determine what information is still missing
  const missingInfo = identifyMissingInformation(updatedContext);

  // Generate next follow-up question
  const nextQuestion = await generateFollowUpQuestion(
    missingInfo.length > 0 ? missingInfo[0] : "general",
    updatedContext,
    updatedContext.questionCount,
    language
  );

  // Generate contextual quick replies
  const quickReplies = generateQuickReplies(
    missingInfo.length > 0 ? missingInfo[0] : "general",
    updatedContext
  );

  return {
    message: nextQuestion,
    quickReplies,
    conversationStage: "gathering",
    updatedContext // Return updated context to frontend
  };
}

/**
 * Extract and update context from user message
 */
async function updateContextFromMessage(
  userMessage: string,
  currentContext: Partial<ConversationContext>
): Promise<Partial<ConversationContext>> {
  try {
    // Use LLM to extract structured information from user message
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Extract medical information from the user's message. Return a JSON object with any relevant fields.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "medical_context",
          strict: true,
          schema: {
            type: "object",
            properties: {
              symptoms: { type: "array", items: { type: "string" } },
              duration: { type: "string" },
              severity: { type: "string" },
              location: { type: "string" },
              aggravatingFactors: { type: "array", items: { type: "string" } },
              relievingFactors: { type: "array", items: { type: "string" } },
              associatedSymptoms: { type: "array", items: { type: "string" } },
              medicalHistory: { type: "array", items: { type: "string" } },
              medications: { type: "array", items: { type: "string" } }
            },
            required: [],
            additionalProperties: false
          }
        }
      }
    });

    const extractedContent = response.choices[0].message.content;
    const extractedStr = typeof extractedContent === 'string' ? extractedContent : '{}';
    const extracted = JSON.parse(extractedStr || "{}");

    // Merge with current context (filter out null values)
    const merged = {
      ...currentContext,
      symptoms: [...(currentContext.symptoms || []), ...(extracted.symptoms || [])],
      duration: extracted.duration || currentContext.duration,
      severity: extracted.severity || currentContext.severity,
      location: extracted.location || currentContext.location,
      aggravatingFactors: [...(currentContext.aggravatingFactors || []), ...(extracted.aggravatingFactors || [])],
      relievingFactors: [...(currentContext.relievingFactors || []), ...(extracted.relievingFactors || [])],
      associatedSymptoms: [...(currentContext.associatedSymptoms || []), ...(extracted.associatedSymptoms || [])],
      medicalHistory: [...(currentContext.medicalHistory || []), ...(extracted.medicalHistory || [])],
      medications: [...(currentContext.medications || []), ...(extracted.medications || [])]
    };

    // Filter out null and undefined values to ensure Zod validation passes
    // Keep empty arrays as they represent "none" answers
    return Object.fromEntries(
      Object.entries(merged).filter(([_, value]) => {
        if (value === null || value === undefined) return false;
        return true;
      })
    ) as Partial<ConversationContext>;
  } catch (error) {
    console.error("Error extracting context from message:", error);
    // Return current context unchanged if extraction fails
    return currentContext;
  }
}

/**
 * Identify what critical information is still missing
 */
function identifyMissingInformation(context: Partial<ConversationContext>): string[] {
  const missing: string[] = [];

  if (!context.symptoms || context.symptoms.length === 0) {
    missing.push("symptoms");
  }
  if (!context.duration) {
    missing.push("duration");
  }
  if (!context.severity) {
    missing.push("severity");
  }
  if (!context.location) {
    missing.push("location");
  }
  if (!context.aggravatingFactors || context.aggravatingFactors.length === 0) {
    missing.push("aggravatingFactors");
  }
  if (!context.relievingFactors || context.relievingFactors.length === 0) {
    missing.push("relievingFactors");
  }
  if (!context.associatedSymptoms || context.associatedSymptoms.length === 0) {
    missing.push("associatedSymptoms");
  }
  // Check if medicalHistory is undefined (not asked yet), not just empty
  // Empty array means "none" was answered
  if (context.medicalHistory === undefined) {
    missing.push("medicalHistory");
  }
  // Check if medications is undefined (not asked yet), not just empty
  // Empty array means "none" was answered
  if (context.medications === undefined) {
    missing.push("medications");
  }

  return missing;
}

/**
 * Generate intelligent follow-up question based on missing info and question number
 */
async function generateFollowUpQuestion(
  missingInfo: string,
  context: Partial<ConversationContext>,
  questionNumber: number,
  language: "en" | "ar" = "en"
): Promise<string> {
  // Define question templates for each missing info type
  const questionTemplatesEn: Record<string, string> = {
    symptoms: "What symptoms are you experiencing?",
    duration: "How long have you been experiencing these symptoms?",
    severity: "How would you describe the severity? Is it mild, moderate, or severe?",
    location: "Where exactly do you feel this?",
    aggravatingFactors: "Does anything make your symptoms worse?",
    relievingFactors: "Does anything make your symptoms better?",
    associatedSymptoms: "Are you experiencing any other symptoms along with this?",
    medicalHistory: "Do you have any relevant medical conditions or past health issues?",
    medications: "Are you currently taking any medications?",
    general: "Can you tell me more about your symptoms?"
  };

  const questionTemplatesAr: Record<string, string> = {
    symptoms: "ما هي الأعراض التي تعاني منها؟",
    duration: "منذ متى وأنت تعاني من هذه الأعراض؟",
    severity: "كيف تصف شدة الأعراض؟ هل هي خفيفة أم متوسطة أم شديدة؟",
    location: "أين تشعر بالضبط بهذه الأعراض؟",
    aggravatingFactors: "هل هناك شيء يجعل أعراضك أسوأ؟",
    relievingFactors: "هل هناك شيء يجعل أعراضك أفضل؟",
    associatedSymptoms: "هل تعاني من أي أعراض أخرى مع هذا؟",
    medicalHistory: "هل لديك أي حالات طبية سابقة أو مشاكل صحية؟",
    medications: "هل تتناول حاليًا أي أدوية؟",
    general: "هل يمكنك إخباري المزيد عن أعراضك؟"
  };

  // Select templates based on language
  const questionTemplates = language === "ar" ? questionTemplatesAr : questionTemplatesEn;
  const baseQuestion = questionTemplates[missingInfo] || questionTemplates.general;

  // For questions 1-3, use templates directly
  if (questionNumber <= 3) {
    return baseQuestion;
  }

  // For questions 4-10, generate contextual questions using LLM
  const languageInstruction = language === "ar" 
    ? "Respond in Arabic (العربية). Use natural, conversational Arabic."
    : "Respond in English.";

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a medical AI assistant conducting a symptom assessment. 
This is question ${questionNumber} of 10.
Generate a natural, conversational follow-up question about: ${missingInfo}.
Keep it brief (1-2 sentences) and empathetic.
Context: ${JSON.stringify(context)}
${languageInstruction}`
        },
        {
          role: "user",
          content: `Generate question about ${missingInfo}`
        }
      ]
    });

    const content = response.choices[0].message.content;
    return (typeof content === 'string' ? content : baseQuestion) || baseQuestion;
  } catch (error) {
    console.error("Error generating contextual question:", error);
    return baseQuestion;
  }
}

/**
 * Generate contextual quick reply chips
 */
function generateQuickReplies(
  missingInfo: string,
  context: Partial<ConversationContext>
): QuickReplyChip[] {
  const replyOptions: Record<string, QuickReplyChip[]> = {
    duration: [
      { text: "Just today", textAr: "اليوم فقط", value: "today" },
      { text: "2-3 days", textAr: "٢-٣ أيام", value: "2-3_days" },
      { text: "About a week", textAr: "حوالي أسبوع", value: "week" },
      { text: "More than a week", textAr: "أكثر من أسبوع", value: "more_than_week" }
    ],
    severity: [
      { text: "Mild", textAr: "خفيف", value: "mild" },
      { text: "Moderate", textAr: "متوسط", value: "moderate" },
      { text: "Severe", textAr: "شديد", value: "severe" }
    ],
    aggravatingFactors: [
      { text: "Physical activity", textAr: "النشاط البدني", value: "activity" },
      { text: "Eating", textAr: "الأكل", value: "eating" },
      { text: "Stress", textAr: "التوتر", value: "stress" },
      { text: "Nothing specific", textAr: "لا شيء محدد", value: "none" }
    ],
    relievingFactors: [
      { text: "Rest", textAr: "الراحة", value: "rest" },
      { text: "Medication", textAr: "الدواء", value: "medication" },
      { text: "Nothing helps", textAr: "لا شيء يساعد", value: "none" }
    ],
    associatedSymptoms: [
      { text: "Fever", textAr: "حمى", value: "fever" },
      { text: "Nausea", textAr: "غثيان", value: "nausea" },
      { text: "Fatigue", textAr: "إرهاق", value: "fatigue" },
      { text: "None", textAr: "لا شيء", value: "none" }
    ],
    medicalHistory: [
      { text: "Diabetes", textAr: "السكري", value: "diabetes" },
      { text: "Hypertension", textAr: "ضغط الدم", value: "hypertension" },
      { text: "Heart disease", textAr: "أمراض القلب", value: "heart" },
      { text: "None", textAr: "لا شيء", value: "none" }
    ],
    medications: [
      { text: "Yes, prescription", textAr: "نعم، بوصفة", value: "prescription" },
      { text: "Yes, over-the-counter", textAr: "نعم، بدون وصفة", value: "otc" },
      { text: "No medications", textAr: "لا أدوية", value: "none" }
    ]
  };

  return replyOptions[missingInfo] || [];
}

// ============================================================================
// Stage 3: Analysis & Triage
// ============================================================================

async function handleAnalysis(
  userMessage: string,
  history: ConversationMessage[],
  context: Partial<ConversationContext>,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Build comprehensive context summary
  const contextSummary = buildContextSummary(context);

  // Generate differential diagnosis and triage recommendation
  const languageInstruction = language === "ar" 
    ? "Provide all text fields (condition names, reasoning, recommendations) in Arabic (العربية)."
    : "Provide all text fields in English.";

  const analysisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a medical triage AI. Based on the patient's symptoms and context, provide:
1. Triage urgency level (emergency, urgent, routine, self_care)
2. Top 3 possible conditions with probability (0-100)
3. Clear, actionable recommendations

Be conservative with urgency - when in doubt, recommend seeking medical attention.
${languageInstruction}
Return your response in JSON format.`
      },
      {
        role: "user",
        content: contextSummary
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "triage_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            urgency: {
              type: "string",
              enum: ["emergency", "urgent", "routine", "self_care"]
            },
            possibleConditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  probability: { type: "number" },
                  reasoning: { type: "string" }
                },
                required: ["name", "probability", "reasoning"],
                additionalProperties: false
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["urgency", "possibleConditions", "recommendations"],
          additionalProperties: false
        }
      }
    }
  });

  const analysisContent = analysisResponse.choices[0].message.content;
  const analysisStr = typeof analysisContent === 'string' ? analysisContent : '{}';
  const triageResult = JSON.parse(analysisStr || "{}");

  // Generate human-readable summary message
  const summaryMessage = generateSummaryMessage(triageResult);

  return {
    message: summaryMessage,
    conversationStage: "analyzing",
    triageResult,
    updatedContext: context
  };
}

/**
 * Build context summary for analysis
 */
function buildContextSummary(context: Partial<ConversationContext>): string {
  const parts: string[] = [];

  if (context.symptoms && context.symptoms.length > 0) {
    parts.push(`Symptoms: ${context.symptoms.join(", ")}`);
  }
  if (context.duration) {
    parts.push(`Duration: ${context.duration}`);
  }
  if (context.severity) {
    parts.push(`Severity: ${context.severity}`);
  }
  if (context.location) {
    parts.push(`Location: ${context.location}`);
  }
  if (context.aggravatingFactors && context.aggravatingFactors.length > 0) {
    parts.push(`Aggravating factors: ${context.aggravatingFactors.join(", ")}`);
  }
  if (context.relievingFactors && context.relievingFactors.length > 0) {
    parts.push(`Relieving factors: ${context.relievingFactors.join(", ")}`);
  }
  if (context.associatedSymptoms && context.associatedSymptoms.length > 0) {
    parts.push(`Associated symptoms: ${context.associatedSymptoms.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Generate human-readable summary message
 */
function generateSummaryMessage(triageResult: any): string {
  const urgencyMessages: Record<string, string> = {
    emergency: "⚠️ Based on your symptoms, I recommend seeking emergency medical attention immediately.",
    urgent: "⚠️ Your symptoms suggest you should see a healthcare provider soon, ideally within 24 hours.",
    routine: "Based on your symptoms, I recommend scheduling an appointment with your healthcare provider.",
    self_care: "Your symptoms may be manageable with self-care, but monitor them closely."
  };

  const baseMessage = urgencyMessages[triageResult.urgency] || urgencyMessages.routine;
  
  const conditions = triageResult.possibleConditions
    .slice(0, 3)
    .map((c: any, i: number) => `${i + 1}. ${c.name} (${c.probability}%)`)
    .join("\n");

  return `${baseMessage}\n\nPossible conditions to discuss with your doctor:\n${conditions}\n\nRemember: This is not a diagnosis. Please consult a healthcare professional for proper evaluation.`;
}

/**
 * Extract symptoms from user message
 */
async function extractSymptoms(message: string): Promise<string[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Extract all symptoms mentioned in the user's message. Return as a JSON array of strings."
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "symptoms",
          strict: true,
          schema: {
            type: "object",
            properties: {
              symptoms: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["symptoms"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : '{}';
    const parsed = JSON.parse(contentStr || "{}");
    return parsed.symptoms || [];
  } catch (error) {
    console.error("Error extracting symptoms:", error);
    return [];
  }
}
