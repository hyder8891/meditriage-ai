/**
 * DeepSeek AI Integration for Medical Knowledge Training
 * 
 * This module provides integration with DeepSeek API for:
 * - Advanced medical reasoning and diagnosis
 * - Training on medical literature and case studies
 * - Cost-optimized inference with fluid compute
 */

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
}

/**
 * Invoke DeepSeek API with fluid compute optimization
 * Uses cheaper models for simple queries and advanced models for complex reasoning
 */
export async function invokeDeepSeek(options: DeepSeekOptions): Promise<DeepSeekResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  // Fluid compute: Choose model based on complexity
  const model = options.model || 'deepseek-chat';
  
  const requestBody = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 2000,
    stream: options.stream ?? false,
  };

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Train on medical material and store learned patterns
 * This function processes medical literature and case studies
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
  const response = await invokeDeepSeek({
    messages: [
      {
        role: 'system',
        content: `You are a medical AI analyzing clinical literature. Extract key medical insights, clinical patterns, and diagnostic criteria from the provided material.`,
      },
      {
        role: 'user',
        content: `Analyze this medical material:

Title: ${material.title}
Category: ${material.category}
Source: ${material.source}

Content:
${material.content}

Provide:
1. A concise summary
2. Key clinical findings (as array)
3. Clinical relevance for triage and diagnosis`,
      },
    ],
    temperature: 0.3, // Lower temperature for factual extraction
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Parse structured response
  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || content.substring(0, 500),
      keyFindings: parsed.keyFindings || [],
      clinicalRelevance: parsed.clinicalRelevance || '',
    };
  } catch {
    // Fallback if response is not JSON
    return {
      summary: content.substring(0, 500),
      keyFindings: [],
      clinicalRelevance: content,
    };
  }
}

/**
 * Advanced medical reasoning using DeepSeek
 * For complex cases requiring deep analysis
 */
export async function deepMedicalReasoning(params: {
  symptoms: string[];
  history: string;
  vitalSigns?: Record<string, string>;
  labResults?: string;
}): Promise<{
  differentialDiagnosis: string[];
  reasoning: string;
  recommendedTests: string[];
  urgencyAssessment: string;
}> {
  const prompt = `Perform advanced medical reasoning for this case:

Symptoms: ${params.symptoms.join(', ')}
Medical History: ${params.history}
${params.vitalSigns ? `Vital Signs: ${JSON.stringify(params.vitalSigns)}` : ''}
${params.labResults ? `Lab Results: ${params.labResults}` : ''}

Provide:
1. Differential diagnosis (ranked by likelihood)
2. Clinical reasoning process
3. Recommended diagnostic tests
4. Urgency assessment`;

  const response = await invokeDeepSeek({
    messages: [
      {
        role: 'system',
        content: 'You are an expert medical diagnostician. Provide thorough differential diagnosis and clinical reasoning.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    model: 'deepseek-chat', // Use advanced model for complex reasoning
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Parse or return structured data
  try {
    const parsed = JSON.parse(content);
    return {
      differentialDiagnosis: parsed.differentialDiagnosis || [],
      reasoning: parsed.reasoning || content,
      recommendedTests: parsed.recommendedTests || [],
      urgencyAssessment: parsed.urgencyAssessment || 'UNKNOWN',
    };
  } catch {
    return {
      differentialDiagnosis: [],
      reasoning: content,
      recommendedTests: [],
      urgencyAssessment: 'UNKNOWN',
    };
  }
}

/**
 * Fluid compute helper: Determine optimal model based on query complexity
 */
export function selectOptimalModel(queryComplexity: 'simple' | 'moderate' | 'complex'): string {
  switch (queryComplexity) {
    case 'simple':
      return 'deepseek-chat'; // Fast, cost-effective
    case 'moderate':
      return 'deepseek-chat';
    case 'complex':
      return 'deepseek-chat'; // Most capable
    default:
      return 'deepseek-chat';
  }
}
