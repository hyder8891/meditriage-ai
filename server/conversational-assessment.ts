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

export async function processConversationalAssessment(message: string, contextData: any) {
  // 1. Rehydrate
  const vector = new ConversationalContextVector(contextData);
  
  // 🔬 DEBUG: Print Step to Console
  console.log(`[AVICENNA] Processing Step ${vector.stepCount}. Input: "${message}"`);
  console.log(`[AVICENNA] Current Symptoms:`, vector.symptoms);

  // 2. Identify Current State
  const currentStep = vector.stepCount;
  const isFinalStep = currentStep >= 10;

  // 3. Prompt Engineering
  const systemPrompt = `
    ROLE: Dr. Avicenna (AI Diagnostic Tool).
    TASK: Step-by-step medical intake.
    
    CURRENT STATUS:
    - Step: ${currentStep + 1}/10
    - Known Symptoms: ${JSON.stringify(vector.symptoms)}
    - Duration: ${vector.duration || "Unknown"}
    - Severity: ${vector.severity || "Unknown"}
    - Patient Just Said: "${message}"

    GOAL:
    1. Extract new information from the patient's message.
    2. Decide the NEXT best question to narrow down the diagnosis.
    3. If Step is 10, provide a Triage Decision.

    OUTPUT FORMAT (JSON ONLY):
    {
      "extracted": {
        "symptoms": ["list", "of", "new", "symptoms"],
        "duration": "string or null",
        "severity": "string or null",
        "location": "string or null"
      },
      "nextQuestion": "Your question here",
      "triage": "ROUTINE" | "URGENT" | "EMERGENCY" (only for final step)
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

    return {
      message: data.nextQuestion,
      context: vector.toJSON(), // 🟢 THIS OBJECT MUST BE SENT BACK BY FRONTEND NEXT TIME
      isFinal: isFinalStep
    };

  } catch (error) {
    console.error("[AVICENNA] AI Error:", error);
    
    // Auto-Recovery
    vector.stepCount = currentStep + 1;
    const nextQ = FALLBACK_QUESTIONS[Math.min(vector.stepCount, 9)];

    return {
      message: nextQ,
      context: vector.toJSON(),
      isFinal: false
    };
  }
}
