/**
 * LLM Module - Re-exports from unified Gemini integration
 * 
 * This module maintains backward compatibility while all AI functions
 * now use Gemini exclusively.
 * 
 * For new code, prefer importing directly from './gemini':
 * - invokeGemini() for automatic model selection based on task
 * - invokeGeminiPro() for complex medical tasks
 * - invokeGeminiFlash() for fast responses
 */

// Re-export everything from the unified Gemini module
export {
  // Types
  type Role,
  type TextContent,
  type ImageContent,
  type FileContent,
  type MessageContent,
  type Message,
  type Tool,
  type ToolChoicePrimitive,
  type ToolChoiceByName,
  type ToolChoiceExplicit,
  type ToolChoice,
  type JsonSchema,
  type ResponseFormat,
  type ToolCall,
  type GeminiResult as InvokeResult,
  type GeminiParams as InvokeParams,
  type GeminiModel,
  type TaskComplexity,
  
  // Functions
  invokeGemini,
  invokeGeminiPro,
  invokeGeminiFlash,
  invokeLLM,
  getModelForTask,
  
  // Medical imaging
  analyzeXRayBackend,
  type MedicalImageAnalysisParams,
  type MedicalImageAnalysisResult,
} from './gemini';

// Default export for backward compatibility
export { invokeLLM as default } from './gemini';
