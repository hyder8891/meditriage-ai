/**
 * Conversational Assessment Engine - HARDENED VERSION
 * 
 * Implements intelligent, context-aware conversational flow with:
 * - Robust JSON parsing with fallback questions
 * - Deterministic 10-step tracking
 * - Auto-recovery when AI fails
 */

import { invokeLLM } from "./_core/llm";
import { ConversationalContextVector } from "./conversational-context-vector";

// ============================================================================
// 🛡️ FALLBACK QUESTIONS (If AI Fails, use these based on step)
// ============================================================================

const FALLBACK_QUESTIONS = [
  "What is the main symptom bothering you?",    // Step 0
  "How long have you had these symptoms?",      // Step 1
  "On a scale of 1-10, how severe is it?",      // Step 2
  "Where exactly is the pain or issue located?",// Step 3
  "Do you have a fever or high temperature?",   // Step 4
  "Have you taken any medications for this?",   // Step 5
  "Do you have any existing medical conditions?",// Step 6
  "Does anything make the symptoms better or worse?", // Step 7
  "Are you experiencing any other symptoms?",   // Step 8
  "Is there anything else I should know?",      // Step 9
];

const FALLBACK_QUESTIONS_AR = [
  "ما هو العرض الرئيسي الذي يزعجك؟",
  "منذ متى وأنت تعاني من هذه الأعراض؟",
  "على مقياس من 1 إلى 10، ما مدى شدته؟",
  "أين بالضبط موقع الألم أو المشكلة؟",
  "هل لديك حمى أو درجة حرارة عالية؟",
  "هل تناولت أي أدوية لهذا؟",
  "هل لديك أي حالات طبية موجودة؟",
  "هل هناك أي شيء يجعل الأعراض أفضل أو أسوأ؟",
  "هل تعاني من أي أعراض أخرى؟",
  "هل هناك أي شيء آخر يجب أن أعرفه؟",
];

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
  questionCount?: number;
  stepCount?: number; // Track step count
  ruledOut?: string[]; // Items patient explicitly denied
  confirmedSymptoms?: string[]; // Symptoms patient explicitly confirmed
  conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>; // Full conversation history
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
      nameAr: string;
      probability: number;
      reasoning: string;
      reasoningAr: string;
    }>;
    recommendations: string[];
    recommendationsAr: string[];
    redFlags?: string[];
    redFlagsAr?: string[];
  };
  context: ConversationContext;
}

// ============================================================================
// Main Assessment Function - HARDENED
// ============================================================================

export async function processConversationalAssessment(
  message: string,
  contextData: any
): Promise<AssessmentResponse> {
  
  // 1. Rehydrate the Memory
  const vector = new ConversationalContextVector(contextData);
  
  // 2. Add user message to conversation history
  vector.conversationHistory.push({ role: 'user', content: message });
  
  // 3. Determine Strategy based on Step Count
  const currentStep = vector.stepCount || 0;
  const isFinalStep = currentStep >= 9; // 0-9 = 10 steps

  console.log(`📊 Assessment Step: ${currentStep + 1}/10 | isFinal: ${isFinalStep}`);

  // 3. Construct the "Doctor's Prompt"
  const systemPrompt = `
ROLE: You are Dr. Avicenna, an expert diagnostic AI for Tabibi Clinic.

TASK: Assess the patient's symptoms through a structured conversation.
CURRENT STEP: ${currentStep + 1}/10

PATIENT CONTEXT:
- Main Symptoms: ${vector.symptoms.join(", ") || "Unknown"}
- Duration: ${vector.duration || "Unknown"}
- Severity: ${vector.severity || "Unknown"}
- Location: ${vector.location || "Unknown"}
- Last User Input: "${message}"

INSTRUCTIONS:
${isFinalStep 
  ? `This is the final step. Provide:
     1. A triage recommendation (EMERGENCY, URGENT, ROUTINE, or SELF_CARE)
     2. Possible conditions with probabilities
     3. Clear recommendations
     4. Any red flags to watch for` 
  : `CRITICAL: Review the conversation history to see what questions you've already asked and what answers the patient provided.
     DO NOT repeat questions that have already been answered.
     Ask the SINGLE most important NEXT question to narrow down the diagnosis.
     Be empathetic but concise. Focus on gathering NEW critical information that hasn't been provided yet.`}

OUTPUT FORMAT:
You MUST return ONLY valid JSON. No markdown. No explanations. Just pure JSON.

${isFinalStep ? `
{
  "nextQuestion": "Thank you for providing all this information. Let me analyze your symptoms.",
  "nextQuestionAr": "شكراً لتقديم كل هذه المعلومات. دعني أحلل أعراضك.",
  "extractedData": {
    "symptoms": ["symptom1", "symptom2"],
    "duration": "duration if mentioned",
    "severity": "severity if mentioned",
    "location": "location if mentioned"
  },
  "triage": {
    "urgency": "ROUTINE",
    "possibleConditions": [
      {
        "name": "Condition Name",
        "nameAr": "اسم الحالة",
        "probability": 75,
        "reasoning": "Why this condition is likely",
        "reasoningAr": "لماذا هذه الحالة محتملة"
      }
    ],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "recommendationsAr": ["توصية 1", "توصية 2"],
    "redFlags": ["Red flag 1"],
    "redFlagsAr": ["علامة حمراء 1"]
  },
  "isFinal": true
}
` : `
{
  "nextQuestion": "The question to ask the patient in English",
  "nextQuestionAr": "السؤال باللغة العربية",
  "extractedData": {
    "symptoms": ["new symptom 1", "new symptom 2"],
    "duration": "extracted duration if present",
    "severity": "extracted severity if present",
    "location": "extracted location if present"
  },
  "isFinal": false
}
`}
`;

  try {
    // 4. Build conversation messages with full history
    const conversationMessages = [
      { role: "system" as const, content: systemPrompt },
      ...vector.conversationHistory.slice(-20).map(msg => ({ // Last 20 messages to avoid token limits
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // 5. Call the AI with full conversation history
    const response = await invokeLLM({
      messages: conversationMessages
    });
    
    // 5. Parse the Response (Robust JSON Extraction)
    let content = response.choices?.[0]?.message?.content || "";
    
    // Handle array content (extract text from first element)
    if (Array.isArray(content)) {
      const textContent = content.find(c => c.type === "text");
      content = textContent?.text || "";
    }
    
    // Clean the string in case the AI wraps it in ```json ... ```
    const cleanJson = typeof content === "string" ? content.replace(/```json|```/g, '').trim() : "";
    const data = JSON.parse(cleanJson);

    console.log("✅ AI Response parsed successfully:", data);
    
    // 6. Add assistant response to conversation history
    const assistantMessage = data.nextQuestion || data.message || "Let me analyze your symptoms.";
    vector.conversationHistory.push({ role: 'assistant', content: assistantMessage });

    // 7. Update Vector with AI's extraction
    if (data.extractedData) {
      if (data.extractedData.symptoms && Array.isArray(data.extractedData.symptoms)) {
        vector.updateSymptoms(data.extractedData.symptoms);
      }
      if (data.extractedData.duration) vector.duration = data.extractedData.duration;
      if (data.extractedData.severity) vector.severity = data.extractedData.severity;
      if (data.extractedData.location) vector.location = data.extractedData.location;
    }

    // 8. Increment Step
    vector.stepCount = currentStep + 1;

    // 9. Build Response
    if (data.isFinal && data.triage) {
      return {
        message: data.nextQuestion || "Based on your symptoms, here's my assessment:",
        messageAr: data.nextQuestionAr || "بناءً على أعراضك، إليك تقييمي:",
        conversationStage: "analyzing",
        triageResult: {
          urgency: data.triage.urgency.toLowerCase() as any,
          possibleConditions: data.triage.possibleConditions || [],
          recommendations: data.triage.recommendations || [],
          recommendationsAr: data.triage.recommendationsAr || [],
          redFlags: data.triage.redFlags,
          redFlagsAr: data.triage.redFlagsAr
        },
        context: vector.toJSON()
      };
    }

    return {
      message: data.nextQuestion,
      messageAr: data.nextQuestionAr,
      conversationStage: "gathering",
      context: vector.toJSON()
    };

  } catch (error) {
    console.error("❌ AI Logic Failed:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    
    // 🔧 CRITICAL FIX: Increment step count BEFORE fallback to prevent infinite loops
    vector.stepCount = currentStep + 1;
    
    // Add fallback response to conversation history
    const fallbackQuestion = FALLBACK_QUESTIONS[Math.min(currentStep, FALLBACK_QUESTIONS.length - 1)];
    vector.conversationHistory.push({ role: 'assistant', content: fallbackQuestion });
    
    // 🛡️ RECOVERY MECHANISM
    // If AI crashes, we manually advance the conversation using the hardcoded list.
    // 🛡️ FALLBACK: Use deterministic questions (already added to history above)
    const fallbackQuestionAr = FALLBACK_QUESTIONS_AR[Math.min(currentStep, FALLBACK_QUESTIONS_AR.length - 1)];

    console.log(`🛡️ Using fallback question for step ${currentStep + 1}:`, vector.conversationHistory[vector.conversationHistory.length - 1].content);
    return {
      message: fallbackQuestion,
      messageAr: fallbackQuestionAr,
      conversationStage: "gathering",
      context: vector.toJSON() // Now includes incremented stepCount
    };
  }
}

// ============================================================================
// Emergency Detection (Unchanged)
// ============================================================================

const EMERGENCY_KEYWORDS = [
  // Cardiovascular
  "chest pain", "crushing chest", "heart attack", "can't breathe", "difficulty breathing",
  "severe chest pressure", "radiating pain", "arm pain with chest",
  
  // Neurological
  "stroke", "face drooping", "slurred speech", "sudden weakness", "severe headache",
  "worst headache", "thunderclap headache", "confusion", "loss of consciousness",
  "seizure", "convulsion",
  
  // Trauma
  "severe bleeding", "heavy bleeding", "uncontrolled bleeding", "head injury",
  "severe trauma", "broken bone", "compound fracture",
  
  // Respiratory
  "can't breathe", "choking", "blue lips", "gasping", "severe asthma attack",
  
  // Other Critical
  "suicide", "overdose", "poisoning", "severe allergic reaction", "anaphylaxis",
  "severe abdominal pain", "rigid abdomen", "coughing blood", "vomiting blood",
  "severe burn", "electric shock"
];

const EMERGENCY_KEYWORDS_AR = [
  "ألم في الصدر", "نوبة قلبية", "لا أستطيع التنفس", "صعوبة في التنفس",
  "سكتة دماغية", "تدلي الوجه", "كلام غير واضح", "ضعف مفاجئ", "صداع شديد",
  "نزيف شديد", "نزيف غزير", "إصابة في الرأس", "كسر", "اختناق",
  "شفاه زرقاء", "انتحار", "جرعة زائدة", "تسمم", "حساسية شديدة",
  "ألم بطني شديد", "سعال دم", "قيء دموي", "حرق شديد", "صدمة كهربائية"
];

export function detectEmergency(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  return EMERGENCY_KEYWORDS.some(keyword => lowerMessage.includes(keyword)) ||
         EMERGENCY_KEYWORDS_AR.some(keyword => message.includes(keyword));
}
