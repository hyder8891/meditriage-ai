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
const GREETING_AR = "مرحباً. أنا طبيبك الافتراضي، مساعدك الطبي الذكي. من فضلك أخبرني، ما هي الأعراض التي تعاني منها اليوم؟";

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

// Arabic medical term translations
const ARABIC_MEDICAL_TERMS: Record<string, string> = {
  // Common conditions
  "Common Cold": "نزلة برد عادية",
  "Flu": "إنفلونزا",
  "Influenza": "إنفلونزا",
  "COVID-19": "كوفيد-19",
  "Headache": "صداع",
  "Migraine": "صداع نصفي",
  "Tension Headache": "صداع توتري",
  "Fever": "حمى",
  "Cough": "سعال",
  "Sore Throat": "التهاب الحلق",
  "Pharyngitis": "التهاب البلعوم",
  "Tonsillitis": "التهاب اللوزتين",
  "Bronchitis": "التهاب الشعب الهوائية",
  "Pneumonia": "التهاب الرئة",
  "Asthma": "ربو",
  "Allergies": "حساسية",
  "Allergic Rhinitis": "التهاب الأنف التحسسي",
  "Sinusitis": "التهاب الجيوب الأنفية",
  "Gastritis": "التهاب المعدة",
  "Gastroenteritis": "التهاب المعدة والأمعاء",
  "Food Poisoning": "تسمم غذائي",
  "Diarrhea": "إسهال",
  "Constipation": "إمساك",
  "Nausea": "غثيان",
  "Vomiting": "قيء",
  "Abdominal Pain": "ألم في البطن",
  "Back Pain": "ألم في الظهر",
  "Joint Pain": "ألم في المفاصل",
  "Arthritis": "التهاب المفاصل",
  "Muscle Pain": "ألم عضلي",
  "Chest Pain": "ألم في الصدر",
  "Heart Attack": "نوبة قلبية",
  "Hypertension": "ارتفاع ضغط الدم",
  "High Blood Pressure": "ارتفاع ضغط الدم",
  "Diabetes": "السكري",
  "Type 2 Diabetes": "السكري من النوع الثاني",
  "Urinary Tract Infection": "التهاب المسالك البولية",
  "UTI": "التهاب المسالك البولية",
  "Kidney Infection": "التهاب الكلى",
  "Skin Rash": "طفح جلدي",
  "Eczema": "أكزيما",
  "Dermatitis": "التهاب الجلد",
  "Anxiety": "قلق",
  "Depression": "اكتئاب",
  "Insomnia": "أرق",
  "Fatigue": "إرهاق",
  "Dizziness": "دوخة",
  "Vertigo": "دوار",
  "Anemia": "فقر الدم",
  "Dehydration": "جفاف",
  // Specialties
  "General Practitioner": "طبيب عام",
  "Cardiologist": "طبيب قلب",
  "Neurologist": "طبيب أعصاب",
  "Gastroenterologist": "طبيب جهاز هضمي",
  "Pulmonologist": "طبيب رئة",
  "Dermatologist": "طبيب جلدية",
  "Orthopedist": "طبيب عظام",
  "Urologist": "طبيب مسالك بولية",
  "Psychiatrist": "طبيب نفسي",
  "ENT Specialist": "طبيب أنف وأذن وحنجرة",
  "Ophthalmologist": "طبيب عيون",
  "Pediatrician": "طبيب أطفال",
  "Gynecologist": "طبيب نسائية",
  "Endocrinologist": "طبيب غدد صماء",
  // Tests
  "Blood Test": "تحليل دم",
  "Complete Blood Count": "تعداد دم كامل",
  "CBC": "تعداد دم كامل",
  "X-Ray": "أشعة سينية",
  "CT Scan": "أشعة مقطعية",
  "MRI": "رنين مغناطيسي",
  "Ultrasound": "موجات فوق صوتية",
  "ECG": "تخطيط القلب",
  "EKG": "تخطيط القلب",
  "Urine Test": "تحليل بول",
  "Stool Test": "تحليل براز",
  "Blood Sugar": "سكر الدم",
  "Thyroid Function": "وظائف الغدة الدرقية",
  "Liver Function": "وظائف الكبد",
  "Kidney Function": "وظائف الكلى",
};

/**
 * Translate medical term to Arabic if available
 */
function translateToArabic(term: string): string {
  // Check exact match
  if (ARABIC_MEDICAL_TERMS[term]) {
    return ARABIC_MEDICAL_TERMS[term];
  }
  
  // Check case-insensitive match
  const lowerTerm = term.toLowerCase();
  for (const [key, value] of Object.entries(ARABIC_MEDICAL_TERMS)) {
    if (key.toLowerCase() === lowerTerm) {
      return value;
    }
  }
  
  // Return original if no translation found
  return term;
}

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
    ? 'IMPORTANT: You must respond ONLY in Arabic language. All questions and responses must be in Arabic. Do not use any English words.'
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
    ${language === 'ar' ? '4. Respond ONLY in Arabic language. No English words allowed.' : ''}

    OUTPUT FORMAT (JSON ONLY):
    {
      "extracted": {
        "symptoms": ["list", "of", "new", "symptoms"],
        "duration": "string or null",
        "severity": "string or null",
        "location": "string or null"
      },
      "nextQuestion": "Your question here${language === 'ar' ? ' (must be in Arabic only)' : ''}"
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
    
    // Build comprehensive message based on language
    const isArabic = language === 'ar';
    
    if (isArabic) {
      return buildArabicDiagnosisResponse(diagnosis, primaryDiagnosis, orchestrationResult, brainResult, triageLevel, vector);
    } else {
      return buildEnglishDiagnosisResponse(diagnosis, primaryDiagnosis, orchestrationResult, brainResult, triageLevel, vector);
    }
    
  } catch (error) {
    console.error('[AI DOCTOR] Error generating comprehensive diagnosis:', error);
    
    // Fallback response based on language
    if (language === 'ar') {
      return {
        message: `## 🩺 نتيجة التقييم الطبي

أعتذر، ولكنني أواجه صعوبة في إنشاء تقييم شامل في الوقت الحالي.

### التوصيات
بناءً على الأعراض التي ذكرتها، أنصحك بما يلي:

• **استشارة طبيب متخصص** للحصول على تقييم دقيق
• **مراقبة الأعراض** وتسجيل أي تغييرات
• **طلب الرعاية الفورية** إذا تفاقمت الأعراض

---
*هذا التقييم تم إنشاؤه بواسطة طبيبك الافتراضي. وهو ليس بديلاً عن الاستشارة الطبية المتخصصة.*`,
        messageAr: `## 🩺 نتيجة التقييم الطبي

أعتذر، ولكنني أواجه صعوبة في إنشاء تقييم شامل في الوقت الحالي.

### التوصيات
بناءً على الأعراض التي ذكرتها، أنصحك بما يلي:

• **استشارة طبيب متخصص** للحصول على تقييم دقيق
• **مراقبة الأعراض** وتسجيل أي تغييرات
• **طلب الرعاية الفورية** إذا تفاقمت الأعراض

---
*هذا التقييم تم إنشاؤه بواسطة طبيبك الافتراضي. وهو ليس بديلاً عن الاستشارة الطبية المتخصصة.*`,
        conversationStage: "complete" as const,
        triageLevel: "yellow" as const,
        triageReason: "تعذر إكمال التقييم الكامل",
        triageReasonAr: "تعذر إكمال التقييم الكامل",
        recommendations: [
          "استشارة طبيب متخصص",
          "مراقبة الأعراض",
          "طلب الرعاية الفورية إذا تفاقمت الأعراض"
        ],
        recommendationsAr: [
          "استشارة طبيب متخصص",
          "مراقبة الأعراض",
          "طلب الرعاية الفورية إذا تفاقمت الأعراض"
        ],
        differentialDiagnosis: [],
        showActions: true,
        context: vector.toJSON(),
        quickReplies: []
      };
    }
    
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

/**
 * Build a well-structured Arabic diagnosis response
 */
function buildArabicDiagnosisResponse(
  diagnosis: any,
  primaryDiagnosis: any,
  orchestrationResult: any,
  brainResult: any,
  triageLevel: 'green' | 'yellow' | 'red',
  vector: ConversationalContextVector
) {
  // Translate condition name to Arabic
  const conditionAr = primaryDiagnosis ? translateToArabic(primaryDiagnosis.condition) : "غير محدد";
  // Fix: Handle both 0-1 (decimal) and 0-100 (percentage) probability formats
  const rawProbability = primaryDiagnosis?.probability || 0;
  const confidencePercent = rawProbability > 1 
    ? Math.min(Math.round(rawProbability), 100)  // Already a percentage, cap at 100
    : Math.round(rawProbability * 100);           // Convert decimal to percentage
  
  // Build triage level text
  const triageLevelText = {
    green: "🟢 رعاية روتينية",
    yellow: "🟡 رعاية عاجلة",
    red: "🔴 حالة طوارئ"
  }[triageLevel];
  
  let message = `## 🩺 نتيجة التقييم الطبي الشامل

### مستوى الأولوية
${triageLevelText}

---

### التشخيص الأولي
`;

  if (primaryDiagnosis) {
    message += `**${conditionAr}**
- نسبة الثقة: ${confidencePercent}%
- التفسير: ${primaryDiagnosis.reasoning || "بناءً على تحليل الأعراض المذكورة"}

`;
  }

  // Add differential diagnoses
  if (diagnosis.differentialDiagnosis && diagnosis.differentialDiagnosis.length > 1) {
    message += `### التشخيصات المحتملة الأخرى
`;
    diagnosis.differentialDiagnosis.slice(1, 4).forEach((dd: any, idx: number) => {
      const ddAr = translateToArabic(dd.condition);
      const ddProb = dd.probability > 1 ? Math.min(Math.round(dd.probability), 100) : Math.round(dd.probability * 100);
      message += `${idx + 2}. **${ddAr}** - ${ddProb}%
`;
    });
    message += `
`;
  }

  // Add red flags if any
  if (diagnosis.redFlags && diagnosis.redFlags.length > 0) {
    message += `### ⚠️ علامات تحذيرية مهمة
`;
    diagnosis.redFlags.forEach((flag: string) => {
      message += `• ${flag}
`;
    });
    message += `
`;
  }

  // Add recommendations
  if (diagnosis.recommendations) {
    const recs = diagnosis.recommendations;
    
    if (recs.immediateActions && recs.immediateActions.length > 0) {
      message += `### الإجراءات الفورية المطلوبة
`;
      recs.immediateActions.forEach((action: string) => {
        message += `• ${action}
`;
      });
      message += `
`;
    }
    
    if (recs.tests && recs.tests.length > 0) {
      message += `### الفحوصات الموصى بها
`;
      recs.tests.forEach((test: string) => {
        const testAr = translateToArabic(test);
        message += `• ${testAr}
`;
      });
      message += `
`;
    }
    
    if (recs.referrals && recs.referrals.length > 0) {
      message += `### التحويلات للأطباء المتخصصين
`;
      recs.referrals.forEach((ref: string) => {
        const refAr = translateToArabic(ref);
        message += `• ${refAr}
`;
      });
      message += `
`;
    }
    
    if (recs.lifestyle && recs.lifestyle.length > 0) {
      message += `### نصائح لنمط الحياة
`;
      recs.lifestyle.forEach((tip: string) => {
        message += `• ${tip}
`;
      });
      message += `
`;
    }
  }

  // Add healthcare provider recommendation if available
  if (orchestrationResult && orchestrationResult.target) {
    const target = orchestrationResult.target;
    message += `### 🏥 مقدم الرعاية الصحية الموصى به
**${target.metadata.name || 'مقدم الرعاية الصحية'}**
`;
    if (target.metadata.specialty) {
      const specialtyAr = translateToArabic(target.metadata.specialty);
      message += `- التخصص: ${specialtyAr}
`;
    }
    if (target.metadata.location) {
      message += `- الموقع: ${target.metadata.location}
`;
    }
    if (target.metadata.estimatedWaitTime) {
      message += `- وقت الانتظار المتوقع: ${target.metadata.estimatedWaitTime} دقيقة
`;
    }
    message += `- درجة التطابق: ${Math.round(target.score * 100)}%

`;
  }

  // Add evidence if available
  if (brainResult.evidence && brainResult.evidence.length > 0) {
    message += `### 📚 المراجع الطبية الداعمة
`;
    brainResult.evidence.slice(0, 3).forEach((ev: any) => {
      message += `• ${ev.title} (${ev.source})
`;
    });
    message += `
`;
  }

  message += `---
*هذا التقييم تم إنشاؤه بواسطة طبيبك الافتراضي باستخدام الذكاء الاصطناعي الطبي المتقدم.*
*⚕️ تنبيه: هذا التقييم لا يغني عن استشارة الطبيب المتخصص. يرجى مراجعة طبيب للحصول على التشخيص والعلاج المناسب.*`;

  // Build Arabic recommendations array
  const recommendationsAr: string[] = [];
  if (diagnosis.recommendations?.immediateActions) {
    recommendationsAr.push(...diagnosis.recommendations.immediateActions);
  }
  
  // Normalize probability for mostLikelyCondition
  const normalizedProbability = primaryDiagnosis?.probability 
    ? (primaryDiagnosis.probability > 1 ? primaryDiagnosis.probability / 100 : primaryDiagnosis.probability)
    : 0;

  return {
    message: message,
    messageAr: message,
    conversationStage: "complete" as const,
    triageLevel,
    triageReason: primaryDiagnosis?.reasoning || "بناءً على تحليل الأعراض",
    triageReasonAr: primaryDiagnosis?.reasoning || "بناءً على تحليل الأعراض",
    recommendations: recommendationsAr,
    recommendationsAr: recommendationsAr,
    mostLikelyCondition: primaryDiagnosis ? {
      condition: conditionAr,
      probability: normalizedProbability,
      reasoning: primaryDiagnosis.reasoning || "بناءً على تحليل الأعراض المذكورة"
    } : null,
    differentialDiagnosis: diagnosis.differentialDiagnosis.map((dd: any) => ({
      condition: translateToArabic(dd.condition),
      probability: dd.probability > 1 ? dd.probability / 100 : dd.probability,
      reasoning: dd.reasoning
    })),
    redFlags: diagnosis.redFlags || [],
    structuredRecommendations: diagnosis.recommendations ? {
      immediateActions: diagnosis.recommendations.immediateActions || [],
      tests: diagnosis.recommendations.tests || [],
      imaging: diagnosis.recommendations.imaging || [],
      referrals: diagnosis.recommendations.referrals || [],
      lifestyle: diagnosis.recommendations.lifestyle || []
    } : undefined,
    evidence: brainResult.evidence || [],
    brainCaseId: brainResult.caseId,
    showActions: true,
    context: vector.toJSON(),
    quickReplies: [],
    resourceMatch: orchestrationResult?.target,
    deepLinks: orchestrationResult?.deepLinks
  };
}

/**
 * Build a well-structured English diagnosis response
 */
function buildEnglishDiagnosisResponse(
  diagnosis: any,
  primaryDiagnosis: any,
  orchestrationResult: any,
  brainResult: any,
  triageLevel: 'green' | 'yellow' | 'red',
  vector: ConversationalContextVector
) {
  // Fix: Handle both 0-1 (decimal) and 0-100 (percentage) probability formats
  const rawProbability = primaryDiagnosis?.probability || 0;
  const confidencePercent = rawProbability > 1 
    ? Math.min(Math.round(rawProbability), 100)  // Already a percentage, cap at 100
    : Math.round(rawProbability * 100);           // Convert decimal to percentage
  
  // Build triage level text
  const triageLevelText = {
    green: "🟢 Routine Care",
    yellow: "🟡 Urgent Care",
    red: "🔴 Emergency"
  }[triageLevel];
  
  let message = `## 🩺 Comprehensive Medical Assessment

### Priority Level
${triageLevelText}

---

### Primary Diagnosis
`;

  if (primaryDiagnosis) {
    message += `**${primaryDiagnosis.condition}**
- Confidence: ${confidencePercent}%
- Reasoning: ${primaryDiagnosis.reasoning || "Based on analysis of reported symptoms"}

`;
  }

  // Add differential diagnoses
  if (diagnosis.differentialDiagnosis && diagnosis.differentialDiagnosis.length > 1) {
    message += `### Other Possible Conditions
`;
    diagnosis.differentialDiagnosis.slice(1, 4).forEach((dd: any, idx: number) => {
      const ddProb = dd.probability > 1 ? Math.min(Math.round(dd.probability), 100) : Math.round(dd.probability * 100);
      message += `${idx + 2}. **${dd.condition}** - ${ddProb}%
`;
    });
    message += `
`;
  }

  // Add red flags if any
  if (diagnosis.redFlags && diagnosis.redFlags.length > 0) {
    message += `### ⚠️ Important Warning Signs
`;
    diagnosis.redFlags.forEach((flag: string) => {
      message += `• ${flag}
`;
    });
    message += `
`;
  }

  // Add recommendations
  if (diagnosis.recommendations) {
    const recs = diagnosis.recommendations;
    
    if (recs.immediateActions && recs.immediateActions.length > 0) {
      message += `### Immediate Actions Required
`;
      recs.immediateActions.forEach((action: string) => {
        message += `• ${action}
`;
      });
      message += `
`;
    }
    
    if (recs.tests && recs.tests.length > 0) {
      message += `### Recommended Tests
`;
      recs.tests.forEach((test: string) => {
        message += `• ${test}
`;
      });
      message += `
`;
    }
    
    if (recs.referrals && recs.referrals.length > 0) {
      message += `### Specialist Referrals
`;
      recs.referrals.forEach((ref: string) => {
        message += `• ${ref}
`;
      });
      message += `
`;
    }
    
    if (recs.lifestyle && recs.lifestyle.length > 0) {
      message += `### Lifestyle Recommendations
`;
      recs.lifestyle.forEach((tip: string) => {
        message += `• ${tip}
`;
      });
      message += `
`;
    }
  }

  // Add healthcare provider recommendation if available
  if (orchestrationResult && orchestrationResult.target) {
    const target = orchestrationResult.target;
    message += `### 🏥 Recommended Healthcare Provider
**${target.metadata.name || 'Healthcare Provider'}**
`;
    if (target.metadata.specialty) {
      message += `- Specialty: ${target.metadata.specialty}
`;
    }
    if (target.metadata.location) {
      message += `- Location: ${target.metadata.location}
`;
    }
    if (target.metadata.estimatedWaitTime) {
      message += `- Estimated Wait: ${target.metadata.estimatedWaitTime} minutes
`;
    }
    message += `- Match Score: ${Math.round(target.score * 100)}%

`;
  }

  // Add evidence if available
  if (brainResult.evidence && brainResult.evidence.length > 0) {
    message += `### 📚 Supporting Medical References
`;
    brainResult.evidence.slice(0, 3).forEach((ev: any) => {
      message += `• ${ev.title} (${ev.source})
`;
    });
    message += `
`;
  }

  message += `---
*This assessment was generated by AI Doctor using advanced medical AI.*
*⚕️ Disclaimer: This assessment does not replace professional medical consultation. Please consult a doctor for proper diagnosis and treatment.*`;

  // Build recommendations array
  const recommendations: string[] = [];
  if (diagnosis.recommendations?.immediateActions) {
    recommendations.push(...diagnosis.recommendations.immediateActions);
  }
  
  // Build Arabic version of the message
  const messageAr = buildArabicDiagnosisResponse(diagnosis, primaryDiagnosis, orchestrationResult, brainResult, triageLevel, vector).message;
  
  // Normalize probability for mostLikelyCondition
  const normalizedProbability = primaryDiagnosis?.probability 
    ? (primaryDiagnosis.probability > 1 ? primaryDiagnosis.probability / 100 : primaryDiagnosis.probability)
    : 0;

  return {
    message: message,
    messageAr: messageAr,
    conversationStage: "complete" as const,
    triageLevel,
    triageReason: primaryDiagnosis?.reasoning || "Based on symptom analysis",
    triageReasonAr: primaryDiagnosis?.reasoning || "بناءً على تحليل الأعراض",
    recommendations: recommendations,
    recommendationsAr: recommendations,
    mostLikelyCondition: primaryDiagnosis ? {
      condition: primaryDiagnosis.condition,
      probability: normalizedProbability,
      reasoning: primaryDiagnosis.reasoning || "Based on analysis of reported symptoms"
    } : null,
    differentialDiagnosis: diagnosis.differentialDiagnosis.map((dd: any) => ({
      condition: dd.condition,
      probability: dd.probability > 1 ? dd.probability / 100 : dd.probability,
      reasoning: dd.reasoning
    })),
    redFlags: diagnosis.redFlags || [],
    structuredRecommendations: diagnosis.recommendations ? {
      immediateActions: diagnosis.recommendations.immediateActions || [],
      tests: diagnosis.recommendations.tests || [],
      imaging: diagnosis.recommendations.imaging || [],
      referrals: diagnosis.recommendations.referrals || [],
      lifestyle: diagnosis.recommendations.lifestyle || []
    } : undefined,
    evidence: brainResult.evidence || [],
    brainCaseId: brainResult.caseId,
    showActions: true,
    context: vector.toJSON(),
    quickReplies: [],
    resourceMatch: orchestrationResult?.target,
    deepLinks: orchestrationResult?.deepLinks
  };
}
