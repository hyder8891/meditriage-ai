/**
 * Unified Gemini AI Integration
 * 
 * This module provides all AI capabilities using Google Gemini models exclusively:
 * - Gemini 2.5 Pro: Complex medical reasoning, imaging analysis, clinical decisions
 * - Gemini 2.5 Flash: Fast triage, simple queries, patient interactions
 * 
 * Model Selection Guidelines:
 * - PRO: Medical imaging, differential diagnosis, clinical reasoning, complex analysis
 * - FLASH: Symptom triage, quick responses, simple queries, chat interactions
 */

import { ENV } from "./env";

// ============================================================================
// Types
// ============================================================================

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type GeminiResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Gemini Model Types
 * - PRO: For complex tasks requiring high accuracy (medical imaging, diagnosis)
 * - FLASH: For fast responses (triage, chat, simple queries)
 */
export type GeminiModel = "pro" | "flash";

const MODEL_IDS = {
  pro: "gemini-2.5-pro",      // High accuracy, complex reasoning
  flash: "gemini-2.5-flash",  // Fast, efficient responses
} as const;

/**
 * Task complexity levels for automatic model selection
 */
export type TaskComplexity = 
  | "medical_imaging"      // Always PRO - requires high accuracy
  | "clinical_reasoning"   // Always PRO - complex medical decisions
  | "differential_diagnosis" // Always PRO - critical medical analysis
  | "drug_interaction"     // PRO - safety critical
  | "lab_analysis"         // PRO - requires accuracy
  | "triage"               // FLASH - fast initial assessment
  | "chat"                 // FLASH - conversational
  | "simple_query"         // FLASH - quick responses
  | "translation"          // FLASH - language tasks
  | "summarization";       // FLASH - text processing

/**
 * Get the appropriate model for a given task
 */
export function getModelForTask(task: TaskComplexity): GeminiModel {
  const proTasks: TaskComplexity[] = [
    "medical_imaging",
    "clinical_reasoning", 
    "differential_diagnosis",
    "drug_interaction",
    "lab_analysis",
  ];
  
  return proTasks.includes(task) ? "pro" : "flash";
}

// ============================================================================
// Gemini Invocation Parameters
// ============================================================================

export interface GeminiParams {
  messages: Message[];
  model?: GeminiModel;
  task?: TaskComplexity;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  temperature?: number;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  thinkingBudget?: number; // Token budget for thinking (higher = more reasoning)
}

// ============================================================================
// Helper Functions
// ============================================================================

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("GEMINI API KEY is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  return undefined;
};

// ============================================================================
// Main Gemini Invocation Function
// ============================================================================

/**
 * Invoke Gemini AI with automatic model selection based on task complexity
 * 
 * @param params - Invocation parameters
 * @returns GeminiResult with AI response
 * 
 * @example
 * // For medical imaging (automatically uses PRO)
 * const result = await invokeGemini({
 *   messages: [{ role: 'user', content: [...] }],
 *   task: 'medical_imaging',
 * });
 * 
 * @example
 * // For chat (automatically uses FLASH)
 * const result = await invokeGemini({
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   task: 'chat',
 * });
 * 
 * @example
 * // Explicit model selection
 * const result = await invokeGemini({
 *   messages: [...],
 *   model: 'pro', // Force PRO model
 * });
 */
export async function invokeGemini(params: GeminiParams): Promise<GeminiResult> {
  assertApiKey();

  const {
    messages,
    model,
    task,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    temperature,
    responseFormat,
    response_format,
    thinkingBudget,
  } = params;

  // Determine model: explicit > task-based > default (flash)
  const selectedModel = model || (task ? getModelForTask(task) : "flash");
  const modelId = MODEL_IDS[selectedModel];

  // Configure thinking budget based on model and task
  const defaultThinkingBudget = selectedModel === "pro" ? 1024 : 128;
  const finalThinkingBudget = thinkingBudget ?? defaultThinkingBudget;

  const payload: Record<string, unknown> = {
    model: modelId,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Set max tokens
  payload.max_tokens = maxTokens || max_tokens || 32768;
  
  // Set thinking budget for reasoning
  payload.thinking = {
    budget_tokens: finalThinkingBudget,
  };

  // Set temperature (lower for accuracy-critical tasks)
  if (temperature !== undefined) {
    payload.temperature = temperature;
  } else {
    // Default temperatures based on task type
    payload.temperature = selectedModel === "pro" ? 0.3 : 0.7;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  console.log(`[Gemini] Invoking ${modelId} for task: ${task || 'general'}`);

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as GeminiResult;
  console.log(`[Gemini] Response received from ${modelId}`);
  
  return result;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Invoke Gemini Pro for complex medical tasks
 * Use for: Medical imaging, clinical reasoning, differential diagnosis
 */
export async function invokeGeminiPro(params: Omit<GeminiParams, 'model'>): Promise<GeminiResult> {
  return invokeGemini({ ...params, model: "pro" });
}

/**
 * Invoke Gemini Flash for fast responses
 * Use for: Triage, chat, simple queries
 */
export async function invokeGeminiFlash(params: Omit<GeminiParams, 'model'>): Promise<GeminiResult> {
  return invokeGemini({ ...params, model: "flash" });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use invokeGemini with task parameter instead
 */
export async function invokeLLM(params: Omit<GeminiParams, 'model' | 'task'>): Promise<GeminiResult> {
  return invokeGemini({ ...params, model: "flash" });
}

// ============================================================================
// Medical Imaging Analysis (Specialized for PRO model)
// ============================================================================

export interface MedicalImageAnalysisParams {
  imageBase64: string;
  mimeType: string;
  clinicalContext?: string;
  language?: 'en' | 'ar';
}

export interface MedicalImageAnalysisResult {
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
}

/**
 * Analyze X-ray or medical image using Gemini Pro
 * Enhanced with abnormality detection and confidence scoring
 */
export async function analyzeXRayBackend(params: MedicalImageAnalysisParams): Promise<MedicalImageAnalysisResult> {
  const prompt = params.language === 'ar' 
    ? `قم بتحليل هذه الصورة الطبية/الأشعة السينية بشكل شامل كطبيب أشعة خبير. ${params.clinicalContext ? `السياق السريري: ${params.clinicalContext}` : ''}\n\nقدم تحليلاً طبياً مفصلاً يتضمن:\n1. النتائج الرئيسية المرئية\n2. التفسير السريري والتشخيص المحتمل\n3. التوصيات الطبية\n4. الشذوذات المكتشفة مع الموقع والخطورة ودرجة الثقة (0-100)\n5. التقييم العام ومستوى الإلحاح\n\nقدم الإجابة بصيغة JSON:\n{\n  "findings": "النتائج",\n  "interpretation": "التفسير",\n  "recommendations": "التوصيات",\n  "abnormalities": [{"type": "نوع الشذوذ", "location": "الموقع", "severity": "low|medium|high|critical", "confidence": 85, "description": "الوصف"}],\n  "overallAssessment": "التقييم العام",\n  "urgency": "routine|semi-urgent|urgent|emergency"\n}`
    : `Analyze this medical image/X-ray comprehensively as an expert radiologist. ${params.clinicalContext ? `Clinical context: ${params.clinicalContext}` : ''}\n\nProvide a detailed medical analysis including:\n1. Key visible findings\n2. Clinical interpretation and potential diagnosis\n3. Medical recommendations\n4. Detected abnormalities with location, severity, and confidence score (0-100)\n5. Overall assessment and urgency level\n\nProvide response in JSON format:\n{\n  "findings": "...",\n  "interpretation": "...",\n  "recommendations": "...",\n  "abnormalities": [{"type": "abnormality type", "location": "anatomical location", "severity": "low|medium|high|critical", "confidence": 85, "description": "detailed description"}],\n  "overallAssessment": "overall clinical assessment",\n  "urgency": "routine|semi-urgent|urgent|emergency"\n}`;

  // Use Gemini Pro for medical imaging (high accuracy required)
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
    task: 'medical_imaging', // Automatically uses PRO model
    temperature: 0.2, // Low temperature for accuracy
    thinkingBudget: 2048, // Higher thinking budget for complex analysis
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
