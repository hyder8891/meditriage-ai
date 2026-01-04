import { invokeLLM } from "./_core/llm";
import { ConversationalContextVector } from "./conversational-context-vector";

// Emergency Questions (Used if AI fails)
const FALLBACK_QUESTIONS = [
  "What is the main symptom bothering you?",
  "How long have you had these symptoms?",
  "On a scale of 1-10, how severe is it?",
  "Where exactly is the pain or issue located?",
  "Do you have a fever or high temperature?",
  "Have you taken any medications for this?",
  "Do you have any existing medical conditions?",
  "Does anything make the symptoms better or worse?",
  "Are you experiencing any other symptoms?",
  "Is there anything else I should know?",
];

// Greeting messages
const GREETING_EN = "Hello. I am AI Doctor, your intelligent medical assistant. Please tell me, what symptoms are you experiencing today?";
const GREETING_AR = "مرحباً. أنا طبيبك الافتراضي، مساعدك الطبي الذكي. من فضلك أخبرني، ما هي الأعراض التي تعاني منها اليوم؟";

/**
 * Generate contextual quick reply options based on conversation state
 */
function generateQuickReplies(vector: ConversationalContextVector, step: number) {
  // If no symptoms yet, provide common symptom quick replies
  if (vector.symptoms.length === 0) {
    return [
      { text: "Headache", textAr: "صداع", value: "I have a headache" },
      { text: "Fever", textAr: "حمى", value: "I have a fever" },
      { text: "Cough", textAr: "سعال", value: "I have a cough" },
      { text: "Pain", textAr: "ألم", value: "I have pain" }
    ];
  }
  
  // If symptoms exist but no duration, provide duration quick replies
  if (!vector.duration) {
    return [
      { text: "Today", textAr: "اليوم", value: "It started today" },
      { text: "Few days", textAr: "عدة أيام", value: "For a few days" },
      { text: "A week", textAr: "أسبوع", value: "About a week" },
      { text: "Longer", textAr: "أطول", value: "More than a week" }
    ];
  }
  
  // If duration exists but no severity, provide severity quick replies
  if (!vector.severity) {
    return [
      { text: "Mild", textAr: "خفيف", value: "It's mild" },
      { text: "Moderate", textAr: "متوسط", value: "It's moderate" },
      { text: "Severe", textAr: "شديد", value: "It's severe" },
      { text: "Very severe", textAr: "شديد جداً", value: "It's very severe" }
    ];
  }
  
  // Generic continuation options
  return [
    { text: "Yes", textAr: "نعم", value: "Yes" },
    { text: "No", textAr: "لا", value: "No" },
    { text: "Not sure", textAr: "غير متأكد", value: "I'm not sure" },
    { text: "Continue", textAr: "متابعة", value: "Continue" }
  ];
}

/**
 * Start a new conversation
 */
export async function startConversation(language: string = 'en') {
  const greeting = language === 'ar' ? GREETING_AR : GREETING_EN;
  
  return {
    message: greeting,
    messageAr: GREETING_AR,
    conversationStage: "greeting" as const,
    context: new ConversationalContextVector({}).toJSON(),
    quickReplies: []
  };
}

export async function processConversationalAssessment(
  message: string, 
  conversationHistory: any[] = [],
  contextData: any = {},
  language: string = 'en'
) {
  // 1. Rehydrate
  const vector = new ConversationalContextVector(contextData);
  
  // 🔬 DEBUG: Print Step to Console
  console.log(`[AVICENNA] Processing Step ${vector.stepCount}. Input: "${message}"`);
  console.log(`[AVICENNA] Current Symptoms:`, vector.symptoms);

  // 2. Identify Current State
  const currentStep = vector.stepCount;
  const isFinalStep = currentStep >= 7; // Trigger after 8 questions (step 0-7)

  // 3. If final step, generate comprehensive triage recommendation
  if (isFinalStep) {
    return await generateFinalRecommendation(vector, message, language);
  }

  // 4. Prompt Engineering for symptom gathering
  const systemPrompt = `
    ROLE: AI Doctor (Intelligent Medical Assistant).
    TASK: Step-by-step medical intake.
    
    CURRENT STATUS:
    - Step: ${currentStep + 1}/8 (will finalize at step 8)
    - Known Symptoms: ${JSON.stringify(vector.symptoms)}
    - Duration: ${vector.duration || "Unknown"}
    - Severity: ${vector.severity || "Unknown"}
    - Patient Just Said: "${message}"

    GOAL:
    1. Extract new information from the patient's message.
    2. Ask ONE focused follow-up question to gather critical details.
    3. Be conversational and empathetic.

    OUTPUT FORMAT (JSON ONLY):
    {
      "extracted": {
        "symptoms": ["list", "of", "new", "symptoms"],
        "duration": "string or null",
        "severity": "string or null",
        "location": "string or null"
      },
      "nextQuestion": "Your question here"
    }
  `;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });
    
    // Robust Parsing
    let content = response.choices[0]?.message?.content || "";
    // Handle array content (extract text from first element)
    if (Array.isArray(content)) {
      const textContent = content.find(c => c.type === "text");
      content = textContent?.text || "";
    }
    const cleanJson = typeof content === "string" ? content.replace(/```json|```/g, '').trim() : "";
    let data;
    try {
        data = cleanJson ? JSON.parse(cleanJson) : { nextQuestion: "Could you tell me more?", extracted: {} };
    } catch (e) {
        // AI returned plain text? Use it as the question.
        data = { nextQuestion: content, extracted: {} };
    }

    // 4. Update Memory
    if (data.extracted) {
      if (data.extracted.symptoms) vector.addSymptoms(data.extracted.symptoms);
      if (data.extracted.duration) vector.duration = data.extracted.duration;
      if (data.extracted.severity) vector.severity = data.extracted.severity;
      if (data.extracted.location) vector.location = data.extracted.location;
    }

    // 5. Force Progress
    vector.stepCount = currentStep + 1;

    // Generate contextual quick replies
    const quickReplies = generateQuickReplies(vector, currentStep);

    return {
      message: data.nextQuestion,
      messageAr: data.nextQuestion, // TODO: Add Arabic translation
      conversationStage: "gathering" as const,
      context: vector.toJSON(),
      quickReplies
    };

  } catch (error) {
    console.error("[AVICENNA] AI Error:", error);
    
    // Auto-Recovery
    vector.stepCount = currentStep + 1;
    const nextQ = FALLBACK_QUESTIONS[Math.min(vector.stepCount, 7)];

    // Generate contextual quick replies for fallback
    const quickReplies = generateQuickReplies(vector, currentStep);

    return {
      message: nextQ,
      messageAr: nextQ, // TODO: Add Arabic translation
      conversationStage: "gathering" as const,
      context: vector.toJSON(),
      quickReplies
    };
  }
}

/**
 * Generate final comprehensive diagnosis using BRAIN + Avicenna-X
 */
async function generateFinalRecommendation(
  vector: ConversationalContextVector,
  lastMessage: string,
  language: string
) {
  console.log('[AI DOCTOR] Generating comprehensive diagnosis using BRAIN + Avicenna-X...');
  
  const systemPrompt = `
    ROLE: AI Doctor (Intelligent Medical Assistant)
    TASK: Generate comprehensive diagnosis using BRAIN system
    
    PATIENT DATA:
    - Symptoms: ${JSON.stringify(vector.symptoms)}
    - Duration: ${vector.duration || "Unknown"}
    - Severity: ${vector.severity || "Unknown"}
    - Location: ${vector.location || "Unknown"}
    - Last Message: "${lastMessage}"
    
    INSTRUCTIONS:
    1. Analyze all symptoms and determine triage level (green/yellow/red)
    2. Provide differential diagnosis with probabilities
    3. Give clear recommendations and next steps
    4. Be empathetic but direct
    
    TRIAGE LEVELS:
    - green: Non-urgent, can wait for routine appointment
    - yellow: Urgent, should see doctor within 24 hours
    - red: Emergency, seek immediate medical attention
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "triageLevel": "green" | "yellow" | "red",
      "triageReason": "Brief explanation",
      "recommendations": ["recommendation 1", "recommendation 2"],
      "mostLikelyCondition": {
        "condition": "Most likely condition name",
        "probability": 0.85,
        "reasoning": "Brief clinical reasoning focused on key symptoms and findings"
      },
      "actionPlan": "Specific next steps for the patient"
    }
  `;
  
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please provide the final triage recommendation." }
      ]
    });
    
    // Parse response
    let content = response.choices[0]?.message?.content || "";
    if (Array.isArray(content)) {
      const textContent = content.find(c => c.type === "text");
      content = textContent?.text || "";
    }
    const cleanJson = typeof content === "string" ? content.replace(/```json|```/g, '').trim() : "";
    
    let data;
    try {
      data = cleanJson ? JSON.parse(cleanJson) : null;
    } catch (e) {
      console.error('[AVICENNA] Failed to parse final recommendation:', e);
      data = null;
    }
    
    if (!data) {
      // Fallback recommendation
      data = {
        triageLevel: "yellow",
        triageReason: "Based on your symptoms, you should consult a healthcare provider.",
        recommendations: [
          "Schedule an appointment with your doctor",
          "Monitor your symptoms",
          "Seek immediate care if symptoms worsen"
        ],
        mostLikelyCondition: null,
        actionPlan: "Please consult with a healthcare professional for proper diagnosis and treatment."
      };
    }
    
    // Map triage level to color
    const triageLevel = data.triageLevel || "yellow";
    
    // Format differential diagnosis for response
    const differentialDiagnosis = data.mostLikelyCondition ? [
      {
        condition: data.mostLikelyCondition.condition,
        probability: data.mostLikelyCondition.probability,
        reasoning: data.mostLikelyCondition.reasoning,
        confidenceScore: Math.round((data.mostLikelyCondition.probability || 0) * 100),
        evidenceStrength: "B"
      }
    ] : [];

    return {
      message: `Based on your symptoms, here is my assessment:\n\n${data.actionPlan}`,
      messageAr: data.actionPlan, // TODO: Add Arabic translation
      conversationStage: "complete" as const,
      triageLevel,
      triageReason: data.triageReason,
      triageReasonAr: data.triageReason, // TODO: Add Arabic translation
      recommendations: data.recommendations || [],
      recommendationsAr: data.recommendations || [], // TODO: Add Arabic translation
      differentialDiagnosis,
      mostLikelyCondition: data.mostLikelyCondition,
      showActions: true,
      context: vector.toJSON(),
      quickReplies: []
    };
    
  } catch (error) {
    console.error('[AVICENNA] Error generating final recommendation:', error);
    
    // Fallback response
    return {
      message: "Based on your symptoms, I recommend consulting with a healthcare professional for proper evaluation and treatment.",
      messageAr: "بناءً على أعراضك، أوصي بالتشاور مع أخصائي رعاية صحية للتقييم والعلاج المناسب.",
      conversationStage: "complete" as const,
      triageLevel: "yellow" as const,
      triageReason: "Unable to complete full assessment",
      recommendations: [
        "Consult a healthcare provider",
        "Monitor your symptoms",
        "Seek immediate care if symptoms worsen"
      ],
      mostLikelyCondition: null,
      showActions: true,
      context: vector.toJSON(),
      quickReplies: []
    };
  }
}
