import { invokeLLM } from "./_core/llm";
import { ConversationalContextVector } from "./conversational-context-vector";
import { BRAIN } from "./brain/index";
import { executeAvicennaLoop } from "./brain/orchestrator";
import type { User } from "../drizzle/schema";

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
const GREETING_AR = "مرحباً. أنا AI Doctor، مساعدك الطبي الذكي. من فضلك أخبرني، ما هي الأعراض التي تعاني منها اليوم؟";

// Fallback questions in Arabic
const FALLBACK_QUESTIONS_AR = [
  "ما هو العرض الرئيسي الذي يزعجك؟",
  "منذ متى وأنت تعاني من هذه الأعراض؟",
  "على مقياس من 1 إلى 10، ما مدى شدته؟",
  "أين بالضبط الألم أو المشكلة؟",
  "هل لديك حمى أو ارتفاع في درجة الحرارة؟",
  "هل تناولت أي أدوية لهذا؟",
  "هل لديك أي حالات طبية موجودة؟",
  "هل هناك شيء يجعل الأعراض أفضل أو أسوأ؟",
  "هل تعاني من أي أعراض أخرى؟",
  "هل هناك أي شيء آخر يجب أن أعرفه؟",
];

/**
 * Simple helper to get fallback question in the correct language
 */
function getFallbackQuestion(index: number, language: string): string {
  const idx = Math.min(index, 9);
  return language === 'ar' ? FALLBACK_QUESTIONS_AR[idx] : FALLBACK_QUESTIONS[idx];
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
  contextData: any,
  conversationHistory: any[] = [],
  language: string = 'en',
  userId?: number,
  userInfo?: { age: number; gender: 'male' | 'female' | 'other'; medicalHistory?: string[]; location?: string }
) {
  // 1. Rehydrate
  const vector = new ConversationalContextVector(contextData);
  
  // 🔬 DEBUG: Print Step to Console
  console.log(`[AI DOCTOR] Processing Step ${vector.stepCount}. Input: "${message}"`);
  console.log(`[AI DOCTOR] Current Symptoms:`, vector.symptoms);

  // 2. Identify Current State
  const currentStep = vector.stepCount;
  const isFinalStep = currentStep >= 7; // Trigger after 8 questions (step 0-7)

  // 3. If final step, generate comprehensive diagnosis using BRAIN + Avicenna-X
  if (isFinalStep) {
    return await generateComprehensiveDiagnosis(vector, message, language, userId, userInfo);
  }

  // 4. Prompt Engineering for symptom gathering
  const languageInstruction = language === 'ar'
    ? 'IMPORTANT: You must respond in Arabic language. All questions and responses must be in Arabic.'
    : '';
  
  const systemPrompt = `
    ROLE: AI Doctor (Intelligent Medical Assistant).
    TASK: Step-by-step medical intake.
    ${languageInstruction}
    
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
    ${language === 'ar' ? '4. Respond in Arabic language.' : ''}

    OUTPUT FORMAT (JSON ONLY):
    {
      "extracted": {
        "symptoms": ["list", "of", "new", "symptoms"],
        "duration": "string or null",
        "severity": "string or null",
        "location": "string or null"
      },
      "nextQuestion": "Your question here${language === 'ar' ? ' (in Arabic)' : ''}"
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
      messageAr: language === 'ar' ? data.nextQuestion : data.nextQuestion,
      conversationStage: "gathering" as const,
      context: vector.toJSON(),
      quickReplies: []
    };

  } catch (error) {
    console.error("[AI DOCTOR] AI Error:", error);
    
    // Auto-Recovery
    vector.stepCount = currentStep + 1;
    const nextQ = getFallbackQuestion(vector.stepCount, language);
    
    return {
      message: nextQ,
      messageAr: language === 'ar' ? nextQ : FALLBACK_QUESTIONS_AR[Math.min(vector.stepCount, 9)],
      conversationStage: "gathering" as const,
      context: vector.toJSON(),
      quickReplies: []
    };
  }
}

/**
 * Generate comprehensive diagnosis using BRAIN + Avicenna-X orchestrator
 */
async function generateComprehensiveDiagnosis(
  vector: ConversationalContextVector,
  lastMessage: string,
  language: string,
  userId?: number,
  userInfo?: { age: number; gender: 'male' | 'female' | 'other'; medicalHistory?: string[]; location?: string }
) {
  console.log('[AI DOCTOR] Generating comprehensive diagnosis using BRAIN + Avicenna-X...');
  
  try {
    // Step 1: Use BRAIN for deep clinical reasoning
    const brain = new BRAIN();
    const brainInput = {
      symptoms: vector.symptoms.length > 0 ? vector.symptoms : [lastMessage],
      patientInfo: userInfo || {
        age: 30,
        gender: 'male' as const,
        medicalHistory: [],
        location: 'Iraq'
      },
      vitalSigns: {},
      language: language as 'en' | 'ar'
    };
    
    console.log('[AI DOCTOR] Calling BRAIN system for diagnosis...');
    const brainResult = await brain.reason(brainInput);
    console.log('[AI DOCTOR] BRAIN diagnosis complete:', brainResult.diagnosis.differentialDiagnosis[0]?.condition);
    
    // Step 2: Use Avicenna-X for resource orchestration (if userId available)
    let orchestrationResult = null;
    if (userId) {
      try {
        console.log('[AI DOCTOR] Calling Avicenna-X orchestrator for resource matching...');
        orchestrationResult = await executeAvicennaLoop(userId, {
          symptoms: vector.symptoms,
          severity: parseInt(vector.severity || '5')
        });
        console.log('[AI DOCTOR] Avicenna-X orchestration complete');
      } catch (error) {
        console.error('[AI DOCTOR] Avicenna-X orchestration failed:', error);
        // Continue without orchestration
      }
    }
    
    // Step 3: Format comprehensive response
    const diagnosis = brainResult.diagnosis;
    const primaryDiagnosis = diagnosis.differentialDiagnosis[0];
    
    // Determine triage level from BRAIN severity
    let triageLevel: 'green' | 'yellow' | 'red' = 'yellow';
    if (diagnosis.redFlags && diagnosis.redFlags.length > 0) {
      triageLevel = 'red';
    } else if (primaryDiagnosis?.probability && primaryDiagnosis.probability > 0.7) {
      triageLevel = 'yellow';
    } else {
      triageLevel = 'green';
    }
    
    // Build comprehensive message (English and Arabic)
    let messageEn = `## 🩺 Comprehensive Medical Assessment\n\n`;
    let messageAr = `## 🩺 التقييم الطبي الشامل\n\n`;
    
    // Primary Diagnosis
    if (primaryDiagnosis) {
      messageEn += `### Primary Diagnosis\n**${primaryDiagnosis.condition}** (${Math.round(primaryDiagnosis.probability * 100)}% confidence)\n\n`;
      messageEn += `${primaryDiagnosis.reasoning}\n\n`;
      
      messageAr += `### التشخيص الأساسي\n**${primaryDiagnosis.condition}** (${Math.round(primaryDiagnosis.probability * 100)}% ثقة)\n\n`;
      messageAr += `${primaryDiagnosis.reasoning}\n\n`;
    }
    
    // Differential Diagnoses
    if (diagnosis.differentialDiagnosis.length > 1) {
      messageEn += `### Other Possible Conditions\n`;
      messageAr += `### الحالات المحتملة الأخرى\n`;
      
      diagnosis.differentialDiagnosis.slice(1, 3).forEach((dd, idx) => {
        messageEn += `${idx + 2}. **${dd.condition}** (${Math.round(dd.probability * 100)}%)\n`;
        messageAr += `${idx + 2}. **${dd.condition}** (${Math.round(dd.probability * 100)}%)\n`;
      });
      messageEn += `\n`;
      messageAr += `\n`;
    }
    
    // Red Flags
    if (diagnosis.redFlags && diagnosis.redFlags.length > 0) {
      messageEn += `### ⚠️ Warning Signs\n`;
      messageAr += `### ⚠️ علامات تحذيرية\n`;
      
      diagnosis.redFlags.forEach(flag => {
        messageEn += `- ${flag}\n`;
        messageAr += `- ${flag}\n`;
      });
      messageEn += `\n`;
      messageAr += `\n`;
    }
    
    // Recommendations
    if (diagnosis.recommendations) {
      const recs = diagnosis.recommendations;
      
      if (recs.immediateActions && recs.immediateActions.length > 0) {
        messageEn += `### Immediate Actions\n`;
        messageAr += `### الإجراءات الفورية\n`;
        
        recs.immediateActions.forEach(action => {
          messageEn += `- ${action}\n`;
          messageAr += `- ${action}\n`;
        });
        messageEn += `\n`;
        messageAr += `\n`;
      }
      
      if (recs.tests && recs.tests.length > 0) {
        messageEn += `### Recommended Tests\n`;
        messageAr += `### الفحوصات الموصى بها\n`;
        
        recs.tests.forEach(test => {
          messageEn += `- ${test}\n`;
          messageAr += `- ${test}\n`;
        });
        messageEn += `\n`;
        messageAr += `\n`;
      }
      
      if (recs.referrals && recs.referrals.length > 0) {
        messageEn += `### Specialist Referrals\n`;
        messageAr += `### التحويلات للمتخصصين\n`;
        
        recs.referrals.forEach(ref => {
          messageEn += `- ${ref}\n`;
          messageAr += `- ${ref}\n`;
        });
        messageEn += `\n`;
        messageAr += `\n`;
      }
    }
    
    // Resource Matching from Avicenna-X
    if (orchestrationResult && orchestrationResult.target) {
      const target = orchestrationResult.target;
      messageEn += `### 🏥 Recommended Healthcare Provider\n`;
      messageEn += `**${target.metadata.name || 'Healthcare Provider'}**\n`;
      messageAr += `### 🏥 مقدم الرعاية الصحية الموصى به\n`;
      messageAr += `**${target.metadata.name || 'مقدم الرعاية الصحية'}**\n`;
      
      if (target.metadata.specialty) {
        messageEn += `Specialty: ${target.metadata.specialty}\n`;
        messageAr += `التخصص: ${target.metadata.specialty}\n`;
      }
      if (target.metadata.location) {
        messageEn += `Location: ${target.metadata.location}\n`;
        messageAr += `الموقع: ${target.metadata.location}\n`;
      }
      if (target.metadata.estimatedWaitTime) {
        messageEn += `Estimated Wait: ${target.metadata.estimatedWaitTime} minutes\n`;
        messageAr += `وقت الانتظار المتوقع: ${target.metadata.estimatedWaitTime} دقيقة\n`;
      }
      messageEn += `Match Score: ${Math.round(target.score * 100)}%\n\n`;
      messageAr += `درجة التطابق: ${Math.round(target.score * 100)}%\n\n`;
      
      // Deep links for navigation
      if (orchestrationResult.deepLinks) {
        messageEn += `**Get Directions:**\n`;
        messageAr += `**احصل على الاتجاهات:**\n`;
        
        if (orchestrationResult.deepLinks.googleMapsLink) {
          messageEn += `- [Google Maps](${orchestrationResult.deepLinks.googleMapsLink})\n`;
          messageAr += `- [خرائط جوجل](${orchestrationResult.deepLinks.googleMapsLink})\n`;
        }
        if (orchestrationResult.deepLinks.uberLink) {
          messageEn += `- [Book Uber](${orchestrationResult.deepLinks.uberLink})\n`;
          messageAr += `- [احجز أوبر](${orchestrationResult.deepLinks.uberLink})\n`;
        }
        messageEn += `\n`;
        messageAr += `\n`;
      }
    }
    
    // Evidence
    if (brainResult.evidence && brainResult.evidence.length > 0) {
      messageEn += `### 📚 Supporting Evidence\n`;
      messageAr += `### 📚 الأدلة الداعمة\n`;
      
      brainResult.evidence.slice(0, 3).forEach(ev => {
        messageEn += `- ${ev.title} (${ev.source})\n`;
        messageAr += `- ${ev.title} (${ev.source})\n`;
      });
      messageEn += `\n`;
      messageAr += `\n`;
    }
    
    messageEn += `---\n*This assessment is generated by AI Doctor using advanced medical AI. It is not a substitute for professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.*`;
    messageAr += `---\n*هذا التقييم تم إنشاؤه بواسطة AI Doctor باستخدام الذكاء الاصطناعي الطبي المتقدم. وهو ليس بديلاً عن الاستشارة الطبية المتخصصة. يرجى استشارة مقدم الرعاية الصحية للحصول على التشخيص والعلاج المناسب.*`;
    
    return {
      message: language === 'ar' ? messageAr : messageEn,
      messageAr: messageAr,
      conversationStage: "complete" as const,
      triageLevel,
      triageReason: primaryDiagnosis?.reasoning || "Based on symptom analysis",
      triageReasonAr: primaryDiagnosis?.reasoning || "بناءً على تحليل الأعراض",
      recommendations: diagnosis.recommendations?.immediateActions || [],
      recommendationsAr: diagnosis.recommendations?.immediateActions || [],
      differentialDiagnosis: diagnosis.differentialDiagnosis.map(dd => ({
        condition: dd.condition,
        probability: dd.probability,
        reasoning: dd.reasoning
      })),
      brainCaseId: brainResult.caseId,
      showActions: true,
      context: vector.toJSON(),
      quickReplies: [],
      // Additional data for frontend
      resourceMatch: orchestrationResult?.target,
      deepLinks: orchestrationResult?.deepLinks
    };
    
  } catch (error) {
    console.error('[AI DOCTOR] Error generating comprehensive diagnosis:', error);
    
    // Fallback to simple recommendation
    return {
      message: "I apologize, but I'm having trouble generating a comprehensive assessment at the moment. Based on your symptoms, I recommend consulting with a healthcare professional for proper evaluation and treatment.",
      messageAr: "أعتذر، ولكنني أواجه صعوبة في إنشاء تقييم شامل في الوقت الحالي. بناءً على أعراضك، أوصي بالتشاور مع أخصائي رعاية صحية للتقييم والعلاج المناسب.",
      conversationStage: "complete" as const,
      triageLevel: "yellow" as const,
      triageReason: "Unable to complete full assessment",
      recommendations: [
        "Consult a healthcare provider",
        "Monitor your symptoms",
        "Seek immediate care if symptoms worsen"
      ],
      differentialDiagnosis: [],
      showActions: true,
      context: vector.toJSON(),
      quickReplies: []
    };
  }
}
