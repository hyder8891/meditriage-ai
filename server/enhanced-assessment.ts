/**
 * Enhanced AI Assessment System
 * 
 * Features:
 * - Strict language adherence throughout the entire assessment
 * - Structured outcome format (not chat messages)
 * - Intelligent clinic/hospital/pharmacy recommendations based on symptoms and tests
 * - Concise, understandable output without references
 */

import { invokeGemini } from "./_core/gemini";
import { getESIAssessment, ESILevel, generateCoTSystemPrompt } from "./_core/med-gemini";
// Import context vector
let ConversationalContextVector: any;
try {
  ConversationalContextVector = require("./conversational-context-vector").ConversationalContextVector;
} catch {
  // Fallback simple context
  ConversationalContextVector = class {
    symptoms: string[] = [];
    duration: string = '';
    severity: string = '';
    location: string = '';
    stepCount: number = 0;
    language: string = 'en';
    age?: number;
    gender?: string;
    medicalHistory: string[] = [];
    conversationHistory: any[] = [];
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }
    
    addSymptoms(symptoms: string[]) {
      this.symptoms = Array.from(new Set([...this.symptoms, ...symptoms]));
    }
    
    addToHistory(role: string, content: string) {
      this.conversationHistory.push({ role, content });
    }
    
    toJSON() {
      return {
        symptoms: this.symptoms,
        duration: this.duration,
        severity: this.severity,
        location: this.location,
        stepCount: this.stepCount,
        language: this.language,
        age: this.age,
        gender: this.gender,
        medicalHistory: this.medicalHistory,
        conversationHistory: this.conversationHistory
      };
    }
  };
}
import { BRAIN } from "./brain/index";
import { getRecommendedClinics, searchClinics } from "./clinics";
import { matchClinicsComprehensive, MatchCriteria } from "./intelligent-clinic-matcher";
import { getUserLocation, getGovernorateByName } from "./geolocation";

// ============================================================================
// Types
// ============================================================================

export interface StructuredOutcome {
  // Severity Level
  severity: 'low' | 'moderate' | 'high' | 'critical';
  severityLabel: string;
  
  // ESI (Emergency Severity Index) - Med-Gemini Integration
  esiLevel?: ESILevel; // 1-5 (1 = most critical)
  esiAssessment?: {
    level: number;
    levelName: string;
    description: string;
    waitTime: string;
    disposition: string;
  };
  
  // Primary Finding
  primaryCondition: {
    name: string;
    confidence: number; // 0-100
    briefExplanation: string;
  };
  
  // Other Possibilities (max 3)
  otherConditions: Array<{
    name: string;
    confidence: number;
  }>;
  
  // Required Actions
  immediateActions: string[];
  
  // Required Tests
  requiredTests: Array<{
    name: string;
    reason: string;
    urgency: 'routine' | 'soon' | 'urgent';
  }>;
  
  // Specialist Referral
  specialistReferral?: {
    specialty: string;
    reason: string;
  };
  
  // Self-Care Tips
  selfCareTips: string[];
  
  // Warning Signs
  warningSignsToWatch: string[];
  
  // Recommended Facilities
  recommendedFacilities: {
    clinics: ClinicRecommendation[];
    pharmacies: PharmacyRecommendation[];
    hospitals: HospitalRecommendation[];
  };
}

export interface ClinicRecommendation {
  id: number;
  name: string;
  nameArabic?: string;
  type: string;
  specialty?: string;
  address?: string;
  phone?: string;
  matchReason: string; // Why this clinic is recommended
  matchScore: number; // 0-100
  servicesOffered: string[];
  distance?: string;
}

export interface PharmacyRecommendation {
  id: number;
  name: string;
  nameArabic?: string;
  address?: string;
  phone?: string;
  has24Hours: boolean;
  matchReason: string;
}

export interface HospitalRecommendation {
  id: number;
  name: string;
  nameArabic?: string;
  type: string;
  hasEmergency: boolean;
  has24Hours: boolean;
  bedCount?: number;
  address?: string;
  phone?: string;
  matchReason: string;
  matchScore: number;
  specialties: string[];
}

// ============================================================================
// Language Configuration
// ============================================================================

const GREETINGS = {
  en: "Hello. I am your AI medical assistant. Please describe your symptoms in detail.",
  ar: "مرحباً. أنا مساعدك الطبي الذكي. من فضلك صف أعراضك بالتفصيل."
};

const FALLBACK_QUESTIONS = {
  en: [
    "What is the main symptom bothering you?",
    "How long have you had these symptoms?",
    "On a scale of 1-10, how severe is the pain or discomfort?",
    "Where exactly do you feel the problem?",
    "Do you have a fever?",
    "Have you taken any medications?",
    "Do you have any chronic conditions?",
    "Does anything make it better or worse?"
  ],
  ar: [
    "ما هو العرض الرئيسي الذي يزعجك؟",
    "منذ متى وأنت تعاني من هذه الأعراض؟",
    "على مقياس من 1 إلى 10، ما مدى شدة الألم أو الانزعاج؟",
    "أين بالضبط تشعر بالمشكلة؟",
    "هل لديك حمى؟",
    "هل تناولت أي أدوية؟",
    "هل لديك أي أمراض مزمنة؟",
    "هل هناك شيء يجعل الأعراض أفضل أو أسوأ؟"
  ]
};

// Medical term translations
const MEDICAL_TRANSLATIONS: Record<string, string> = {
  // Conditions
  "Common Cold": "نزلة برد",
  "Flu": "إنفلونزا",
  "Headache": "صداع",
  "Migraine": "صداع نصفي",
  "Fever": "حمى",
  "Cough": "سعال",
  "Sore Throat": "التهاب الحلق",
  "Bronchitis": "التهاب الشعب الهوائية",
  "Pneumonia": "التهاب الرئة",
  "Asthma": "ربو",
  "Allergies": "حساسية",
  "Gastritis": "التهاب المعدة",
  "Food Poisoning": "تسمم غذائي",
  "Diarrhea": "إسهال",
  "Constipation": "إمساك",
  "Nausea": "غثيان",
  "Abdominal Pain": "ألم في البطن",
  "Back Pain": "ألم في الظهر",
  "Joint Pain": "ألم في المفاصل",
  "Chest Pain": "ألم في الصدر",
  "Hypertension": "ارتفاع ضغط الدم",
  "Diabetes": "السكري",
  "UTI": "التهاب المسالك البولية",
  "Skin Rash": "طفح جلدي",
  "Anxiety": "قلق",
  "Depression": "اكتئاب",
  "Fatigue": "إرهاق",
  "Dizziness": "دوخة",
  "Anemia": "فقر الدم",
  
  // Tests
  "Blood Test": "تحليل دم",
  "Complete Blood Count": "تعداد دم كامل",
  "CBC": "تعداد دم كامل",
  "X-Ray": "أشعة سينية",
  "CT Scan": "أشعة مقطعية",
  "MRI": "رنين مغناطيسي",
  "Ultrasound": "موجات فوق صوتية",
  "ECG": "تخطيط القلب",
  "Urine Test": "تحليل بول",
  "Blood Sugar": "سكر الدم",
  "Thyroid Function": "وظائف الغدة الدرقية",
  "Liver Function": "وظائف الكبد",
  "Kidney Function": "وظائف الكلى",
  
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
  
  // Severity
  "low": "منخفض",
  "moderate": "متوسط",
  "high": "مرتفع",
  "critical": "حرج",
  
  // Urgency
  "routine": "روتيني",
  "soon": "قريباً",
  "urgent": "عاجل"
};

function translate(term: string, lang: 'en' | 'ar'): string {
  if (lang === 'en') return term;
  return MEDICAL_TRANSLATIONS[term] || term;
}

/**
 * Translate match reasons to Arabic
 */
function translateMatchReason(reason: string, lang: 'en' | 'ar'): string {
  if (lang === 'en') return reason;
  
  const translations: Record<string, string> = {
    'Has laboratory services': 'يوفر خدمات المختبر',
    'Has imaging/radiology': 'يوفر الأشعة والتصوير',
    'General healthcare facility': 'مرفق رعاية صحية عام',
    'Emergency services available': 'خدمات الطوارئ متوفرة',
    '24-hour service': 'خدمة 24 ساعة',
    'Has emergency services': 'يوفر خدمة الطوارئ',
    'Offers blood tests': 'يوفر تحاليل الدم',
    'Offers X-ray': 'يوفر أشعة سينية',
    'Offers ultrasound': 'يوفر موجات فوق صوتية',
    'Near your location': 'قريب من موقعك'
  };
  
  // Check for exact match
  if (translations[reason]) {
    return translations[reason];
  }
  
  // Check for partial matches
  if (reason.includes('Offers:')) {
    return reason.replace('Offers:', 'يوفر:');
  }
  if (reason.includes('Specialties:')) {
    return reason.replace('Specialties:', 'التخصصات:');
  }
  if (reason.includes('Has') && reason.includes('specialty')) {
    return reason.replace('Has', 'يوفر').replace('specialty', 'تخصص');
  }
  
  return reason;
}

// ============================================================================
// Start Conversation
// ============================================================================

export async function startEnhancedConversation(language: 'en' | 'ar' = 'en') {
  const contextVector = new ConversationalContextVector({ language });
  
  return {
    message: GREETINGS[language],
    conversationStage: "greeting" as const,
    context: contextVector.toJSON(),
    language
  };
}

// ============================================================================
// Process Message
// ============================================================================

export async function processEnhancedAssessment(
  message: string,
  contextData: any,
  language: 'en' | 'ar' = 'en',
  userId?: number,
  userLocation?: { governorate?: string; city?: string }
) {
  // Rehydrate context
  const vector = new ConversationalContextVector(contextData);
  
  // CRITICAL: Use language from input parameter as primary, then context
  // The input language is the user's selected language from the UI
  const effectiveLanguage = language || (vector.language as 'en' | 'ar') || 'en';
  
  // Update language in vector
  if (!vector.language) {
    vector.language = effectiveLanguage;
  }
  
  console.log(`[Enhanced Assessment] Step ${vector.stepCount}, Language: ${effectiveLanguage}`);
  
  const currentStep = vector.stepCount;
  
  // Check if user explicitly requests final assessment
  const finalRequestPatterns = [
    /final.*assessment/i,
    /give.*assessment/i,
    /التقييم.*النهائي/,
    /أعطني.*التقييم/,
    /أريد.*التقييم/,
    /النتيجة.*النهائية/,
    /لا.*شيء.*آخر/,
    /nothing.*else/i,
    /no.*more/i,
    /that.*all/i,
    /هذا.*كل.*شيء/,
    /انتهيت/,
    /كفى/,
    /enough/i,
    /النهائي.*الآن/,
    /الآن.*النهائي/,
    /أريد.*النهائي/,
    /want.*final/i,
    /need.*assessment/i
  ];
  
  const userRequestsFinal = finalRequestPatterns.some(pattern => pattern.test(message));
  
  // If user explicitly requests final assessment, generate it immediately
  // Only require at least one symptom mentioned
  const hasMinimalInfo = vector.symptoms.length >= 1 || message.length > 20;
  const isFinalStep = currentStep >= 7 || (userRequestsFinal && hasMinimalInfo);
  
  // Final step - generate structured outcome
  if (isFinalStep) {
    return await generateStructuredOutcome(vector, message, effectiveLanguage, userLocation);
  }
  
  // Gathering step - ask follow-up question
  const systemPrompt = buildGatheringPrompt(vector, message, effectiveLanguage, currentStep);
  
  try {
    const response = await invokeGemini({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });
    
    let content = response.choices[0]?.message?.content || "";
    if (Array.isArray(content)) {
      const textContent = content.find((c: any) => c.type === "text") as { type: string; text?: string } | undefined;
      content = textContent?.text || "";
    }
    
    // Parse response
    let cleanJson = typeof content === "string" ? content.replace(/```json|```/g, '').trim() : "";
    let data;
    
    try {
      data = cleanJson ? JSON.parse(cleanJson) : null;
    } catch {
      // If not JSON, use as plain text question
      data = { nextQuestion: cleanJson, extracted: {} };
    }
    
    // Validate nextQuestion
    if (!data?.nextQuestion || typeof data.nextQuestion !== 'string') {
      data = { nextQuestion: FALLBACK_QUESTIONS[effectiveLanguage][Math.min(currentStep + 1, 7)], extracted: {} };
    }
    
    // Update context with extracted data
    if (data.extracted) {
      if (data.extracted.symptoms) vector.addSymptoms(data.extracted.symptoms);
      if (data.extracted.duration) vector.duration = data.extracted.duration;
      if (data.extracted.severity) vector.severity = data.extracted.severity;
      if (data.extracted.location) vector.location = data.extracted.location;
    }
    
    vector.stepCount = currentStep + 1;
    vector.addToHistory('user', message);
    vector.addToHistory('assistant', data.nextQuestion);
    
    return {
      message: data.nextQuestion,
      conversationStage: "gathering" as const,
      context: vector.toJSON(),
      language: effectiveLanguage
    };
    
  } catch (error) {
    console.error("[Enhanced Assessment] Error:", error);
    
    vector.stepCount = currentStep + 1;
    const fallbackQuestion = FALLBACK_QUESTIONS[effectiveLanguage][Math.min(currentStep + 1, 7)];
    
    return {
      message: fallbackQuestion,
      conversationStage: "gathering" as const,
      context: vector.toJSON(),
      language: effectiveLanguage
    };
  }
}

// ============================================================================
// Build Gathering Prompt
// ============================================================================

function buildGatheringPrompt(
  vector: any,
  message: string,
  language: 'en' | 'ar',
  step: number
): string {
  const langInstruction = language === 'ar'
    ? `CRITICAL: You MUST respond ONLY in Arabic (العربية). ALL text must be Arabic. NO English allowed.`
    : `Respond in English only.`;
  
  return `ROLE: Medical AI Assistant
TASK: Gather patient symptoms step by step

${langInstruction}

CURRENT STATE:
- Step: ${step + 1}/8
- Symptoms: ${JSON.stringify(vector.symptoms)}
- Duration: ${vector.duration || "Unknown"}
- Severity: ${vector.severity || "Unknown"}
- Location: ${vector.location || "Unknown"}
- Patient said: "${message}"

INSTRUCTIONS:
1. Extract new medical information from the patient's message
2. Ask ONE focused follow-up question
3. Be empathetic and professional
4. ${language === 'ar' ? 'Response MUST be 100% Arabic' : 'Response in English'}

OUTPUT (JSON only):
{
  "extracted": {
    "symptoms": ["new symptoms found"],
    "duration": "duration if mentioned",
    "severity": "severity if mentioned",
    "location": "body location if mentioned"
  },
  "nextQuestion": "${language === 'ar' ? 'سؤالك التالي بالعربية' : 'Your next question'}"
}`;
}

// ============================================================================
// Generate Structured Outcome
// ============================================================================

async function generateStructuredOutcome(
  vector: any,
  lastMessage: string,
  language: 'en' | 'ar',
  userLocation?: { governorate?: string; city?: string }
): Promise<{
  message: string;
  conversationStage: 'complete';
  context: any;
  language: 'en' | 'ar';
  structuredOutcome: StructuredOutcome;
}> {
  console.log('[Enhanced Assessment] Generating structured outcome...');
  
  vector.addToHistory('user', lastMessage);
  
  // Use BRAIN for diagnosis
  const brain = new BRAIN();
  const brainResult = await brain.reason({
    symptoms: vector.symptoms.length > 0 ? vector.symptoms : [lastMessage],
    patientInfo: {
      age: vector.age || 30,
      gender: (vector.gender as 'male' | 'female' | 'other') || 'male',
      medicalHistory: vector.medicalHistory,
      location: userLocation?.governorate || 'Iraq'
    },
    vitalSigns: {},
    language
  });
  
  const diagnosis = brainResult.diagnosis;
  const primaryDx = diagnosis.differentialDiagnosis[0];
  
  // Determine severity
  const severity = determineSeverity(diagnosis);
  
  // Calculate ESI (Emergency Severity Index) using Med-Gemini methodology
  // ESI is a 5-level triage system: 1 = most critical, 5 = least urgent
  const esiLevel = calculateESILevel(severity.level, diagnosis.redFlags || []);
  const esiAssessment = getESIAssessment(esiLevel);
  console.log(`[Enhanced Assessment] ESI Level: ${esiLevel} (${esiAssessment.levelName})`);
  
  // Build structured outcome with ESI integration
  const structuredOutcome: StructuredOutcome = {
    severity: severity.level,
    severityLabel: translate(severity.level, language),
    
    // ESI (Emergency Severity Index) - Med-Gemini Integration
    esiLevel: esiLevel,
    esiAssessment: {
      level: esiAssessment.level,
      levelName: language === 'ar' ? translateESILevelName(esiAssessment.levelName) : esiAssessment.levelName,
      description: language === 'ar' ? translateESIDescription(esiAssessment.description) : esiAssessment.description,
      waitTime: esiAssessment.waitTime,
      disposition: language === 'ar' ? translateESIDisposition(esiAssessment.disposition) : esiAssessment.disposition
    },
    
    primaryCondition: {
      name: translate(primaryDx?.condition || 'Unknown', language),
      confidence: normalizeConfidence(primaryDx?.probability || 0),
      briefExplanation: primaryDx?.reasoning || (language === 'ar' 
        ? 'بناءً على الأعراض المذكورة'
        : 'Based on reported symptoms')
    },
    
    otherConditions: diagnosis.differentialDiagnosis.slice(1, 4).map((dx: any) => ({
      name: translate(dx.condition, language),
      confidence: normalizeConfidence(dx.probability)
    })),
    
    immediateActions: buildImmediateActions(diagnosis, severity.level, language),
    
    requiredTests: buildRequiredTests(diagnosis, language),
    
    specialistReferral: buildSpecialistReferral(diagnosis, language),
    
    selfCareTips: buildSelfCareTips(diagnosis, language),
    
    warningSignsToWatch: diagnosis.redFlags?.map((f: string) => translate(f, language)) || [],
    
    recommendedFacilities: await buildFacilityRecommendations(
      diagnosis,
      severity.level,
      userLocation,
      language,
      vector.symptoms
    )
  };
  
  // Build summary message
  const summaryMessage = buildSummaryMessage(structuredOutcome, language);
  
  return {
    message: summaryMessage,
    conversationStage: 'complete',
    context: vector.toJSON(),
    language,
    structuredOutcome
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function determineSeverity(diagnosis: any): { level: 'low' | 'moderate' | 'high' | 'critical' } {
  if (diagnosis.redFlags && diagnosis.redFlags.length >= 3) {
    return { level: 'critical' };
  }
  if (diagnosis.redFlags && diagnosis.redFlags.length >= 1) {
    return { level: 'high' };
  }
  const primaryProb = diagnosis.differentialDiagnosis[0]?.probability || 0;
  if (primaryProb > 0.8) {
    return { level: 'moderate' };
  }
  return { level: 'low' };
}

function normalizeConfidence(probability: number): number {
  if (probability > 1) {
    return Math.min(Math.round(probability), 100);
  }
  return Math.round(probability * 100);
}

function buildImmediateActions(diagnosis: any, severity: string, language: 'en' | 'ar'): string[] {
  const actions: string[] = [];
  
  if (severity === 'critical') {
    actions.push(language === 'ar' 
      ? 'اذهب إلى الطوارئ فوراً'
      : 'Go to emergency room immediately');
  }
  
  if (diagnosis.recommendations?.immediateActions) {
    actions.push(...diagnosis.recommendations.immediateActions.map((a: string) => translate(a, language)));
  }
  
  if (actions.length === 0) {
    actions.push(language === 'ar'
      ? 'راجع طبيباً في أقرب وقت'
      : 'See a doctor soon');
  }
  
  return actions.slice(0, 4);
}

function buildRequiredTests(diagnosis: any, language: 'en' | 'ar'): Array<{
  name: string;
  reason: string;
  urgency: 'routine' | 'soon' | 'urgent';
}> {
  const tests: Array<{ name: string; reason: string; urgency: 'routine' | 'soon' | 'urgent' }> = [];
  
  if (diagnosis.recommendations?.tests) {
    diagnosis.recommendations.tests.forEach((test: string, idx: number) => {
      tests.push({
        name: translate(test, language),
        reason: language === 'ar' ? 'للتأكد من التشخيص' : 'To confirm diagnosis',
        urgency: idx === 0 ? 'soon' : 'routine'
      });
    });
  }
  
  return tests.slice(0, 5);
}

function buildSpecialistReferral(diagnosis: any, language: 'en' | 'ar'): { specialty: string; reason: string } | undefined {
  if (diagnosis.recommendations?.referrals && diagnosis.recommendations.referrals.length > 0) {
    const specialty = diagnosis.recommendations.referrals[0];
    return {
      specialty: translate(specialty, language),
      reason: language === 'ar' 
        ? 'للحصول على تقييم متخصص'
        : 'For specialized evaluation'
    };
  }
  return undefined;
}

function buildSelfCareTips(diagnosis: any, language: 'en' | 'ar'): string[] {
  const tips: string[] = [];
  
  if (diagnosis.recommendations?.lifestyle) {
    tips.push(...diagnosis.recommendations.lifestyle.map((t: string) => translate(t, language)));
  }
  
  // Default tips
  if (tips.length === 0) {
    if (language === 'ar') {
      tips.push('احصل على راحة كافية', 'اشرب سوائل كثيرة', 'راقب الأعراض');
    } else {
      tips.push('Get adequate rest', 'Stay hydrated', 'Monitor symptoms');
    }
  }
  
  return tips.slice(0, 5);
}

async function buildFacilityRecommendations(
  diagnosis: any,
  severity: string,
  userLocation?: { governorate?: string; city?: string },
  language: 'en' | 'ar' = 'en',
  symptoms: string[] = []
): Promise<{
  clinics: ClinicRecommendation[];
  pharmacies: PharmacyRecommendation[];
  hospitals: HospitalRecommendation[];
}> {
  const governorate = userLocation?.governorate || 'Baghdad';
  
  // Map severity to urgency level
  const urgencyMap: Record<string, 'low' | 'moderate' | 'high' | 'critical'> = {
    'critical': 'critical',
    'high': 'high',
    'moderate': 'moderate',
    'low': 'low'
  };
  
  const urgencyLevel = urgencyMap[severity] || 'moderate';
  
  // Get required tests and conditions
  const requiredTests = diagnosis.recommendations?.tests || [];
  const requiredSpecialty = diagnosis.recommendations?.referrals?.[0];
  const conditions = diagnosis.differentialDiagnosis?.map((d: any) => d.condition) || [];
  
  // Use intelligent clinic matcher
  const matchCriteria: MatchCriteria = {
    requiredTests,
    symptoms,
    conditions,
    urgencyLevel,
    specialty: requiredSpecialty,
    governorate,
    city: userLocation?.city
  };
  
  const matchedFacilities = await matchClinicsComprehensive(matchCriteria);
  
  // Convert matched clinics to ClinicRecommendation format
  const clinicRecommendations: ClinicRecommendation[] = matchedFacilities.clinics.map((clinic) => {
    // Translate match reasons if Arabic
    const translatedReasons = language === 'ar' 
      ? clinic.matchReasons.map(r => translateMatchReason(r, language))
      : clinic.matchReasons;
    
    return {
      id: clinic.id,
      name: language === 'ar' ? (clinic.nameArabic || clinic.name) : clinic.name,
      nameArabic: clinic.nameArabic,
      type: clinic.type,
      specialty: clinic.matchedSpecialties[0],
      address: clinic.address,
      phone: clinic.phone,
      matchReason: translatedReasons.join(', ') || (language === 'ar' ? 'قريب من موقعك' : 'Near your location'),
      matchScore: clinic.matchScore,
      servicesOffered: clinic.matchedServices
    };
  });
  
  // Convert matched hospitals to HospitalRecommendation format
  const hospitals: HospitalRecommendation[] = matchedFacilities.hospitals.map((hospital) => {
    const translatedReasons = language === 'ar'
      ? hospital.matchReasons.map(r => translateMatchReason(r, language))
      : hospital.matchReasons;
    
    return {
      id: hospital.id,
      name: language === 'ar' ? (hospital.nameArabic || hospital.name) : hospital.name,
      nameArabic: hospital.nameArabic,
      type: hospital.type,
      hasEmergency: hospital.hasEmergency,
      has24Hours: hospital.has24Hours,
      bedCount: hospital.bedCount,
      address: hospital.address,
      phone: hospital.phone,
      matchReason: translatedReasons.join(', ') || (language === 'ar' ? 'مستشفى مجهز' : 'Equipped hospital'),
      matchScore: hospital.matchScore,
      specialties: hospital.matchedSpecialties
    };
  });
  
  // Pharmacies (placeholder - would need pharmacy database)
  const pharmacies: PharmacyRecommendation[] = [];
  
  return {
    clinics: clinicRecommendations,
    pharmacies,
    hospitals
  };
}

function buildSummaryMessage(outcome: StructuredOutcome, language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return `تم إكمال التقييم. يرجى مراجعة النتائج أدناه.`;
  }
  return `Assessment complete. Please review the results below.`;
}

// ============================================================================
// ESI (Emergency Severity Index) Helper Functions
// Med-Gemini Integration for accurate triage
// ============================================================================

/**
 * Calculate ESI level based on severity and red flags
 * ESI is a 5-level triage system used in emergency departments
 * Level 1: Requires immediate life-saving intervention
 * Level 2: High-risk situation, severe pain/distress
 * Level 3: Urgent, stable vitals, needs 2+ resources
 * Level 4: Less urgent, needs 1 resource
 * Level 5: Non-urgent, needs no resources
 */
function calculateESILevel(
  severity: 'low' | 'moderate' | 'high' | 'critical',
  redFlags: string[]
): ESILevel {
  // Critical severity with multiple red flags = ESI 1
  if (severity === 'critical' && redFlags.length >= 2) {
    return 1;
  }
  
  // Critical severity or high severity with red flags = ESI 2
  if (severity === 'critical' || (severity === 'high' && redFlags.length >= 1)) {
    return 2;
  }
  
  // High severity = ESI 3
  if (severity === 'high') {
    return 3;
  }
  
  // Moderate severity = ESI 4
  if (severity === 'moderate') {
    return 4;
  }
  
  // Low severity = ESI 5
  return 5;
}

/**
 * Translate ESI level name to Arabic
 */
function translateESILevelName(levelName: string): string {
  const translations: Record<string, string> = {
    'Resuscitation': 'إنعاش',
    'Emergent': 'طارئ',
    'Urgent': 'عاجل',
    'Less Urgent': 'أقل إلحاحاً',
    'Non-Urgent': 'غير عاجل'
  };
  return translations[levelName] || levelName;
}

/**
 * Translate ESI description to Arabic
 */
function translateESIDescription(description: string): string {
  const translations: Record<string, string> = {
    'Requires immediate life-saving intervention': 'يتطلب تدخلاً فورياً لإنقاذ الحياة',
    'High risk situation, confused/lethargic/disoriented, or severe pain/distress': 'حالة عالية الخطورة، ارتباك/خمول/فقدان التوجه، أو ألم/ضيق شديد',
    'Stable vital signs but needs 2+ resources': 'علامات حيوية مستقرة ولكن يحتاج موردين أو أكثر',
    'Stable, needs 1 resource': 'مستقر، يحتاج مورد واحد',
    'Stable, needs no resources': 'مستقر، لا يحتاج موارد'
  };
  return translations[description] || description;
}

/**
 * Translate ESI disposition to Arabic
 */
function translateESIDisposition(disposition: string): string {
  const translations: Record<string, string> = {
    'Resuscitation room': 'غرفة الإنعاش',
    'Emergency department - high acuity': 'قسم الطوارئ - حالة حادة',
    'Emergency department - moderate acuity': 'قسم الطوارئ - حالة متوسطة',
    'Fast track or urgent care': 'المسار السريع أو الرعاية العاجلة',
    'Primary care or self-care': 'الرعاية الأولية أو الرعاية الذاتية'
  };
  return translations[disposition] || disposition;
}

// Types are already exported inline above
