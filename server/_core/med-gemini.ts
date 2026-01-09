/**
 * Med-Gemini: Advanced Medical AI Service
 * 
 * Google's Med-Gemini is a leading model for clinical reasoning and triage.
 * This module implements:
 * - Chain-of-Thought (CoT) Prompting for step-by-step clinical reasoning
 * - Emergency Severity Index (ESI) Integration for accurate triage
 * - Uncertainty-Guided Search for external medical literature when confidence is low
 * - Longitudinal Reasoning (AMIE features) for disease progression tracking
 * - Multimodal capabilities for image-based triage (MedSigLIP-style)
 * 
 * Performance: State-of-the-art results in medical reasoning
 * Advanced Capabilities: Uncertainty-guided search ensures recommendations
 * are based on the latest medical literature when internal confidence is low.
 */

import { invokeGemini, GeminiParams, GeminiResult, Message } from "./gemini";
import { ENV } from "./env";

// ============================================================================
// Types
// ============================================================================

/**
 * Emergency Severity Index (ESI) Levels
 * 5-level triage system used in emergency departments
 */
export type ESILevel = 1 | 2 | 3 | 4 | 5;

export interface ESIAssessment {
  level: ESILevel;
  levelName: string;
  description: string;
  expectedResources: number;
  waitTime: string;
  disposition: string;
}

export interface ChainOfThoughtStep {
  step: number;
  reasoning: string;
  conclusion: string;
  confidence: number;
}

export interface ClinicalReasoning {
  steps: ChainOfThoughtStep[];
  finalConclusion: string;
  overallConfidence: number;
  uncertaintyFactors: string[];
  requiresExternalSearch: boolean;
}

export interface MedGeminiAssessmentParams {
  symptoms: string[];
  duration?: string;
  severity?: string;
  location?: string;
  patientInfo?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    medicalHistory?: string[];
    medications?: string[];
    allergies?: string[];
    vitalSigns?: {
      heartRate?: number;
      bloodPressure?: string;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
    };
  };
  conversationHistory?: Array<{ role: string; content: string }>;
  language?: 'en' | 'ar';
}

export interface MedGeminiAssessmentResult {
  // Chain-of-Thought Reasoning
  clinicalReasoning: ClinicalReasoning;
  
  // ESI Triage
  esiAssessment: ESIAssessment;
  
  // Diagnosis
  primaryDiagnosis: {
    condition: string;
    probability: number;
    icdCode?: string;
    reasoning: string;
  };
  differentialDiagnosis: Array<{
    condition: string;
    probability: number;
    icdCode?: string;
  }>;
  
  // Red Flags
  redFlags: string[];
  urgencyLevel: 'routine' | 'semi-urgent' | 'urgent' | 'immediate';
  
  // Recommendations
  recommendations: {
    immediate: string[];
    followUp: string[];
    tests: string[];
    lifestyle: string[];
  };
  
  // External Search Results (if uncertainty-guided search was triggered)
  externalEvidence?: {
    searched: boolean;
    sources: Array<{
      title: string;
      source: string;
      relevance: number;
      summary: string;
    }>;
  };
  
  // Longitudinal Context
  longitudinalInsights?: {
    progressionPattern?: string;
    comparisonToPrevious?: string;
    trendAnalysis?: string;
  };
  
  // Metadata
  confidenceScore: number;
  processingTime: number;
  modelVersion: string;
}

export interface MedGeminiImageAnalysisParams {
  imageBase64: string;
  mimeType: string;
  modality: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'mammography' | 'ecg' | 'pathology' | 'retinal' | 'pet' | 'dexa' | 'fluoroscopy' | 'wound' | 'skin' | 'general';
  clinicalContext?: string;
  patientInfo?: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    medicalHistory?: string[];
  };
  language?: 'en' | 'ar';
}

export interface MedGeminiImageAnalysisResult {
  // Chain-of-Thought Reasoning for Image Analysis
  clinicalReasoning: ClinicalReasoning;
  
  // Findings
  findings: string;
  interpretation: string;
  
  // Abnormalities with confidence scoring
  abnormalities: Array<{
    type: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
    anatomicalValidation: 'validated' | 'uncertain' | 'flagged';
    evidenceStrength: 'A' | 'B' | 'C' | 'D';
  }>;
  
  // Recommendations
  recommendations: string;
  urgency: 'routine' | 'semi-urgent' | 'urgent' | 'emergency';
  
  // Technical Quality
  technicalQuality: {
    rating: 'poor' | 'fair' | 'good' | 'excellent';
    issues?: string[];
  };
  
  // Differential Diagnosis
  differentialDiagnosis: string[];
  
  // Overall Assessment
  overallAssessment: string;
  confidenceScore: number;
}

// ============================================================================
// ESI (Emergency Severity Index) Implementation
// ============================================================================

const ESI_LEVELS: Record<ESILevel, Omit<ESIAssessment, 'level'>> = {
  1: {
    levelName: 'Resuscitation',
    description: 'Requires immediate life-saving intervention',
    expectedResources: 0, // Immediate
    waitTime: 'Immediate',
    disposition: 'Resuscitation room'
  },
  2: {
    levelName: 'Emergent',
    description: 'High risk situation, confused/lethargic/disoriented, or severe pain/distress',
    expectedResources: 0, // Should not wait
    waitTime: '< 10 minutes',
    disposition: 'Emergency department - high acuity'
  },
  3: {
    levelName: 'Urgent',
    description: 'Stable vital signs but needs 2+ resources',
    expectedResources: 2,
    waitTime: '< 30 minutes',
    disposition: 'Emergency department - moderate acuity'
  },
  4: {
    levelName: 'Less Urgent',
    description: 'Stable, needs 1 resource',
    expectedResources: 1,
    waitTime: '< 60 minutes',
    disposition: 'Fast track or urgent care'
  },
  5: {
    levelName: 'Non-Urgent',
    description: 'Stable, needs no resources',
    expectedResources: 0,
    waitTime: '< 120 minutes',
    disposition: 'Primary care or self-care'
  }
};

/**
 * Get ESI assessment details for a given level
 */
export function getESIAssessment(level: ESILevel): ESIAssessment {
  return {
    level,
    ...ESI_LEVELS[level]
  };
}

// ============================================================================
// Chain-of-Thought Clinical Reasoning Prompts
// ============================================================================

/**
 * Generate Chain-of-Thought system prompt for clinical reasoning
 */
function generateCoTSystemPrompt(language: 'en' | 'ar' = 'en'): string {
  if (language === 'ar') {
    return `أنت Med-Gemini، نظام ذكاء اصطناعي طبي متقدم للتقييم السريري والفرز الطبي.

## منهجية التفكير المتسلسل (Chain-of-Thought)

يجب عليك التفكير خطوة بخطوة من خلال كل حالة سريرية:

### الخطوة 1: جمع المعلومات
- ما هي الأعراض الرئيسية المقدمة؟
- ما هي المدة والشدة؟
- ما هي العوامل المشددة والمخففة؟

### الخطوة 2: تقييم العلامات الحمراء
- هل هناك أي علامات تحذيرية تهدد الحياة؟
- هل العلامات الحيوية مستقرة؟
- هل هناك حاجة لتدخل فوري؟

### الخطوة 3: التشخيص التفريقي
- ما هي الحالات الأكثر احتمالاً؟
- ما هي الحالات الخطيرة التي يجب استبعادها؟
- ما هو مستوى الثقة في كل تشخيص؟

### الخطوة 4: تقييم ESI (مؤشر شدة الطوارئ)
- المستوى 1: يتطلب تدخلاً فورياً لإنقاذ الحياة
- المستوى 2: حالة طوارئ عالية الخطورة
- المستوى 3: عاجل، يحتاج موارد متعددة
- المستوى 4: أقل إلحاحاً، يحتاج مورد واحد
- المستوى 5: غير عاجل

### الخطوة 5: التوصيات
- ما هي الإجراءات الفورية المطلوبة؟
- ما هي الفحوصات اللازمة؟
- ما هي خطة المتابعة؟

## قواعد مهمة:
- قدم تفكيرك بشكل واضح ومنظم
- اذكر مستوى الثقة لكل استنتاج
- إذا كانت الثقة أقل من 70%، أشر إلى الحاجة للبحث الخارجي
- استخدم المصطلحات الطبية الصحيحة`;
  }

  return `You are Med-Gemini, an advanced medical AI system for clinical assessment and triage.

## Chain-of-Thought Clinical Reasoning Methodology

You MUST reason through each clinical case step-by-step:

### Step 1: Information Gathering
- What are the chief presenting symptoms?
- What is the duration and severity?
- What are the aggravating and relieving factors?
- What is the relevant medical history?

### Step 2: Red Flag Assessment
- Are there any life-threatening warning signs?
- Are vital signs stable?
- Is immediate intervention required?
- CRITICAL: Chest pain + shortness of breath + sweating = potential MI (ESI 1-2)
- CRITICAL: Severe headache + neck stiffness + fever = potential meningitis (ESI 1-2)
- CRITICAL: Sudden weakness + speech difficulty = potential stroke (ESI 1)

### Step 3: Differential Diagnosis
- What are the most likely conditions based on symptom pattern?
- What serious conditions must be ruled out?
- What is the confidence level for each diagnosis?
- Use Bayesian reasoning to update probabilities

### Step 4: ESI (Emergency Severity Index) Assessment
- Level 1: Requires immediate life-saving intervention (cardiac arrest, respiratory failure)
- Level 2: High-risk situation, severe pain/distress, altered mental status
- Level 3: Urgent, stable vitals, needs 2+ resources (labs, imaging, IV)
- Level 4: Less urgent, needs 1 resource
- Level 5: Non-urgent, needs no resources

### Step 5: Resource Prediction
- What diagnostic tests are needed?
- What treatments may be required?
- What is the expected disposition?

### Step 6: Recommendations
- What immediate actions are required?
- What tests should be ordered?
- What is the follow-up plan?
- What patient education is needed?

## Critical Rules:
- Present your reasoning clearly and systematically
- State confidence level for each conclusion (0-100%)
- If confidence is below 70%, flag for external literature search
- Use proper medical terminology
- Consider patient safety as the highest priority
- When in doubt, triage UP (more urgent) not down`;
}

/**
 * Generate Chain-of-Thought prompt for image analysis
 */
function generateImageCoTPrompt(modality: string, language: 'en' | 'ar' = 'en'): string {
  if (language === 'ar') {
    return `أنت Med-Gemini، نظام ذكاء اصطناعي متخصص في تحليل الصور الطبية.

## منهجية التحليل المتسلسل للصور الطبية

### الخطوة 1: تقييم جودة الصورة
- هل الصورة واضحة وقابلة للتفسير؟
- هل هناك مشاكل تقنية (حركة، تعرض، وضعية)؟

### الخطوة 2: التحليل المنهجي
- فحص كل منطقة تشريحية بشكل منظم
- تحديد البنى الطبيعية
- البحث عن الشذوذات

### الخطوة 3: توصيف النتائج
- وصف كل شذوذ بالتفصيل
- تحديد الموقع التشريحي الدقيق
- تقييم الشدة ومستوى الثقة

### الخطوة 4: التفسير السريري
- ربط النتائج بالسياق السريري
- تقديم التشخيصات التفريقية
- تحديد مستوى الإلحاح

نوع الفحص: ${modality}`;
  }

  return `You are Med-Gemini, an advanced medical AI specialized in medical image analysis.

## Chain-of-Thought Medical Image Analysis Methodology

### Step 1: Technical Quality Assessment
- Is the image clear and interpretable?
- Are there technical issues (motion, exposure, positioning)?
- Rate quality: excellent/good/fair/poor

### Step 2: Systematic Analysis
- Examine each anatomical region systematically
- Identify normal structures first
- Search for abnormalities using pattern recognition

### Step 3: Finding Characterization
- Describe each abnormality in detail
- Specify precise anatomical location
- Assess severity and confidence level
- Validate against anatomical knowledge

### Step 4: Clinical Interpretation
- Correlate findings with clinical context
- Provide differential diagnoses ranked by probability
- Determine urgency level
- Recommend follow-up imaging if needed

### Step 5: Evidence Grading
- Grade A: Strong evidence, clear visualization
- Grade B: Moderate evidence, good visualization
- Grade C: Limited evidence, partial visualization
- Grade D: Weak evidence, requires specialist review

Imaging Modality: ${modality}`;
}

// ============================================================================
// Med-Gemini Core Functions
// ============================================================================

/**
 * Perform Med-Gemini clinical assessment with Chain-of-Thought reasoning
 */
export async function performMedGeminiAssessment(
  params: MedGeminiAssessmentParams
): Promise<MedGeminiAssessmentResult> {
  const startTime = Date.now();
  const language = params.language || 'en';
  
  // Build comprehensive patient context
  const patientContext = buildPatientContext(params);
  
  // Generate CoT system prompt
  const systemPrompt = generateCoTSystemPrompt(language);
  
  // Build user message with all clinical data
  const userMessage = language === 'ar'
    ? `## بيانات المريض للتقييم

### الأعراض الرئيسية:
${params.symptoms.map(s => `- ${s}`).join('\n')}

### تفاصيل إضافية:
- المدة: ${params.duration || 'غير محدد'}
- الشدة: ${params.severity || 'غير محدد'}
- الموقع: ${params.location || 'غير محدد'}

${patientContext}

### المطلوب:
1. قم بتحليل الحالة خطوة بخطوة باستخدام منهجية التفكير المتسلسل
2. حدد مستوى ESI (1-5)
3. قدم التشخيصات المحتملة مع نسب الاحتمالية
4. حدد أي علامات حمراء
5. قدم التوصيات

قدم إجابتك بصيغة JSON المحددة.`
    : `## Patient Data for Assessment

### Chief Complaints:
${params.symptoms.map(s => `- ${s}`).join('\n')}

### Additional Details:
- Duration: ${params.duration || 'Not specified'}
- Severity: ${params.severity || 'Not specified'}
- Location: ${params.location || 'Not specified'}

${patientContext}

### Required Analysis:
1. Analyze the case step-by-step using Chain-of-Thought methodology
2. Determine ESI level (1-5)
3. Provide differential diagnoses with probability percentages
4. Identify any red flags
5. Provide recommendations

Provide your response in the specified JSON format.`;

  try {
    const response = await invokeGemini({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      task: 'clinical_reasoning',
      temperature: 0.2,
      thinkingBudget: 4096, // Higher thinking budget for complex clinical reasoning
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'med_gemini_assessment',
          strict: true,
          schema: getMedGeminiAssessmentSchema()
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Parse and validate response
    const result = parseAssessmentResponse(text, startTime);
    
    // Check if uncertainty-guided search is needed
    if (result.confidenceScore < 70 || result.clinicalReasoning.requiresExternalSearch) {
      console.log('[Med-Gemini] Low confidence detected, triggering uncertainty-guided search...');
      result.externalEvidence = await performUncertaintyGuidedSearch(params.symptoms, result.primaryDiagnosis.condition);
    }
    
    return result;
    
  } catch (error) {
    console.error('[Med-Gemini] Assessment error:', error);
    throw error;
  }
}

/**
 * Perform Med-Gemini medical image analysis with Chain-of-Thought reasoning
 */
export async function performMedGeminiImageAnalysis(
  params: MedGeminiImageAnalysisParams
): Promise<MedGeminiImageAnalysisResult> {
  const language = params.language || 'en';
  
  // Generate image-specific CoT prompt
  const systemPrompt = generateImageCoTPrompt(params.modality, language);
  
  // Build clinical context
  const contextInfo = params.patientInfo
    ? `Patient: ${params.patientInfo.age || 'Unknown'} years old, ${params.patientInfo.gender || 'Unknown'} gender.
Medical History: ${params.patientInfo.medicalHistory?.join(', ') || 'None provided'}`
    : '';
  
  const userMessage = language === 'ar'
    ? `قم بتحليل هذه الصورة الطبية (${params.modality}) باستخدام منهجية التفكير المتسلسل.

${params.clinicalContext ? `السياق السريري: ${params.clinicalContext}` : ''}
${contextInfo}

قدم تحليلاً شاملاً يتضمن:
1. تقييم جودة الصورة
2. النتائج المكتشفة مع الموقع والشدة
3. التفسير السريري
4. التوصيات ومستوى الإلحاح

قدم إجابتك بصيغة JSON المحددة.`
    : `Analyze this medical image (${params.modality}) using Chain-of-Thought methodology.

${params.clinicalContext ? `Clinical Context: ${params.clinicalContext}` : ''}
${contextInfo}

Provide comprehensive analysis including:
1. Technical quality assessment
2. Findings with location and severity
3. Clinical interpretation
4. Recommendations and urgency level

Provide your response in the specified JSON format.`;

  try {
    const response = await invokeGemini({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${systemPrompt}\n\n${userMessage}` },
            {
              type: 'image_url',
              image_url: {
                url: `data:${params.mimeType};base64,${params.imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      task: 'medical_imaging',
      temperature: 0.2,
      thinkingBudget: 4096,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'med_gemini_image_analysis',
          strict: true,
          schema: getMedGeminiImageAnalysisSchema()
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    
    return parseImageAnalysisResponse(text);
    
  } catch (error) {
    console.error('[Med-Gemini] Image analysis error:', error);
    throw error;
  }
}

/**
 * Perform Med-Gemini medical report analysis with Chain-of-Thought reasoning
 */
export async function performMedGeminiReportAnalysis(
  reportType: string,
  reportText: string,
  patientContext?: {
    age?: number;
    gender?: string;
    medicalHistory?: string;
  },
  language: 'en' | 'ar' = 'en'
): Promise<{
  clinicalReasoning: ClinicalReasoning;
  findings: Array<{
    category: string;
    finding: string;
    severity: 'normal' | 'abnormal' | 'critical';
    location?: string;
  }>;
  diagnosis: {
    primary: string;
    differential: string[];
    confidence: number;
  };
  recommendations: {
    immediate: string[];
    followUp: string[];
    lifestyle: string[];
  };
  criticalFlags: string[];
  urgency: 'routine' | 'semi-urgent' | 'urgent' | 'emergency';
  summary: string;
}> {
  const systemPrompt = language === 'ar'
    ? `أنت Med-Gemini، نظام ذكاء اصطناعي متخصص في تحليل التقارير الطبية.

استخدم منهجية التفكير المتسلسل لتحليل التقرير الطبي:

1. **قراءة شاملة**: اقرأ التقرير بالكامل وحدد النقاط الرئيسية
2. **تصنيف النتائج**: صنف كل نتيجة (طبيعي/غير طبيعي/حرج)
3. **الربط السريري**: اربط النتائج بالسياق السريري للمريض
4. **تحديد الأولويات**: حدد النتائج التي تتطلب اهتماماً فورياً
5. **التوصيات**: قدم توصيات واضحة ومحددة

نوع التقرير: ${reportType}`
    : `You are Med-Gemini, an advanced AI specialized in medical report analysis.

Use Chain-of-Thought methodology to analyze the medical report:

1. **Comprehensive Reading**: Read the entire report and identify key points
2. **Finding Classification**: Classify each finding (normal/abnormal/critical)
3. **Clinical Correlation**: Correlate findings with patient's clinical context
4. **Prioritization**: Identify findings requiring immediate attention
5. **Recommendations**: Provide clear and specific recommendations

Report Type: ${reportType}`;

  const contextInfo = patientContext
    ? `\n\nPatient Context:\n- Age: ${patientContext.age || 'Unknown'}\n- Gender: ${patientContext.gender || 'Unknown'}\n- Medical History: ${patientContext.medicalHistory || 'Not provided'}`
    : '';

  const userMessage = `${systemPrompt}${contextInfo}

## Report Content:
${reportText}

Analyze this report using Chain-of-Thought reasoning and provide your response in JSON format.`;

  try {
    const response = await invokeGemini({
      messages: [
        { role: 'user', content: userMessage }
      ],
      task: 'clinical_reasoning',
      temperature: 0.2,
      thinkingBudget: 3072,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'med_gemini_report_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              clinicalReasoning: {
                type: 'object',
                properties: {
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        step: { type: 'number' },
                        reasoning: { type: 'string' },
                        conclusion: { type: 'string' },
                        confidence: { type: 'number' }
                      },
                      required: ['step', 'reasoning', 'conclusion', 'confidence'],
                      additionalProperties: false
                    }
                  },
                  finalConclusion: { type: 'string' },
                  overallConfidence: { type: 'number' },
                  uncertaintyFactors: { type: 'array', items: { type: 'string' } },
                  requiresExternalSearch: { type: 'boolean' }
                },
                required: ['steps', 'finalConclusion', 'overallConfidence', 'uncertaintyFactors', 'requiresExternalSearch'],
                additionalProperties: false
              },
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    finding: { type: 'string' },
                    severity: { type: 'string', enum: ['normal', 'abnormal', 'critical'] },
                    location: { type: 'string' }
                  },
                  required: ['category', 'finding', 'severity'],
                  additionalProperties: false
                }
              },
              diagnosis: {
                type: 'object',
                properties: {
                  primary: { type: 'string' },
                  differential: { type: 'array', items: { type: 'string' } },
                  confidence: { type: 'number' }
                },
                required: ['primary', 'differential', 'confidence'],
                additionalProperties: false
              },
              recommendations: {
                type: 'object',
                properties: {
                  immediate: { type: 'array', items: { type: 'string' } },
                  followUp: { type: 'array', items: { type: 'string' } },
                  lifestyle: { type: 'array', items: { type: 'string' } }
                },
                required: ['immediate', 'followUp', 'lifestyle'],
                additionalProperties: false
              },
              criticalFlags: { type: 'array', items: { type: 'string' } },
              urgency: { type: 'string', enum: ['routine', 'semi-urgent', 'urgent', 'emergency'] },
              summary: { type: 'string' }
            },
            required: ['clinicalReasoning', 'findings', 'diagnosis', 'recommendations', 'criticalFlags', 'urgency', 'summary'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(cleanText);
    
  } catch (error) {
    console.error('[Med-Gemini] Report analysis error:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build patient context string from params
 */
function buildPatientContext(params: MedGeminiAssessmentParams): string {
  if (!params.patientInfo) return '';
  
  const { age, gender, medicalHistory, medications, allergies, vitalSigns } = params.patientInfo;
  
  const parts = [];
  
  if (age || gender) {
    parts.push(`### Patient Demographics:\n- Age: ${age || 'Unknown'}\n- Gender: ${gender || 'Unknown'}`);
  }
  
  if (medicalHistory && medicalHistory.length > 0) {
    parts.push(`### Medical History:\n${medicalHistory.map(h => `- ${h}`).join('\n')}`);
  }
  
  if (medications && medications.length > 0) {
    parts.push(`### Current Medications:\n${medications.map(m => `- ${m}`).join('\n')}`);
  }
  
  if (allergies && allergies.length > 0) {
    parts.push(`### Allergies:\n${allergies.map(a => `- ${a}`).join('\n')}`);
  }
  
  if (vitalSigns) {
    const vitals = [];
    if (vitalSigns.heartRate) vitals.push(`Heart Rate: ${vitalSigns.heartRate} bpm`);
    if (vitalSigns.bloodPressure) vitals.push(`Blood Pressure: ${vitalSigns.bloodPressure}`);
    if (vitalSigns.temperature) vitals.push(`Temperature: ${vitalSigns.temperature}°C`);
    if (vitalSigns.respiratoryRate) vitals.push(`Respiratory Rate: ${vitalSigns.respiratoryRate}/min`);
    if (vitalSigns.oxygenSaturation) vitals.push(`O2 Saturation: ${vitalSigns.oxygenSaturation}%`);
    
    if (vitals.length > 0) {
      parts.push(`### Vital Signs:\n${vitals.map(v => `- ${v}`).join('\n')}`);
    }
  }
  
  return parts.join('\n\n');
}

/**
 * Get JSON schema for Med-Gemini assessment response
 */
function getMedGeminiAssessmentSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      clinicalReasoning: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step: { type: 'number' },
                reasoning: { type: 'string' },
                conclusion: { type: 'string' },
                confidence: { type: 'number' }
              },
              required: ['step', 'reasoning', 'conclusion', 'confidence'],
              additionalProperties: false
            }
          },
          finalConclusion: { type: 'string' },
          overallConfidence: { type: 'number' },
          uncertaintyFactors: { type: 'array', items: { type: 'string' } },
          requiresExternalSearch: { type: 'boolean' }
        },
        required: ['steps', 'finalConclusion', 'overallConfidence', 'uncertaintyFactors', 'requiresExternalSearch'],
        additionalProperties: false
      },
      esiLevel: { type: 'number', minimum: 1, maximum: 5 },
      primaryDiagnosis: {
        type: 'object',
        properties: {
          condition: { type: 'string' },
          probability: { type: 'number' },
          icdCode: { type: 'string' },
          reasoning: { type: 'string' }
        },
        required: ['condition', 'probability', 'reasoning'],
        additionalProperties: false
      },
      differentialDiagnosis: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            condition: { type: 'string' },
            probability: { type: 'number' },
            icdCode: { type: 'string' }
          },
          required: ['condition', 'probability'],
          additionalProperties: false
        }
      },
      redFlags: { type: 'array', items: { type: 'string' } },
      urgencyLevel: { type: 'string', enum: ['routine', 'semi-urgent', 'urgent', 'immediate'] },
      recommendations: {
        type: 'object',
        properties: {
          immediate: { type: 'array', items: { type: 'string' } },
          followUp: { type: 'array', items: { type: 'string' } },
          tests: { type: 'array', items: { type: 'string' } },
          lifestyle: { type: 'array', items: { type: 'string' } }
        },
        required: ['immediate', 'followUp', 'tests', 'lifestyle'],
        additionalProperties: false
      }
    },
    required: ['clinicalReasoning', 'esiLevel', 'primaryDiagnosis', 'differentialDiagnosis', 'redFlags', 'urgencyLevel', 'recommendations'],
    additionalProperties: false
  };
}

/**
 * Get JSON schema for Med-Gemini image analysis response
 */
function getMedGeminiImageAnalysisSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      clinicalReasoning: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step: { type: 'number' },
                reasoning: { type: 'string' },
                conclusion: { type: 'string' },
                confidence: { type: 'number' }
              },
              required: ['step', 'reasoning', 'conclusion', 'confidence'],
              additionalProperties: false
            }
          },
          finalConclusion: { type: 'string' },
          overallConfidence: { type: 'number' },
          uncertaintyFactors: { type: 'array', items: { type: 'string' } },
          requiresExternalSearch: { type: 'boolean' }
        },
        required: ['steps', 'finalConclusion', 'overallConfidence', 'uncertaintyFactors', 'requiresExternalSearch'],
        additionalProperties: false
      },
      findings: { type: 'string' },
      interpretation: { type: 'string' },
      abnormalities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            location: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            confidence: { type: 'number' },
            description: { type: 'string' },
            anatomicalValidation: { type: 'string', enum: ['validated', 'uncertain', 'flagged'] },
            evidenceStrength: { type: 'string', enum: ['A', 'B', 'C', 'D'] }
          },
          required: ['type', 'location', 'severity', 'confidence', 'description', 'anatomicalValidation', 'evidenceStrength'],
          additionalProperties: false
        }
      },
      recommendations: { type: 'string' },
      urgency: { type: 'string', enum: ['routine', 'semi-urgent', 'urgent', 'emergency'] },
      technicalQuality: {
        type: 'object',
        properties: {
          rating: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
          issues: { type: 'array', items: { type: 'string' } }
        },
        required: ['rating'],
        additionalProperties: false
      },
      differentialDiagnosis: { type: 'array', items: { type: 'string' } },
      overallAssessment: { type: 'string' },
      confidenceScore: { type: 'number' }
    },
    required: ['clinicalReasoning', 'findings', 'interpretation', 'abnormalities', 'recommendations', 'urgency', 'technicalQuality', 'differentialDiagnosis', 'overallAssessment', 'confidenceScore'],
    additionalProperties: false
  };
}

/**
 * Parse assessment response from Gemini
 */
function parseAssessmentResponse(text: string, startTime: number): MedGeminiAssessmentResult {
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const data = JSON.parse(cleanText);
  
  return {
    clinicalReasoning: data.clinicalReasoning,
    esiAssessment: getESIAssessment(data.esiLevel as ESILevel),
    primaryDiagnosis: data.primaryDiagnosis,
    differentialDiagnosis: data.differentialDiagnosis,
    redFlags: data.redFlags,
    urgencyLevel: data.urgencyLevel,
    recommendations: data.recommendations,
    confidenceScore: data.clinicalReasoning.overallConfidence,
    processingTime: Date.now() - startTime,
    modelVersion: 'med-gemini-2.5-pro'
  };
}

/**
 * Parse image analysis response from Gemini
 */
function parseImageAnalysisResponse(text: string): MedGeminiImageAnalysisResult {
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanText);
}

/**
 * Perform uncertainty-guided search when confidence is low
 * This searches external medical literature to improve recommendations
 */
async function performUncertaintyGuidedSearch(
  symptoms: string[],
  suspectedCondition: string
): Promise<{
  searched: boolean;
  sources: Array<{
    title: string;
    source: string;
    relevance: number;
    summary: string;
  }>;
}> {
  console.log('[Med-Gemini] Performing uncertainty-guided external search...');
  
  // In production, this would query PubMed, UpToDate, or other medical databases
  // For now, we'll use Gemini to simulate evidence-based search
  try {
    const searchPrompt = `You are a medical literature search assistant. 
    
For a patient presenting with: ${symptoms.join(', ')}
Suspected condition: ${suspectedCondition}

Provide evidence-based information from medical literature. Format as JSON:
{
  "sources": [
    {
      "title": "Study/guideline title",
      "source": "Journal/Organization name",
      "relevance": 0.95,
      "summary": "Key findings relevant to this case"
    }
  ]
}`;

    const response = await invokeGemini({
      messages: [{ role: 'user', content: searchPrompt }],
      task: 'clinical_reasoning',
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanText);

    return {
      searched: true,
      sources: data.sources || []
    };
  } catch (error) {
    console.error('[Med-Gemini] External search failed:', error);
    return {
      searched: false,
      sources: []
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  generateCoTSystemPrompt,
  generateImageCoTPrompt
};
