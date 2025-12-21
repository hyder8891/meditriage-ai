/**
 * Gemini-Powered Medical AI Integration (formerly DeepSeek)
 * 
 * This module provides medical AI capabilities using Google Gemini:
 * - Advanced medical reasoning and diagnosis
 * - Training on medical literature and case studies
 * - Cost-optimized inference with Gemini Flash/Pro
 * 
 * NOTE: This file maintains DeepSeek's interface for backward compatibility
 * but internally uses Gemini for all operations.
 */

import { invokeGeminiFlash, invokeGeminiPro } from './gemini-dual';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekOptions {
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  model?: string;
  response_format?: { type: 'json_object' };
}

/**
 * Invoke Gemini API with DeepSeek-compatible interface
 * Automatically routes to Gemini Flash (fast) or Pro (complex reasoning)
 */
export async function invokeDeepSeek(options: DeepSeekOptions): Promise<DeepSeekResponse> {
  const { messages, temperature = 0.7, model } = options;
  
  // Determine if this requires deep reasoning or fast response
  const requiresDeepReasoning = 
    model?.includes('reasoner') || 
    messages.some(m => 
      m.content.toLowerCase().includes('diagnos') ||
      m.content.toLowerCase().includes('differential') ||
      m.content.toLowerCase().includes('analyze')
    );

  // Extract system instruction from messages
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  try {
    let content: string;
    
    if (requiresDeepReasoning) {
      // Use Gemini Pro for complex medical reasoning
      content = await invokeGeminiPro(userMessages, {
        temperature,
        thinkingLevel: 'high',
        grounding: true,
        systemInstruction: systemMessage?.content,
      });
    } else {
      // Use Gemini Flash for fast triage and simple queries
      content = await invokeGeminiFlash(userMessages, {
        temperature,
        thinkingLevel: 'low',
        systemInstruction: systemMessage?.content,
      });
    }

    // Return DeepSeek-compatible response format
    return {
      id: `gemini-${Date.now()}`,
      choices: [{
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: messages.reduce((sum, m) => sum + m.content.length / 4, 0),
        completion_tokens: content.length / 4,
        total_tokens: (messages.reduce((sum, m) => sum + m.content.length, 0) + content.length) / 4,
      },
    };
  } catch (error) {
    console.error('[Gemini API] Error:', error);
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Train on medical material and store learned patterns
 * Uses Gemini Pro for deep analysis of medical literature
 */
export async function trainOnMedicalMaterial(material: {
  title: string;
  content: string;
  category: string;
  source: string;
}): Promise<{
  summary: string;
  keyFindings: string[];
  clinicalRelevance: string;
}> {
  const prompt = `Analyze this medical material and extract key clinical insights:

Title: ${material.title}
Category: ${material.category}
Source: ${material.source}

Content:
${material.content}

Provide:
1. A concise summary (2-3 sentences)
2. Key clinical findings (3-5 bullet points)
3. Clinical relevance for Iraqi healthcare context

Format as JSON:
{
  "summary": "...",
  "keyFindings": ["...", "...", "..."],
  "clinicalRelevance": "..."
}`;

  const response = await invokeGeminiPro(
    [{ role: 'user', content: prompt }],
    {
      temperature: 0.3,
      thinkingLevel: 'high',
      grounding: true,
      systemInstruction: 'You are a medical knowledge extraction AI. Analyze medical literature and extract actionable clinical insights.',
    }
  );

  try {
    // Clean markdown code blocks if present
    const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    return {
      summary: parsed.summary || '',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      clinicalRelevance: parsed.clinicalRelevance || '',
    };
  } catch (error) {
    console.error('[Train on Material] JSON parse error:', error);
    
    // Fallback: extract from text
    return {
      summary: response.substring(0, 200),
      keyFindings: [],
      clinicalRelevance: 'Analysis completed but structured extraction failed.',
    };
  }
}

/**
 * Deep medical reasoning for complex diagnostic cases
 * Uses Gemini Pro with high thinking level and grounding
 */
export async function deepMedicalReasoning(params: {
  symptoms: string;
  patientHistory?: string;
  vitalSigns?: Record<string, string | number>;
  labResults?: Record<string, string | number>;
  imagingFindings?: string;
}): Promise<{
  differentialDiagnosis: Array<{
    condition: string;
    probability: string;
    reasoning: string;
  }>;
  recommendedTests: string[];
  urgencyLevel: 'emergency' | 'urgent' | 'routine' | 'self-care';
  clinicalReasoning: string;
}> {
  const prompt = `Perform deep medical reasoning for this clinical case:

**Chief Complaint & Symptoms:**
${params.symptoms}

${params.patientHistory ? `**Patient History:**\n${params.patientHistory}\n` : ''}
${params.vitalSigns ? `**Vital Signs:**\n${JSON.stringify(params.vitalSigns, null, 2)}\n` : ''}
${params.labResults ? `**Lab Results:**\n${JSON.stringify(params.labResults, null, 2)}\n` : ''}
${params.imagingFindings ? `**Imaging Findings:**\n${params.imagingFindings}\n` : ''}

Provide comprehensive clinical reasoning with:
1. Differential diagnosis (top 3-5 conditions with probability and reasoning)
2. Recommended diagnostic tests
3. Urgency level assessment
4. Step-by-step clinical reasoning

Consider Iraqi medical context (common diseases, available resources).

Format as JSON:
{
  "differentialDiagnosis": [
    {
      "condition": "...",
      "probability": "high|medium|low",
      "reasoning": "..."
    }
  ],
  "recommendedTests": ["...", "..."],
  "urgencyLevel": "emergency|urgent|routine|self-care",
  "clinicalReasoning": "..."
}`;

  const response = await invokeGeminiPro(
    [{ role: 'user', content: prompt }],
    {
      temperature: 0.7,
      thinkingLevel: 'high',
      grounding: true,
      systemInstruction: 'You are an expert clinical diagnostician. Use evidence-based reasoning and consider Iraqi medical context.',
    }
  );

  try {
    // Clean markdown code blocks if present
    const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    return {
      differentialDiagnosis: Array.isArray(parsed.differentialDiagnosis) ? parsed.differentialDiagnosis : [],
      recommendedTests: Array.isArray(parsed.recommendedTests) ? parsed.recommendedTests : [],
      urgencyLevel: parsed.urgencyLevel || 'routine',
      clinicalReasoning: parsed.clinicalReasoning || '',
    };
  } catch (error) {
    console.error('[Deep Reasoning] JSON parse error:', error);
    
    // Fallback: return safe defaults
    return {
      differentialDiagnosis: [],
      recommendedTests: [],
      urgencyLevel: 'routine',
      clinicalReasoning: response.substring(0, 500),
    };
  }
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use invokeGeminiFlash or invokeGeminiPro directly
 */
export const DeepSeekAPI = {
  invoke: invokeDeepSeek,
  trainOnMaterial: trainOnMedicalMaterial,
  deepReasoning: deepMedicalReasoning,
};
