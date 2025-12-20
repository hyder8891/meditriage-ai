/**
 * Gemini Flash Audio Transcription Service
 * Uses Gemini Flash native audio processing for Iraqi Arabic transcription
 */

import { invokeGeminiFlashAudio } from '../_core/gemini-dual';

export type GeminiTranscribeOptions = {
  audioUrl: string; // URL to the audio file (e.g., S3 URL)
  language?: string; // Optional: specify language code (e.g., "en", "ar")
  prompt?: string; // Optional: custom prompt for the transcription
};

export type GeminiTranscriptionResponse = {
  text: string;
  language: string;
  duration?: number;
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "SERVICE_ERROR";
  details?: string;
};

/**
 * Transcribe audio to text using Gemini Flash native audio processing
 * 
 * @param options - Audio data and metadata
 * @returns Transcription result or error
 */
export async function transcribeAudioWithGemini(
  options: GeminiTranscribeOptions
): Promise<GeminiTranscriptionResponse | TranscriptionError> {
  try {
    console.log('[GeminiTranscription] Starting transcription for:', options.audioUrl);
    console.log('[GeminiTranscription] Language:', options.language || 'auto-detect');

    // Step 1: Download audio from URL
    let audioBuffer: Buffer;
    let mimeType: string;
    
    try {
      const response = await fetch(options.audioUrl);
      console.log('[GeminiTranscription] Fetch response status:', response.status);
      
      if (!response.ok) {
        return {
          error: "Failed to download audio file",
          code: "INVALID_FORMAT",
          details: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      audioBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'audio/webm';
      
      console.log('[GeminiTranscription] Audio buffer size:', audioBuffer.length, 'bytes');
      console.log('[GeminiTranscription] MIME type:', mimeType);
      
      // Check file size (16MB limit for Gemini)
      const sizeMB = audioBuffer.length / (1024 * 1024);
      console.log('[GeminiTranscription] Audio size:', sizeMB.toFixed(2), 'MB');
      
      if (sizeMB > 16) {
        return {
          error: "Audio file exceeds maximum size limit",
          code: "FILE_TOO_LARGE",
          details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 16MB`
        };
      }

      if (audioBuffer.length === 0) {
        return {
          error: "Audio file is empty",
          code: "INVALID_FORMAT",
          details: "The audio file contains no data"
        };
      }
    } catch (error) {
      console.error('[GeminiTranscription] Failed to fetch audio:', error);
      return {
        error: "Failed to fetch audio file",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Step 2: Prepare transcription prompt
    const languageName = options.language ? getLanguageName(options.language) : 'Arabic or English';
    const transcriptionPrompt = options.prompt || 
      `You are a medical transcription AI. Listen carefully to this audio recording and transcribe EXACTLY what you hear.
      
      Language: ${languageName}
      
      CRITICAL RULES:
      1. Transcribe ONLY the actual spoken words - nothing more, nothing less
      2. If the audio is unclear or silent, respond with: "[Audio unclear or silent]"
      3. Do NOT repeat words unless they were actually repeated in the audio
      4. Do NOT add greetings, pleasantries, or filler words that weren't spoken
      5. Do NOT hallucinate or make up content
      6. Preserve the exact language spoken (Arabic or English)
      7. Include medical terms exactly as spoken
      
      Return ONLY the transcribed text with no additional commentary.
      
      Transcription:`;

    console.log('[GeminiTranscription] Using prompt:', transcriptionPrompt);

    // Step 3: Call Gemini Flash with native audio processing
    const transcriptionText = await invokeGeminiFlashAudio(
      audioBuffer,
      mimeType,
      transcriptionPrompt,
      {
        temperature: 0.1, // Low temperature for accurate transcription
        systemInstruction: `You are a professional medical transcription assistant with these strict rules:
        
        PRIMARY RULE: Transcribe ONLY what you actually hear in the audio. Do not make up, repeat, or hallucinate content.
        
        - If you hear clear speech: transcribe it exactly word-for-word
        - If audio is unclear/muffled: transcribe what you can hear and mark unclear parts with [unclear]
        - If audio is silent or contains no speech: respond with "[No speech detected]"
        - Do NOT add greetings, filler words, or repetitive content that wasn't spoken
        - Do NOT provide medical analysis, advice, or interpretation
        - Preserve the original language (Arabic or English)
        - Medical terms should be transcribed exactly as spoken
        
        Your output should be ONLY the transcribed text, nothing else.`,
      }
    );

    console.log('[GeminiTranscription] Transcription result length:', transcriptionText.length);
    console.log('[GeminiTranscription] Transcription text:', transcriptionText);

    // Step 4: Validate transcription result
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      return {
        error: "Transcription returned empty result",
        code: "TRANSCRIPTION_FAILED",
        details: "Gemini Flash returned an empty transcription"
      };
    }

    // Step 5: Detect language from transcription
    const detectedLanguage = detectLanguage(transcriptionText);
    console.log('[GeminiTranscription] Detected language:', detectedLanguage);

    return {
      text: transcriptionText.trim(),
      language: options.language || detectedLanguage,
      duration: undefined, // Gemini doesn't provide duration
    };

  } catch (error) {
    console.error('[GeminiTranscription] Transcription failed:', error);
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

/**
 * Helper function to get full language name from ISO code
 */
function getLanguageName(langCode: string): string {
  const langMap: Record<string, string> = {
    'en': 'English',
    'ar': 'Arabic (Iraqi dialect)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
  };
  
  return langMap[langCode] || langCode;
}

/**
 * Simple language detection based on character set
 */
function detectLanguage(text: string): string {
  // Check for Arabic characters
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(text)) {
    return 'ar';
  }
  
  // Default to English
  return 'en';
}
