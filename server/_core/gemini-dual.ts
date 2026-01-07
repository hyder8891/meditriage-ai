/**
 * Gemini Dual Model Integration Layer
 * 
 * This module provides backward compatibility for existing code that uses
 * invokeGeminiFlash and invokeGeminiPro functions.
 * 
 * For new code, prefer importing directly from './gemini':
 * - invokeGemini() for automatic model selection based on task
 * - invokeGeminiPro() for complex medical tasks
 * - invokeGeminiFlash() for fast responses
 */

import { invokeGemini, type GeminiResult } from './gemini';

// ============================================================================
// Medical Knowledge Base (for context)
// ============================================================================

const MEDICAL_KNOWLEDGE_BASE = `
# Medical Knowledge Base - My Doctor

## Disease Ontology (10,000+ Diseases)
This system has comprehensive knowledge of diseases from the Disease Ontology including:
- Infectious diseases (bacterial, viral, parasitic, fungal)
- Chronic diseases (diabetes, hypertension, cardiovascular)
- Autoimmune disorders
- Genetic disorders
- Cancers and neoplasms
- Neurological disorders
- Respiratory diseases
- Gastrointestinal disorders
- Endocrine disorders
- Hematological disorders

## Human Phenotype Ontology (16,000+ Phenotypes)
Complete phenotype knowledge including:
- Clinical signs and symptoms
- Laboratory abnormalities
- Imaging findings
- Physiological measurements
- Behavioral phenotypes
- Growth and developmental abnormalities

## Iraqi Medical Context

### Common Diseases in Iraq
- **Infectious Diseases**: Cholera, typhoid fever, leishmaniasis (cutaneous and visceral), brucellosis, tuberculosis, hepatitis A/B/C
- **Parasitic Infections**: Giardiasis, amoebiasis, schistosomiasis
- **Chronic Diseases**: Diabetes mellitus (high prevalence), hypertension, cardiovascular disease
- **Nutritional**: Iron deficiency anemia, vitamin D deficiency
- **Environmental**: Heat-related illnesses, dust-related respiratory conditions

### Iraqi Pharmaceutical Database
Common medications available in Iraq:
- **Antibiotics**: Amoxicillin, Ciprofloxacin, Azithromycin, Metronidazole, Ceftriaxone
- **Antihypertensives**: Enalapril, Amlodipine, Atenolol, Losartan
- **Diabetes**: Metformin, Glibenclamide, Insulin (various types)
- **Pain/Fever**: Paracetamol, Ibuprofen, Diclofenac
- **Gastrointestinal**: Omeprazole, Ranitidine, ORS (oral rehydration salts)
- **Antimalarials**: Chloroquine, Artemether-Lumefantrine
- **Antiparasitics**: Albendazole, Mebendazole, Metronidazole

### Healthcare Infrastructure
- Primary healthcare centers (PHCs) in most districts
- Secondary hospitals in major cities
- Tertiary care in Baghdad, Basra, Erbil, Mosul
- Limited specialist availability in rural areas
- Resource constraints: imaging, lab tests, medications
- Referral system challenges

### Cultural & Social Factors
- Family-centered healthcare decisions
- Gender considerations in examination
- Ramadan fasting considerations for medications
- Traditional medicine practices
- Language: Arabic (primary), Kurdish (northern regions)
- Health literacy variations

## Clinical Reasoning Principles
- Evidence-based medicine
- Differential diagnosis methodology
- Red flag identification
- Urgency assessment (emergency, urgent, semi-urgent, non-urgent, routine)
- Iraqi context adaptation
- Resource-appropriate recommendations

## Safety Protocols
- Always identify life-threatening conditions first
- Clear escalation criteria
- Appropriate referral recommendations
- Cultural sensitivity
- Clear communication in Arabic or English
`;

// ============================================================================
// Configuration Types
// ============================================================================

interface GeminiProConfig {
  temperature?: number;
  thinkingLevel?: 'high' | 'medium' | 'low';
  grounding?: boolean;
  systemInstruction?: string;
}

interface GeminiFlashConfig {
  temperature?: number;
  thinkingLevel?: 'low' | 'medium';
  audioInput?: boolean;
  systemInstruction?: string;
  response_format?: any;
}

// ============================================================================
// Gemini Pro (for complex medical reasoning)
// ============================================================================

/**
 * Invoke Gemini Pro for clinical reasoning
 * Use for: Differential diagnosis, evidence-based research, clinician decision support
 */
export async function invokeGeminiPro(
  messages: Array<{ role: string; content: string }>,
  config: GeminiProConfig = {}
): Promise<string> {
  const {
    temperature = 0.3,
    thinkingLevel = 'high',
    grounding = true,
    systemInstruction,
  } = config;

  // Build system instruction with medical knowledge base
  const fullSystemInstruction = `${MEDICAL_KNOWLEDGE_BASE}\n\n${systemInstruction || ''}

You are an expert medical AI assistant with deep clinical reasoning capabilities.
Use Chain-of-Thought reasoning for complex diagnostic cases.
${grounding ? 'Use Google Search to verify information against current medical guidelines and research.' : ''}
Provide evidence-based recommendations with citations when possible.
Consider Iraqi medical context in all recommendations.`;

  // Format messages with system instruction
  const formattedMessages = [
    { role: 'system' as const, content: fullSystemInstruction },
    ...messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  // Determine thinking budget based on level
  const thinkingBudgets = { high: 2048, medium: 1024, low: 256 };
  const thinkingBudget = thinkingBudgets[thinkingLevel];

  const response = await invokeGemini({
    messages: formattedMessages,
    model: 'pro',
    temperature,
    thinkingBudget,
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  console.log(`[Gemini Pro] Response generated (${text.length} chars, thinking: ${thinkingLevel}, grounding: ${grounding})`);
  return text;
}

// ============================================================================
// Gemini Flash (for fast triage)
// ============================================================================

/**
 * Invoke Gemini Flash for fast triage
 * Use for: Symptom checker, voice input, case documentation
 */
export async function invokeGeminiFlash(
  messages: Array<{ role: string; content: string | Array<any> }>,
  config: GeminiFlashConfig = {}
): Promise<any> {
  const {
    temperature = 0.7,
    thinkingLevel = 'low',
    systemInstruction,
    response_format,
  } = config;

  // Build system instruction with medical knowledge base
  const fullSystemInstruction = `${MEDICAL_KNOWLEDGE_BASE}\n\n${systemInstruction || ''}

You are a fast medical triage AI assistant.
Provide immediate, accurate triage assessments.
Use urgency levels: Red (Emergency), Yellow (Urgent), Green (Routine).
Be concise and actionable.
Consider Iraqi medical context.`;

  // Format messages with system instruction
  const formattedMessages = [
    { role: 'system' as const, content: fullSystemInstruction },
    ...messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  // Determine thinking budget based on level
  const thinkingBudgets = { medium: 512, low: 128 };
  const thinkingBudget = thinkingBudgets[thinkingLevel];

  const response = await invokeGemini({
    messages: formattedMessages,
    model: 'flash',
    temperature,
    thinkingBudget,
    response_format,
  });

  // If response_format is specified, return the full response for structured parsing
  if (response_format) {
    return response;
  }

  const content = response.choices[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  console.log(`[Gemini Flash] Response generated (${text.length} chars, thinking: ${thinkingLevel})`);
  return text;
}

// ============================================================================
// Audio Processing
// ============================================================================

/**
 * Process audio input with Gemini Flash
 * Native audio processing without transcription lag
 */
export async function invokeGeminiFlashAudio(
  audioData: Buffer | string,
  mimeType: string,
  prompt: string,
  config: GeminiFlashConfig = {}
): Promise<string> {
  const {
    temperature = 0.2,
    systemInstruction,
  } = config;

  // Build system instruction
  const fullSystemInstruction = `${MEDICAL_KNOWLEDGE_BASE}\n\n${systemInstruction || ''}

You are processing Iraqi Arabic audio input for medical triage. Listen carefully for:
- Symptoms and their severity
- Vocal markers of distress (pain, difficulty breathing)
- Urgency indicators
- Cultural context and communication style

Provide immediate triage assessment.`;

  // Prepare audio content
  const audioContent = typeof audioData === 'string' 
    ? audioData // Base64 string
    : audioData.toString('base64');

  const response = await invokeGemini({
    messages: [
      { role: 'system', content: fullSystemInstruction },
      {
        role: 'user',
        content: [
          {
            type: 'file_url',
            file_url: {
              url: `data:${mimeType};base64,${audioContent}`,
              mime_type: mimeType as any,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
    model: 'flash',
    temperature,
  });

  const content = response.choices[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  console.log(`[Gemini Flash Audio] Response generated (${text.length} chars)`);
  return text;
}

// ============================================================================
// Exports for backward compatibility
// ============================================================================

export { MEDICAL_KNOWLEDGE_BASE };
