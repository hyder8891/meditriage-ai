/**
 * Comprehensive Medical Image Analysis
 * Uses Gemini Pro for accurate medical imaging interpretation
 * 
 * Supports: X-ray, MRI, CT, Ultrasound, Mammography, ECG, Pathology, Retinal, PET, DEXA, Fluoroscopy
 */

import { invokeGemini } from './gemini';
import { generateImageCoTPrompt, performMedGeminiImageAnalysis } from './med-gemini';

export type ImagingModality = 
  | 'xray' 
  | 'mri' 
  | 'ct' 
  | 'ultrasound' 
  | 'mammography' 
  | 'ecg' 
  | 'pathology' 
  | 'retinal'
  | 'pet'
  | 'dexa'
  | 'fluoroscopy';

export interface MedicalImageAnalysisParams {
  imageBase64: string;
  mimeType: string;
  modality: ImagingModality;
  clinicalContext?: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  bodyPart?: string;
  language?: 'en' | 'ar';
}

export interface MedicalImageAnalysisResult {
  modality: ImagingModality;
  findings: string;
  interpretation: string;
  recommendations: string;
  abnormalities: Array<{
    type: string;
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    description: string;
  }>;
  overallAssessment: string;
  urgency: 'routine' | 'semi-urgent' | 'urgent' | 'emergency';
  technicalQuality?: {
    rating: 'poor' | 'fair' | 'good' | 'excellent';
    issues?: string[];
  };
  differentialDiagnosis?: string[];
}

/**
 * Get specialized prompt for each imaging modality
 */
function getModalityPrompt(params: MedicalImageAnalysisParams): string {
  const { modality, clinicalContext, patientAge, patientGender, bodyPart, language } = params;
  
  const contextInfo = [
    clinicalContext && `Clinical context: ${clinicalContext}`,
    patientAge && `Patient age: ${patientAge}`,
    patientGender && `Gender: ${patientGender}`,
    bodyPart && `Body part: ${bodyPart}`
  ].filter(Boolean).join('. ');

  const modalityInstructions: Record<ImagingModality, { en: string; ar: string }> = {
    xray: {
      en: `Analyze this X-ray image as an expert radiologist. Focus on bone integrity, soft tissue abnormalities, foreign bodies, and alignment. Assess for fractures, dislocations, arthritis, masses, and pneumothorax if chest X-ray.`,
      ar: `قم بتحليل هذه الصورة الشعاعية كطبيب أشعة خبير. ركز على سلامة العظام، شذوذات الأنسجة الرخوة، الأجسام الغريبة، والمحاذاة. قيّم الكسور، الخلع، التهاب المفاصل، الكتل، واسترواح الصدر إذا كانت أشعة صدر.`
    },
    mri: {
      en: `Analyze this MRI scan as an expert radiologist. Evaluate soft tissue structures, organs, vasculature, and detect lesions, tumors, inflammation, or degenerative changes. Assess signal intensity on T1/T2 weighted images if visible.`,
      ar: `قم بتحليل هذا الفحص بالرنين المغناطيسي كطبيب أشعة خبير. قيّم بنية الأنسجة الرخوة، الأعضاء، الأوعية الدموية، واكتشف الآفات، الأورام، الالتهابات، أو التغيرات التنكسية. قيّم شدة الإشارة على صور T1/T2 إذا كانت مرئية.`
    },
    ct: {
      en: `Analyze this CT scan as an expert radiologist. Evaluate anatomical structures, bone and soft tissue detail, vascular structures, and identify masses, hemorrhage, fractures, or organ abnormalities. Assess contrast enhancement if present.`,
      ar: `قم بتحليل هذا الفحص المقطعي المحوسب كطبيب أشعة خبير. قيّم البنى التشريحية، تفاصيل العظام والأنسجة الرخوة، البنى الوعائية، وحدد الكتل، النزيف، الكسور، أو شذوذات الأعضاء. قيّم تعزيز التباين إذا كان موجوداً.`
    },
    ultrasound: {
      en: `Analyze this ultrasound image as an expert sonographer/radiologist. Evaluate echogenicity, organ size and structure, fluid collections, masses, and vascular flow if Doppler. Assess fetal development if obstetric ultrasound.`,
      ar: `قم بتحليل هذه الصورة بالموجات فوق الصوتية كأخصائي تصوير بالموجات فوق الصوتية/طبيب أشعة خبير. قيّم الصدوية، حجم وبنية الأعضاء، تجمعات السوائل، الكتل، والتدفق الوعائي إذا كان دوبلر. قيّم تطور الجنين إذا كانت موجات فوق صوتية توليدية.`
    },
    mammography: {
      en: `Analyze this mammogram as an expert breast radiologist. Evaluate breast density, identify masses, calcifications, architectural distortion, or asymmetries. Use BI-RADS classification. Assess for signs of malignancy.`,
      ar: `قم بتحليل هذه الصورة الشعاعية للثدي كطبيب أشعة متخصص في الثدي. قيّم كثافة الثدي، حدد الكتل، التكلسات، التشوه المعماري، أو عدم التماثل. استخدم تصنيف BI-RADS. قيّم علامات الخباثة.`
    },
    ecg: {
      en: `Analyze this ECG/EKG as an expert cardiologist. Evaluate heart rate, rhythm, PR interval, QRS duration, QT interval, ST segment, and T wave morphology. Identify arrhythmias, ischemia, infarction, or conduction abnormalities.`,
      ar: `قم بتحليل هذا تخطيط القلب الكهربائي كطبيب قلب خبير. قيّم معدل القلب، الإيقاع، فترة PR، مدة QRS، فترة QT، قطعة ST، وشكل موجة T. حدد اضطرابات النظم، نقص التروية، الاحتشاء، أو شذوذات التوصيل.`
    },
    pathology: {
      en: `Analyze this pathology slide as an expert pathologist. Evaluate cellular morphology, tissue architecture, nuclear features, mitotic activity, and identify normal vs. abnormal cells. Assess for malignancy, inflammation, or infection.`,
      ar: `قم بتحليل هذه الشريحة المرضية كطبيب تشريح مرضي خبير. قيّم شكل الخلايا، بنية الأنسجة، ميزات النواة، النشاط الانقسامي، وحدد الخلايا الطبيعية مقابل غير الطبيعية. قيّم الخباثة، الالتهاب، أو العدوى.`
    },
    retinal: {
      en: `Analyze this retinal image as an expert ophthalmologist. Evaluate optic disc, macula, blood vessels, and retinal layers. Identify diabetic retinopathy, macular degeneration, glaucoma, retinal detachment, or vascular occlusions.`,
      ar: `قم بتحليل هذه الصورة الشبكية كطبيب عيون خبير. قيّم القرص البصري، البقعة الصفراء، الأوعية الدموية، وطبقات الشبكية. حدد اعتلال الشبكية السكري، التنكس البقعي، الجلوكوما، انفصال الشبكية، أو انسداد الأوعية.`
    },
    pet: {
      en: `Analyze this PET scan as an expert nuclear medicine physician. Evaluate metabolic activity, SUV values, and tracer uptake patterns. Identify hypermetabolic lesions, staging of malignancy, or inflammatory processes.`,
      ar: `قم بتحليل هذا الفحص بالتصوير المقطعي بالإصدار البوزيتروني كطبيب طب نووي خبير. قيّم النشاط الأيضي، قيم SUV، وأنماط امتصاص المتتبع. حدد الآفات عالية الأيض، تصنيف الخباثة، أو العمليات الالتهابية.`
    },
    dexa: {
      en: `Analyze this DEXA scan as an expert radiologist. Evaluate bone mineral density (BMD), T-score, and Z-score. Assess for osteoporosis, osteopenia, or fracture risk. Compare to age-matched norms.`,
      ar: `قم بتحليل هذا الفحص بقياس كثافة العظام كطبيب أشعة خبير. قيّم كثافة المعادن في العظام (BMD)، درجة T، ودرجة Z. قيّم هشاشة العظام، نقص كثافة العظام، أو خطر الكسر. قارن بالمعايير المطابقة للعمر.`
    },
    fluoroscopy: {
      en: `Analyze this fluoroscopy image as an expert radiologist. Evaluate real-time organ function, contrast flow, swallowing mechanics, or joint movement. Identify obstructions, strictures, or functional abnormalities.`,
      ar: `قم بتحليل هذه الصورة التنظيرية الفلورية كطبيب أشعة خبير. قيّم وظيفة الأعضاء في الوقت الفعلي، تدفق التباين، آليات البلع، أو حركة المفاصل. حدد الانسدادات، التضيقات، أو الشذوذات الوظيفية.`
    }
  };

  // Critical language enforcement instruction
  const languageEnforcement = language === 'ar' 
    ? `\n\n## تعليمات اللغة الإلزامية:\n**يجب أن تكون جميع الإجابات باللغة العربية فقط.**\n- جميع النتائج (findings) يجب أن تكون بالعربية\n- جميع التفسيرات (interpretation) يجب أن تكون بالعربية\n- جميع التوصيات (recommendations) يجب أن تكون بالعربية\n- جميع الأوصاف (descriptions) يجب أن تكون بالعربية\n- جميع التقييمات (assessments) يجب أن تكون بالعربية\n- جميع التشخيصات التفريقية يجب أن تكون بالعربية\n- لا تستخدم اللغة الإنجليزية في أي جزء من الإجابة\n- المصطلحات الطبية يمكن كتابتها بالعربية مع الاختصار الإنجليزي بين قوسين إذا لزم الأمر`
    : '';

  const modalityInstruction = modalityInstructions[modality][language || 'en'];

  const basePrompt = language === 'ar'
    ? `${modalityInstruction}${languageEnforcement}\n\n${contextInfo ? `معلومات السياق: ${contextInfo}\n\n` : ''}قدم تحليلاً طبياً شاملاً يتضمن:\n1. النتائج الرئيسية المرئية (بالعربية فقط)\n2. التفسير السريري والتشخيص المحتمل (بالعربية فقط)\n3. التوصيات الطبية والمتابعة (بالعربية فقط)\n4. الشذوذات المكتشفة (النوع، الموقع، الخطورة، درجة الثقة 0-100، الوصف - كلها بالعربية)\n5. التقييم العام ومستوى الإلحاح (بالعربية فقط)\n6. جودة الصورة التقنية (ممتاز/جيد/مقبول/ضعيف - بالعربية)\n7. التشخيصات التفريقية المحتملة (بالعربية فقط)\n\n**تذكير مهم: يجب أن تكون جميع القيم النصية في JSON باللغة العربية فقط. لا تستخدم الإنجليزية إطلاقاً.**\n\nقدم الإجابة بصيغة JSON:\n{\n  "findings": "النتائج التفصيلية بالعربية",\n  "interpretation": "التفسير السريري بالعربية",\n  "recommendations": "التوصيات بالعربية",\n  "abnormalities": [{"type": "نوع بالعربية", "location": "موقع بالعربية", "severity": "low|medium|high|critical", "confidence": 85, "description": "وصف بالعربية"}],\n  "overallAssessment": "التقييم الشامل بالعربية",\n  "urgency": "routine|semi-urgent|urgent|emergency",\n  "technicalQuality": {"rating": "excellent|good|fair|poor", "issues": ["مشكلة بالعربية"]},\n  "differentialDiagnosis": ["تشخيص بالعربية 1", "تشخيص بالعربية 2"]\n}`
    : `${modalityInstruction}\n\n${contextInfo ? `Context: ${contextInfo}\n\n` : ''}Provide a comprehensive medical analysis including:\n1. Key visible findings\n2. Clinical interpretation and potential diagnosis\n3. Medical recommendations and follow-up\n4. Detected abnormalities (type, location, severity, confidence 0-100, description)\n5. Overall assessment and urgency level\n6. Technical image quality (excellent/good/fair/poor)\n7. Differential diagnoses\n\nProvide response in JSON format:\n{\n  "findings": "detailed findings",\n  "interpretation": "clinical interpretation",\n  "recommendations": "recommendations",\n  "abnormalities": [{"type": "type", "location": "location", "severity": "low|medium|high|critical", "confidence": 85, "description": "description"}],\n  "overallAssessment": "overall assessment",\n  "urgency": "routine|semi-urgent|urgent|emergency",\n  "technicalQuality": {"rating": "excellent|good|fair|poor", "issues": ["issue1"]},\n  "differentialDiagnosis": ["diagnosis1", "diagnosis2"]\n}`;

  return basePrompt;
}

/**
 * Analyze medical image with specialized prompts for each modality
 * Uses Med-Gemini for high accuracy medical imaging analysis with Chain-of-Thought reasoning
 * 
 * Med-Gemini capabilities:
 * - Chain-of-Thought (CoT) systematic analysis
 * - Anatomical validation against medical atlases
 * - Confidence scoring with evidence grading (A/B/C/D)
 * - Uncertainty-guided search for complex cases
 */
export async function analyzeMedicalImage(
  params: MedicalImageAnalysisParams
): Promise<MedicalImageAnalysisResult> {
  // Generate Med-Gemini Chain-of-Thought prompt for image analysis
  const medGeminiCoTPrompt = generateImageCoTPrompt(params.modality, params.language || 'en');
  const modalityPrompt = getModalityPrompt(params);
  
  // Combine Med-Gemini CoT methodology with modality-specific instructions
  const prompt = `${medGeminiCoTPrompt}\n\n${modalityPrompt}`;

  console.log(`[Medical Imaging] Analyzing ${params.modality} image with Med-Gemini Chain-of-Thought reasoning`);

  // Use Med-Gemini (Gemini Pro) with Chain-of-Thought reasoning for medical imaging
  // Med-Gemini achieves state-of-the-art results in medical reasoning and imaging analysis
  const response = await invokeGemini({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${params.mimeType};base64,${params.imageBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    task: 'medical_imaging', // Automatically uses Gemini Pro for Med-Gemini capabilities
    temperature: 0.2, // Low temperature for clinical accuracy
    thinkingBudget: 4096, // Higher thinking budget for Med-Gemini Chain-of-Thought analysis
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'medical_image_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            findings: { type: 'string', description: 'Detailed medical findings from the image' },
            interpretation: { type: 'string', description: 'Clinical interpretation' },
            recommendations: { type: 'string', description: 'Medical recommendations' },
            abnormalities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  location: { type: 'string' },
                  severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  confidence: { type: 'number' },
                  description: { type: 'string' }
                },
                required: ['type', 'location', 'severity', 'confidence', 'description'],
                additionalProperties: false
              }
            },
            overallAssessment: { type: 'string', description: 'Overall assessment' },
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
            differentialDiagnosis: { type: 'array', items: { type: 'string' } }
          },
          required: ['findings', 'interpretation', 'recommendations', 'abnormalities', 'overallAssessment', 'urgency'],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  // Try to parse JSON response with multiple strategies
  try {
    // Strategy 1: Remove markdown code blocks
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Strategy 2: Extract JSON object if embedded in text
    if (!cleanText.startsWith('{')) {
      const jsonMatch = cleanText.match(/({[\s\S]*"findings"[\s\S]*})/);
      if (jsonMatch) {
        cleanText = jsonMatch[1];
      }
    }
    
    const parsed = JSON.parse(cleanText);
    
    // Validate that we have the expected structure
    if (!parsed || typeof parsed !== 'object' || !('findings' in parsed)) {
      throw new Error('Invalid structure');
    }

    console.log(`[Medical Imaging] Analysis complete - Urgency: ${parsed.urgency}, Abnormalities: ${parsed.abnormalities?.length || 0}`);

    return {
      modality: params.modality,
      findings: parsed.findings || text,
      interpretation: parsed.interpretation || '',
      recommendations: parsed.recommendations || '',
      abnormalities: parsed.abnormalities || [],
      overallAssessment: parsed.overallAssessment || '',
      urgency: parsed.urgency || 'routine',
      technicalQuality: parsed.technicalQuality,
      differentialDiagnosis: parsed.differentialDiagnosis,
    };
  } catch (error) {
    console.error('[Medical Imaging] Failed to parse response:', error);
    console.log('[Medical Imaging] Raw response text (first 500 chars):', text.substring(0, 500));
    
    // Fallback: return raw text in findings field so UI can attempt to parse
    return {
      modality: params.modality,
      findings: text,
      interpretation: '',
      recommendations: '',
      abnormalities: [],
      overallAssessment: '',
      urgency: 'routine' as const,
    };
  }
}

/**
 * Auto-detect imaging modality from image characteristics (basic heuristic)
 * This is a simplified version - in production, you might use ML model
 */
export function detectImagingModality(
  mimeType: string,
  filename?: string
): ImagingModality {
  const lower = filename?.toLowerCase() || '';
  
  if (lower.includes('xray') || lower.includes('x-ray')) return 'xray';
  if (lower.includes('mri')) return 'mri';
  if (lower.includes('ct') || lower.includes('cat')) return 'ct';
  if (lower.includes('ultrasound') || lower.includes('us') || lower.includes('echo')) return 'ultrasound';
  if (lower.includes('mammo')) return 'mammography';
  if (lower.includes('ecg') || lower.includes('ekg')) return 'ecg';
  if (lower.includes('path') || lower.includes('histo')) return 'pathology';
  if (lower.includes('retina') || lower.includes('fundus')) return 'retinal';
  if (lower.includes('pet')) return 'pet';
  if (lower.includes('dexa') || lower.includes('dxa')) return 'dexa';
  if (lower.includes('fluoro')) return 'fluoroscopy';
  
  // Default to X-ray if uncertain
  return 'xray';
}
