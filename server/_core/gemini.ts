/**
 * Gemini AI Backend Integration (Secure)
 * All API keys stored on backend, frontend sends requests via tRPC
 */

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
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on backend');
  }

  const prompt = params.language === 'ar' 
    ? `قم بتحليل هذه الصورة الطبية/الأشعة السينية بشكل شامل. ${params.clinicalContext ? `السياق السريري: ${params.clinicalContext}` : ''}\n\nقدم تحليلاً طبياً مفصلاً يتضمن:\n1. النتائج الرئيسية المرئية\n2. التفسير السريري والتشخيص المحتمل\n3. التوصيات الطبية\n\nقدم الإجابة بصيغة JSON:\n{\n  "findings": "النتائج",\n  "interpretation": "التفسير",\n  "recommendations": "التوصيات"\n}`
    : `Analyze this medical image/X-ray comprehensively. ${params.clinicalContext ? `Clinical context: ${params.clinicalContext}` : ''}\n\nProvide a detailed medical analysis including:\n1. Key visible findings\n2. Clinical interpretation and potential diagnosis\n3. Medical recommendations\n\nProvide response in JSON format:\n{\n  "findings": "...",\n  "interpretation": "...",\n  "recommendations": "..."\n}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';

  // Try to parse JSON response
  try {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      findings: parsed.findings || text,
      interpretation: parsed.interpretation || '',
      recommendations: parsed.recommendations || '',
    };
  } catch {
    // Fallback if not JSON
    return {
      findings: text,
      interpretation: text,
      recommendations: text,
    };
  }
}

/**
 * Analyze medical document (PDF, lab report) using Gemini (Backend)
 */
export async function analyzeDocumentBackend(params: {
  documentBase64: string;
  mimeType: string;
  documentType: 'lab_report' | 'prescription' | 'medical_record';
  language?: 'en' | 'ar';
}): Promise<{
  summary: string;
  keyValues: Record<string, string>;
  abnormalFindings: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on backend');
  }

  const prompt = params.language === 'ar'
    ? `قم بتحليل هذا المستند الطبي (${params.documentType}). استخرج:\n1. ملخص شامل\n2. القيم والنتائج الرئيسية\n3. النتائج غير الطبيعية\n\nقدم الإجابة بصيغة JSON:\n{\n  "summary": "...",\n  "keyValues": {...},\n  "abnormalFindings": [...]\n}`
    : `Analyze this medical document (${params.documentType}). Extract:\n1. Comprehensive summary\n2. Key values and results\n3. Abnormal findings\n\nProvide response in JSON format:\n{\n  "summary": "...",\n  "keyValues": {...},\n  "abnormalFindings": [...]\n}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.documentBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';

  try {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      summary: parsed.summary || text,
      keyValues: parsed.keyValues || {},
      abnormalFindings: parsed.abnormalFindings || [],
    };
  } catch {
    return {
      summary: text,
      keyValues: {},
      abnormalFindings: [],
    };
  }
}
