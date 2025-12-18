/**
 * Manus LLM Backend Integration for X-Ray Analysis
 * Uses built-in Manus LLM API with vision capabilities
 */

import { invokeLLM } from './llm';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
}

/**
 * Analyze X-ray or medical image using Gemini Vision API (Backend)
 * Enhanced with abnormality detection and confidence scoring
 */
export async function analyzeXRayBackend(params: {
  imageBase64: string;
  mimeType: string;
  clinicalContext?: string;
  language?: 'en' | 'ar';
}): Promise<{
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
}> {

  const prompt = params.language === 'ar' 
    ? `قم بتحليل هذه الصورة الطبية/الأشعة السينية بشكل شامل كطبيب أشعة خبير. ${params.clinicalContext ? `السياق السريري: ${params.clinicalContext}` : ''}\n\nقدم تحليلاً طبياً مفصلاً يتضمن:\n1. النتائج الرئيسية المرئية\n2. التفسير السريري والتشخيص المحتمل\n3. التوصيات الطبية\n4. الشذوذات المكتشفة مع الموقع والخطورة ودرجة الثقة (0-100)\n5. التقييم العام ومستوى الإلحاح\n\nقدم الإجابة بصيغة JSON:\n{\n  "findings": "النتائج",\n  "interpretation": "التفسير",\n  "recommendations": "التوصيات",\n  "abnormalities": [{"type": "نوع الشذوذ", "location": "الموقع", "severity": "low|medium|high|critical", "confidence": 85, "description": "الوصف"}],\n  "overallAssessment": "التقييم العام",\n  "urgency": "routine|semi-urgent|urgent|emergency"\n}`
    : `Analyze this medical image/X-ray comprehensively as an expert radiologist. ${params.clinicalContext ? `Clinical context: ${params.clinicalContext}` : ''}\n\nProvide a detailed medical analysis including:\n1. Key visible findings\n2. Clinical interpretation and potential diagnosis\n3. Medical recommendations\n4. Detected abnormalities with location, severity, and confidence score (0-100)\n5. Overall assessment and urgency level\n\nProvide response in JSON format:\n{\n  "findings": "...",\n  "interpretation": "...",\n  "recommendations": "...",\n  "abnormalities": [{"type": "abnormality type", "location": "anatomical location", "severity": "low|medium|high|critical", "confidence": 85, "description": "detailed description"}],\n  "overallAssessment": "overall clinical assessment",\n  "urgency": "routine|semi-urgent|urgent|emergency"\n}`;

  // Use Manus built-in LLM with vision capabilities
  const response = await invokeLLM({
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
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  // Try to parse JSON response
  try {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      findings: parsed.findings || text,
      interpretation: parsed.interpretation || '',
      recommendations: parsed.recommendations || '',
      abnormalities: parsed.abnormalities || [],
      overallAssessment: parsed.overallAssessment || '',
      urgency: parsed.urgency || 'routine',
    };
  } catch {
    // Fallback if not JSON
    return {
      findings: text,
      interpretation: text,
      recommendations: text,
      abnormalities: [],
      overallAssessment: text,
      urgency: 'routine' as const,
    };
  }
}


