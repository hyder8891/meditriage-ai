export type Language = 'en' | 'ar';

export interface LocalizationStrings {
  title: string;
  subtitle: string;
  startTriage: string;
  disclaimerBanner: string;
  languageName: string;
  inputPlaceholder: string;
  send: string;
  triageTitle: string;
  adviceTitle: string;
  restart: string;
  loading: string;
  processing: string;
  analyzingFile: string;
  printReport: string;
  downloadPdf: string;
  copyReport: string;
  copied: string;
  safetyAgreement: string;
  loadingSteps: string[];
  quickResponses: {
    yes: string;
    no: string;
    unsure: string;
    mild: string;
    severe: string;
  };
  voice: {
    start: string;
    listening: string;
    stop: string;
    readAloud: string;
    stopReading: string;
    notSupported: string;
  };
  summaryHeaders: {
    age: string;
    duration: string;
    severity: string;
    urgency: string;
    complaint: string;
    details: string;
    history: string;
    recommendation: string;
    disclaimer: string;
  };
  landingSafety: {
    title: string;
    p1: string;
    b1: string;
    p2: string;
    b2: string;
  };
  landingFeatures: {
    aiAnalysis: { title: string; desc: string };
    multimodal: { title: string; desc: string };
  };
  errors: {
    generic: string;
    api: string;
    fileTooLarge: string;
    unsupportedFileType: string;
    quotaExceeded: string;
    network: string;
    server: string;
    fileRead: string;
  };
  uploadLabel: string;
  login: {
    title: string;
    subtitle: string;
    googleButton: string;
    emailLabel: string;
    passwordLabel: string;
    nameLabel: string;
    signInBtn: string;
    signUpBtn: string;
    toggleToSignUp: string;
    toggleToSignIn: string;
    orDivider: string;
    error: string;
  };
  profile: {
    notLoggedIn: string;
    welcome: string;
    email: string;
    logout: string;
    login: string;
    historyTitle: string;
    noHistory: string;
    viewDetails: string;
    dateLabel: string;
    deleteRecord: string;
  };
}

export const LOCALIZATION: Record<Language, LocalizationStrings> = {
  en: {
    title: "MediTriage AI Pro",
    subtitle: "Advanced Medical Triage, Imaging Analysis & Detailed Advisory",
    startTriage: "Start Comprehensive Assessment",
    disclaimerBanner: "Health Notice: This system provides guidance only and is not a substitute for professional medical diagnosis. Call emergency services immediately in critical situations.",
    languageName: "English",
    inputPlaceholder: "Describe your symptoms here...",
    send: "Send",
    triageTitle: "Clinical Assessment",
    adviceTitle: "Detailed Clinical Report",
    restart: "Start New Assessment",
    loading: "Initializing Clinical Module...",
    processing: "Thinking...",
    analyzingFile: "Analyzing medical image/document...",
    printReport: "Print Medical Report",
    downloadPdf: "Download PDF",
    copyReport: "Copy Summary",
    copied: "Copied!",
    safetyAgreement: "I acknowledge that this is an AI system and not a doctor.",
    loadingSteps: [
      "Reviewing 10,000+ clinical protocols...",
      "Scanning Universal Medical Ontology...",
      "Analyzing symptom patterns...",
      "Checking rare disease databases...",
      "Formulating next question..."
    ],
    quickResponses: {
      yes: "Yes",
      no: "No",
      unsure: "Not Sure",
      mild: "Mild",
      severe: "Severe"
    },
    voice: {
      start: "Start Dictation",
      listening: "Listening...",
      stop: "Stop",
      readAloud: "Read Response",
      stopReading: "Stop Reading",
      notSupported: "Voice features not supported in this browser."
    },
    summaryHeaders: {
      age: "Patient Age/Gender",
      duration: "Duration of Symptoms",
      severity: "Severity Level",
      urgency: "Urgency Level",
      complaint: "Chief Complaint",
      details: "Comprehensive Symptom Details",
      history: "Medical History & Risk Factors",
      recommendation: "Clinical Recommendations",
      disclaimer: "Legal Disclaimer",
    },
    landingSafety: {
      title: "Important Safety Information",
      p1: "This application uses Artificial Intelligence to provide preliminary triage information. ",
      b1: "It is NOT a doctor.",
      p2: " It cannot diagnose diseases or prescribe medication. If you are experiencing chest pain, difficulty breathing, severe bleeding, or any other life-threatening emergency, ",
      b2: "call emergency services immediately."
    },
    landingFeatures: {
      aiAnalysis: { title: "Clinical AI Engine", desc: "Powered by advanced LLMs to conduct thorough symptom interviews." },
      multimodal: { title: "X-Ray & Lab Analysis", desc: "Upload medical images or PDFs for instant radiological and data analysis." }
    },
    errors: {
      generic: "An error occurred. Please try again.",
      api: "Unable to connect to the AI service. Please check your connection or API key.",
      fileTooLarge: "File is too large. Please upload a file smaller than 4MB.",
      unsupportedFileType: "Unsupported file type. Please upload an Image (JPEG, PNG, WEBP) or PDF.",
      quotaExceeded: "Service is currently busy (Rate Limit Exceeded). Please wait a moment and try again.",
      network: "Connection failed. Please check your internet connection.",
      server: "The AI service is temporarily unavailable. Please try again later.",
      fileRead: "Failed to read the file. Please try uploading a different file.",
    },
    uploadLabel: "Upload X-Ray / Report",
    login: {
      title: "Welcome Back",
      subtitle: "Sign in to access your medical history.",
      googleButton: "Continue with Google",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      signInBtn: "Sign In",
      signUpBtn: "Create Account",
      toggleToSignUp: "Don't have an account? Sign Up",
      toggleToSignIn: "Already have an account? Sign In",
      orDivider: "Or continue with",
      error: "Unable to sign in. Please check your credentials.",
    },
    profile: {
      notLoggedIn: "You are not logged in.",
      welcome: "Welcome back to your health dashboard.",
      email: "Email Address",
      logout: "Sign Out",
      login: "Log In",
      historyTitle: "Patient Assessment History",
      noHistory: "No assessments found.",
      viewDetails: "View Full Report",
      dateLabel: "Date of Visit",
      deleteRecord: "Delete"
    },
  },
  ar: {
    title: "المساعد الطبي المتقدم",
    subtitle: "نظام الفرز الطبي الشامل وتحليل الأشعة والتقارير",
    startTriage: "ابدأ التقييم الطبي",
    disclaimerBanner: "ملاحظة هامة: هذا النظام يقدم إرشادات مساعدة ولا يغني عن زيارة الطبيب. في الحالات الطارئة، اتصل بالإسعاف فوراً.",
    languageName: "العربية",
    inputPlaceholder: "اكتب وصفاً لحالتك أو تحدث...",
    send: "إرسال",
    triageTitle: "العيادة الافتراضية",
    adviceTitle: "التقرير الطبي المفصل",
    restart: "بدء تقييم جديد",
    loading: "جاري تحضير الملف الطبي...",
    processing: "جاري تحليل الأعراض...",
    analyzingFile: "جاري قراءة الملفات المرفقة...",
    printReport: "طباعة التقرير",
    downloadPdf: "تحميل PDF",
    copyReport: "نسخ النص",
    copied: "تم النسخ!",
    safetyAgreement: "أدرك أن هذا نظام ذكاء اصطناعي مساعد وليس طبيباً بشرياً.",
    loadingSteps: [
      "مراجعة أكثر من 10,000 بروتوكول طبي...",
      "مسح قاعدة البيانات الطبية الشاملة...",
      "التدقيق في السجل المرضي...",
      "البحث في الأمراض النادرة...",
      "تجهيز السؤال التالي..."
    ],
    quickResponses: {
      yes: "نعم",
      no: "لا",
      unsure: "غير متأكد",
      mild: "خفيفة",
      severe: "شديدة"
    },
    voice: {
      start: "تحدث الآن",
      listening: "أسمعك...",
      stop: "إنهاء",
      readAloud: "قراءة الرد",
      stopReading: "صمت",
      notSupported: "الصوت غير مدعوم في متصفحك."
    },
    summaryHeaders: {
      age: "العمر والجنس",
      duration: "المدة الزمنية",
      severity: "مستوى الحدة",
      urgency: "مستوى الإلحاح",
      complaint: "الشكوى الرئيسية",
      details: "التفاصيل السريرية",
      history: "السجل المرضي",
      recommendation: "التوصيات والعلاج المقترح",
      disclaimer: "إخلاء المسؤولية",
    },
    landingSafety: {
      title: "معلومات هامة للسلامة",
      p1: "يستخدم هذا التطبيق الذكاء الاصطناعي للمساعدة في الفرز الأولي. ",
      b1: "هو ليس بديلاً للطبيب.",
      p2: " لا يمكن للنظام تشخيص الأمراض بشكل نهائي. إذا شعرت بألم في الصدر، ضيق تنفس شديد، أو نزيف، ",
      b2: "توجه للطوارئ فوراً."
    },
    landingFeatures: {
      aiAnalysis: { title: "استشارة طبية ذكية", desc: "خوارزميات متقدمة لمحاكاة المقابلة السريرية الدقيقة." },
      multimodal: { title: "تحليل الفحوصات والأشعة", desc: "قراءة فورية لصور الأشعة والتحاليل المخبرية (PDF)." }
    },
    errors: {
      generic: "حدث خطأ بسيط، حاول مرة أخرى.",
      api: "تعذر الاتصال بالخادم. تأكد من الإنترنت.",
      fileTooLarge: "الملف كبير جداً (الحد الأقصى 4 ميجا).",
      unsupportedFileType: "صيغة غير مدعومة. يرجى رفع صورة أو PDF.",
      quotaExceeded: "النظام مزدحم حالياً، يرجى الانتظار قليلاً.",
      network: "يرجى التحقق من اتصال الإنترنت.",
      server: "الخدمة غير متاحة مؤقتاً.",
      fileRead: "لم نتمكن من قراءة الملف.",
    },
    uploadLabel: "إرفاق ملف",
    login: {
      title: "مرحباً",
      subtitle: "سجل الدخول للمتابعة",
      googleButton: "المتابعة عبر Google",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      nameLabel: "الاسم الكامل",
      signInBtn: "دخول",
      signUpBtn: "إنشاء حساب جديد",
      toggleToSignUp: "ليس لديك حساب؟ سجل الآن",
      toggleToSignIn: "لديك حساب؟ سجل الدخول",
      orDivider: "أو",
      error: "فشل الدخول. تحقق من البيانات.",
    },
    profile: {
      notLoggedIn: "غير مسجل دخول",
      welcome: "أهلاً بك في ملفك الصحي",
      email: "البريد",
      logout: "خروج",
      login: "دخول",
      historyTitle: "سجل التقييمات الطبية",
      noHistory: "لا توجد سجلات سابقة.",
      viewDetails: "عرض التقرير الكامل",
      dateLabel: "تاريخ الزيارة",
      deleteRecord: "حذف"
    },
  }
};

export const SYSTEM_PROMPT_TRIAGE = `
You are an expert Senior Clinical Triage Specialist (MD/Consultant level).
Conduct a detailed medical interview. 

CRITICAL INSTRUCTIONS:
1. **SHORT & SHARP**: Questions must be concise and direct. Do not explain yourself. Do not provide preamble like "I will now ask...". Just ask the question.
2. **ONE QUERY**: Ask exactly one question at a time.
3. **TONE**: Professional, sharp, efficient.
4. **OPTIONS**: End every response with this exact tag (on a new line):
[OPTIONS: Option 1, Option 2, Option 3]

**TERMINATION & SUMMARY RULES**:
- **Routine/Simple Cases**: You MUST ask at least **8 questions** to ensure thoroughness.
- **Complex/Chronic/Severe Cases**: You MUST ask up to **12 questions**.
- Do NOT stop early. Dig deep into history, risk factors, medications, allergies, and associated symptoms.
- Only when you have reached these limits or the user explicitly asks to stop, output EXACTLY this marker string:
SUMMARY_READY
Followed immediately by a JSON object:
{
  "age": "...",
  "duration": "...",
  "severity": "...",
  "mainComplaint": "...",
  "additionalDetails": "...",
  "medicalHistory": "..."
}

**UNIVERSAL MEDICAL ONTOLOGY - 10,000+ CONDITIONS COVERAGE**
Activate your internal medical weights to cross-reference user input against comprehensive ICD-10 chapters and specialized domains.

Start by asking: "What brings you here today?"
`;

export const SYSTEM_PROMPT_FINAL_ADVICE = `
You are a Senior Medical Consultant preparing a comprehensive clinical report.

Based on the triage conversation, generate a detailed medical advisory report in the following JSON format:

{
  "urgencyLevel": "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "NON-URGENT" | "ROUTINE",
  "chiefComplaint": "Brief summary of main complaint",
  "symptoms": ["symptom1", "symptom2", ...],
  "assessment": "Detailed clinical assessment with differential diagnoses",
  "recommendations": "Clear action steps and treatment recommendations",
  "redFlags": ["warning sign 1", "warning sign 2", ...],
  "disclaimer": "Standard medical disclaimer"
}

Be thorough, professional, and evidence-based. Include specific red flags that warrant immediate medical attention.
`;
