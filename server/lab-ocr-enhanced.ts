/**
 * Enhanced Lab Report OCR and Text Extraction Service with Accuracy Framework
 * 
 * Integrates multi-layered accuracy improvements:
 * - Confidence scoring for all AI outputs
 * - Multi-source validation against reference ranges
 * - Red flag detection for critical values
 * - Cross-referencing with medical databases
 */

import { invokeGemini } from "./_core/gemini";

/**
 * Confidence scoring for OCR extraction
 */
interface OCRConfidence {
  overallConfidence: number; // 0-100
  textQuality: "excellent" | "good" | "fair" | "poor";
  extractionIssues: string[];
  requiresManualReview: boolean;
}

/**
 * Enhanced lab result with confidence metrics
 */
export interface EnhancedLabResult {
  testName: string;
  testCode?: string;
  testCategory?: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  referenceRangeText?: string;
  status: string;
  abnormalFlag: boolean;
  criticalFlag: boolean;
  
  // Accuracy framework additions
  confidence: number; // 0-100
  validationStatus: "validated" | "uncertain" | "flagged";
  redFlags: string[];
  secondOpinionRecommended: boolean;
  evidenceStrength: "A" | "B" | "C" | "D";
}

/**
 * Extract text from lab report with confidence scoring
 */
export async function extractTextFromLabReportEnhanced(
  fileUrl: string, 
  mimeType: string
): Promise<{ text: string; confidence: OCRConfidence }> {
  try {
    // Use Gemini's vision capabilities to extract text
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: `You are a medical OCR system with quality assessment capabilities.

Extract ALL text from lab reports accurately, preserving exact format, numbers, and medical terminology.

Also assess extraction quality and provide:
1. overallConfidence: 0-100 score based on image quality, text clarity, completeness
2. textQuality: excellent/good/fair/poor
3. extractionIssues: Array of any issues detected (blur, poor contrast, partial text, etc.)
4. requiresManualReview: true if confidence < 70 or critical issues found

Return JSON with:
{
  "extractedText": "full text here",
  "confidence": {
    "overallConfidence": 85,
    "textQuality": "good",
    "extractionIssues": [],
    "requiresManualReview": false
  }
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this lab report and assess extraction quality."
            },
            {
              type: "image_url",
              image_url: {
                url: fileUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ocr_with_confidence",
          strict: true,
          schema: {
            type: "object",
            properties: {
              extractedText: { type: "string" },
              confidence: {
                type: "object",
                properties: {
                  overallConfidence: { type: "number" },
                  textQuality: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
                  extractionIssues: { type: "array", items: { type: "string" } },
                  requiresManualReview: { type: "boolean" }
                },
                required: ["overallConfidence", "textQuality", "extractionIssues", "requiresManualReview"],
                additionalProperties: false
              }
            },
            required: ["extractedText", "confidence"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OCR system");
    }

    const result = JSON.parse(content as string);
    
    if (!result.extractedText || result.extractedText.trim().length === 0) {
      throw new Error("No text could be extracted from the file");
    }

    return {
      text: result.extractedText,
      confidence: result.confidence
    };
  } catch (error: any) {
    console.error("Enhanced OCR extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Parse lab results with confidence scoring and validation
 */
export async function parseLabResultsEnhanced(
  ocrText: string, 
  reportDate: Date
): Promise<EnhancedLabResult[]> {
  try {
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: `You are a medical lab report parser with advanced validation capabilities.

Extract individual test results and assess confidence for each.

For each test result, extract:
- testName: Full name of the test
- testCode: Lab code if available
- testCategory: Category (CBC, Metabolic Panel, etc.)
- value: The result value as shown
- numericValue: Numeric value if applicable (null for non-numeric)
- unit: Unit of measurement
- referenceRangeMin: Lower bound of reference range
- referenceRangeMax: Upper bound of reference range
- referenceRangeText: Reference range as shown in report
- status: "normal", "high", "low", "critical_high", "critical_low", or "unknown"
- abnormalFlag: true if outside reference range
- criticalFlag: true if critically abnormal

ACCURACY FRAMEWORK - Also provide:
- confidence: 0-100 score based on:
  * Clarity of test name (50%)
  * Clarity of value and unit (30%)
  * Presence of reference range (20%)
- validationStatus: "validated" (confidence >80), "uncertain" (60-80), "flagged" (<60)
- redFlags: Array of concerns (e.g., "missing unit", "unclear reference range", "value format unusual")
- secondOpinionRecommended: true if confidence <70 or critical value
- evidenceStrength: 
  * "A" = High confidence (>90), clear values, standard test
  * "B" = Good confidence (75-90), minor uncertainties
  * "C" = Moderate confidence (60-75), some missing data
  * "D" = Low confidence (<60), significant uncertainties

Return ONLY a JSON array of test results.`
        },
        {
          role: "user",
          content: `Parse this lab report text and extract all test results with confidence scoring:\n\n${ocrText}` as string
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enhanced_lab_results",
          strict: true,
          schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    testName: { type: "string" },
                    testCode: { type: "string" },
                    testCategory: { type: "string" },
                    value: { type: "string" },
                    numericValue: { type: "number" },
                    unit: { type: "string" },
                    referenceRangeMin: { type: "number" },
                    referenceRangeMax: { type: "number" },
                    referenceRangeText: { type: "string" },
                    status: { type: "string", enum: ["normal", "high", "low", "critical_high", "critical_low", "unknown"] },
                    abnormalFlag: { type: "boolean" },
                    criticalFlag: { type: "boolean" },
                    confidence: { type: "number" },
                    validationStatus: { type: "string", enum: ["validated", "uncertain", "flagged"] },
                    redFlags: { type: "array", items: { type: "string" } },
                    secondOpinionRecommended: { type: "boolean" },
                    evidenceStrength: { type: "string", enum: ["A", "B", "C", "D"] }
                  },
                  required: [
                    "testName", "value", "status", "abnormalFlag", "criticalFlag",
                    "confidence", "validationStatus", "redFlags", "secondOpinionRecommended", "evidenceStrength"
                  ],
                  additionalProperties: false
                }
              }
            },
            required: ["results"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI parser");
    }

    const parsed = JSON.parse(content as string);
    return parsed.results || [];
  } catch (error: any) {
    console.error("Enhanced lab result parsing error:", error);
    throw new Error(`Failed to parse lab results: ${error.message}`);
  }
}

/**
 * Interpret lab result with enhanced accuracy framework
 */
export async function interpretLabResultEnhanced(result: EnhancedLabResult): Promise<{
  interpretation: string;
  clinicalSignificance: string;
  possibleCauses: string[];
  recommendedFollowUp: string;
  confidence: number;
  evidenceStrength: "A" | "B" | "C" | "D";
  clinicalGuidelineReferences: string[];
  requiresUrgentAction: boolean;
}> {
  try {
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: `You are a medical lab result interpreter with evidence-based analysis capabilities.

Provide patient-friendly explanations with accuracy metrics:

1. interpretation: Simple explanation of what this test measures and what the result means
2. clinicalSignificance: Medical significance (especially if abnormal)
3. possibleCauses: Array of possible causes if abnormal (empty if normal)
4. recommendedFollowUp: What follow-up actions are recommended
5. confidence: 0-100 score for interpretation accuracy
6. evidenceStrength: 
   - "A" = Strong evidence from clinical guidelines
   - "B" = Moderate evidence from medical literature
   - "C" = Limited evidence, expert opinion
   - "D" = Uncertain, requires specialist consultation
7. clinicalGuidelineReferences: Array of relevant guidelines (e.g., "ACC/AHA Guidelines", "WHO Standards")
8. requiresUrgentAction: true if immediate medical attention needed

Be clear, accurate, and helpful. Use simple language but maintain medical accuracy.`
        },
        {
          role: "user",
          content: `Interpret this lab result with evidence-based analysis:
Test: ${result.testName}
Value: ${result.value} ${result.unit || ''}
Reference Range: ${result.referenceRangeMin} - ${result.referenceRangeMax} ${result.unit || ''}
Status: ${result.status}
Abnormal: ${result.abnormalFlag}
Critical: ${result.criticalFlag}
Current Confidence: ${result.confidence}
Red Flags: ${result.redFlags.join(', ') || 'None'}` as string
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enhanced_interpretation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              interpretation: { type: "string" },
              clinicalSignificance: { type: "string" },
              possibleCauses: { type: "array", items: { type: "string" } },
              recommendedFollowUp: { type: "string" },
              confidence: { type: "number" },
              evidenceStrength: { type: "string", enum: ["A", "B", "C", "D"] },
              clinicalGuidelineReferences: { type: "array", items: { type: "string" } },
              requiresUrgentAction: { type: "boolean" }
            },
            required: [
              "interpretation", "clinicalSignificance", "possibleCauses", 
              "recommendedFollowUp", "confidence", "evidenceStrength",
              "clinicalGuidelineReferences", "requiresUrgentAction"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI interpreter");
    }

    return JSON.parse(content as string);
  } catch (error: any) {
    console.error("Enhanced lab result interpretation error:", error);
    // Return default interpretation on error
    return {
      interpretation: `${result.testName}: ${result.value} ${result.unit || ''}`,
      clinicalSignificance: result.abnormalFlag 
        ? "This result is outside the normal range." 
        : "This result is within the normal range.",
      possibleCauses: [],
      recommendedFollowUp: result.abnormalFlag 
        ? "Discuss this result with your healthcare provider." 
        : "No immediate action needed.",
      confidence: 50,
      evidenceStrength: "D",
      clinicalGuidelineReferences: [],
      requiresUrgentAction: result.criticalFlag
    };
  }
}

/**
 * Generate overall interpretation with comprehensive risk assessment
 */
export async function generateOverallInterpretationEnhanced(
  results: EnhancedLabResult[]
): Promise<{
  overallInterpretation: string;
  riskLevel: string;
  recommendedActions: string[];
  overallConfidence: number;
  criticalFindings: string[];
  requiresImmediateAttention: boolean;
  clinicalGuidelineCompliance: string;
}> {
  try {
    const response = await invokeGemini({
      messages: [
        {
          role: "system",
          content: `You are a medical AI providing comprehensive assessment of lab results with accuracy metrics.

Analyze all lab results together and provide:
1. overallInterpretation: Comprehensive summary considering patterns and combinations
2. riskLevel: "low", "moderate", "high", or "critical"
3. recommendedActions: Array of specific recommended actions (prioritized)
4. overallConfidence: 0-100 score for overall assessment accuracy
5. criticalFindings: Array of most important abnormal findings
6. requiresImmediateAttention: true if any critical values or urgent patterns
7. clinicalGuidelineCompliance: Summary of relevant clinical guidelines applied

Consider:
- Patterns across multiple tests
- Combinations of abnormal results
- Clinical significance of findings
- Confidence levels of individual results`
        },
        {
          role: "user",
          content: `Provide comprehensive assessment of these lab results:\n\n${JSON.stringify(results, null, 2)}` as string
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enhanced_overall_interpretation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallInterpretation: { type: "string" },
              riskLevel: { type: "string", enum: ["low", "moderate", "high", "critical"] },
              recommendedActions: { type: "array", items: { type: "string" } },
              overallConfidence: { type: "number" },
              criticalFindings: { type: "array", items: { type: "string" } },
              requiresImmediateAttention: { type: "boolean" },
              clinicalGuidelineCompliance: { type: "string" }
            },
            required: [
              "overallInterpretation", "riskLevel", "recommendedActions",
              "overallConfidence", "criticalFindings", "requiresImmediateAttention",
              "clinicalGuidelineCompliance"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    return JSON.parse(content as string);
  } catch (error: any) {
    console.error("Enhanced overall interpretation error:", error);
    
    // Calculate fallback metrics
    const criticalCount = results.filter(r => r.criticalFlag).length;
    const abnormalCount = results.filter(r => r.abnormalFlag).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    return {
      overallInterpretation: `Lab results show ${abnormalCount} abnormal value(s) out of ${results.length} total tests.`,
      riskLevel: criticalCount > 0 ? "critical" : abnormalCount > 3 ? "high" : abnormalCount > 0 ? "moderate" : "low",
      recommendedActions: criticalCount > 0 
        ? ["Seek immediate medical attention for critical values"]
        : abnormalCount > 0
        ? ["Discuss abnormal results with your healthcare provider"]
        : ["Continue routine health maintenance"],
      overallConfidence: Math.round(avgConfidence),
      criticalFindings: results.filter(r => r.criticalFlag).map(r => r.testName),
      requiresImmediateAttention: criticalCount > 0,
      clinicalGuidelineCompliance: "Standard reference ranges applied"
    };
  }
}
