/**
 * Conversational Assessment Engine
 * 
 * Implements intelligent, context-aware conversational flow for symptom assessment
 * with exactly 10 questions before providing diagnosis
 */

import { invokeLLM } from "./_core/llm";
import { ConversationalContextVector } from "./conversational-context-vector";

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
  context: ConversationalContextVector,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Context is now a class instance with methods!
  // No need to initialize - the class constructor handles it

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
  context: ConversationalContextVector
): "greeting" | "gathering" | "analyzing" {
  // First message = greeting
  if (history.length === 0) {
    return "greeting";
  }

  // NEW: Check if we've reached 10 questions
  if (context.questionCount >= TOTAL_QUESTIONS) {
    return "analyzing";
  }

  // If we have enough context, move to analysis
  const hasSymptoms = context.symptoms.length > 0;
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
  context: ConversationalContextVector,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Extract symptoms from initial message and update context
  const symptoms = await extractSymptoms(userMessage);
  context.updateSymptoms(symptoms);
  context.incrementQuestionCount();

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
    updatedContext: context.toJSON() // Serialize to JSON for tRPC transfer
  };
}

// ============================================================================
// Stage 2: Context Gathering (Follow-up Questions)
// ============================================================================

async function handleContextGathering(
  userMessage: string,
  history: ConversationMessage[],
  context: ConversationalContextVector,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Update context with new information using class methods
  await updateContextFromMessage(userMessage, context);

  // Increment question count using class method
  context.incrementQuestionCount();

  console.log(`[DEBUG] Question count: ${context.questionCount}/${TOTAL_QUESTIONS}`);
  console.log(`[DEBUG] Context state:`, context.getSummary());

  // Check if we've reached 10 questions
  if (context.questionCount >= TOTAL_QUESTIONS) {
    console.log(`[DEBUG] Reached question limit, moving to analysis phase`);
    return handleAnalysis(userMessage, history, context, language);
  }

  // Determine what information is still missing using class method
  const missingInfo = context.getMissingCriticalInfo();

  // Generate next follow-up question
  const nextQuestion = await generateFollowUpQuestion(
    missingInfo.length > 0 ? missingInfo[0] : "general",
    context,
    context.questionCount,
    language
  );

  // Generate contextual quick replies
  const quickReplies = generateQuickReplies(
    missingInfo.length > 0 ? missingInfo[0] : "general",
    context
  );

  return {
    message: nextQuestion,
    quickReplies,
    conversationStage: "gathering",
    updatedContext: context.toJSON() // Serialize to JSON for tRPC transfer
  };
}

/**
 * Extract and update context from user message using class methods
 */
async function updateContextFromMessage(
  userMessage: string,
  context: ConversationalContextVector
): Promise<void> {
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
              medications: { type: "array", items: { type: "string" } },
              age: { type: "number" },
              gender: { type: "string" }
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

    // Update context using class methods (prevents duplicates)
    if (extracted.symptoms && extracted.symptoms.length > 0) {
      context.updateSymptoms(extracted.symptoms);
    }
    if (extracted.duration) {
      context.duration = extracted.duration;
    }
    if (extracted.severity) {
      context.severity = extracted.severity;
    }
    if (extracted.location) {
      context.location = extracted.location;
    }
    if (extracted.aggravatingFactors && extracted.aggravatingFactors.length > 0) {
      context.updateAggravatingFactors(extracted.aggravatingFactors);
    }
    if (extracted.relievingFactors && extracted.relievingFactors.length > 0) {
      context.updateRelievingFactors(extracted.relievingFactors);
    }
    if (extracted.associatedSymptoms && extracted.associatedSymptoms.length > 0) {
      context.updateAssociatedSymptoms(extracted.associatedSymptoms);
    }
    if (extracted.medicalHistory && extracted.medicalHistory.length > 0) {
      context.updateMedicalHistory(extracted.medicalHistory);
    }
    if (extracted.medications && extracted.medications.length > 0) {
      context.updateMedications(extracted.medications);
    }
    if (extracted.age) {
      context.age = extracted.age;
    }
    if (extracted.gender) {
      context.gender = extracted.gender;
    }

    console.log("[updateContext] Updated context:", context.getSummary());
  } catch (error) {
    console.error("Error extracting context from message:", error);
    // Context remains unchanged if extraction fails
  }
}

/**
 * Identify what critical information is still missing
 * (This function is now redundant - use context.getMissingCriticalInfo() instead)
 * Kept for backward compatibility with other parts of the code
 */
function identifyMissingInformation(context: ConversationalContextVector): string[] {
  return context.getMissingCriticalInfo();
}

/**
 * Generate intelligent follow-up question based on missing info and question number
 */
async function generateFollowUpQuestion(
  missingInfo: string,
  context: ConversationalContextVector,
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
  context: ConversationalContextVector
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
  context: ConversationalContextVector,
  language: "en" | "ar" = "en"
): Promise<AssessmentResponse> {
  // Build comprehensive context summary using class method
  const contextSummary = context.getSummary();

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
    updatedContext: context.toJSON() // Serialize to JSON for tRPC transfer
  };
}

/**
 * Build context summary for analysis
 * (This function is now redundant - use context.getSummary() instead)
 * Kept for backward compatibility
 */
function buildContextSummary(context: ConversationalContextVector): string {
  return context.getSummary();
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
