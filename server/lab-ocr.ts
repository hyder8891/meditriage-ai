/**
 * Lab Report OCR and Text Extraction Service
 * 
 * Extracts text from lab report images and PDFs
 */

import { invokeLLM } from "./_core/llm";

/**
 * Extract text from lab report file using Gemini Vision
 * Supports: PDF, JPG, PNG, WEBP
 */
export async function extractTextFromLabReport(fileUrl: string, mimeType: string): Promise<string> {
  try {
    // Use Gemini's vision capabilities to extract text from the image/PDF
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a medical OCR system. Extract ALL text from lab reports accurately, preserving the exact format, numbers, and medical terminology. Include test names, values, units, and reference ranges."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this lab report. Preserve the exact layout and all numerical values."
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
      ]
    });

    const extractedText = response.choices[0]?.message?.content || "";
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No text could be extracted from the file");
    }

    return extractedText;
  } catch (error: any) {
    console.error("OCR extraction error:", error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Parse extracted text to identify individual lab results
 * Returns structured data from unstructured OCR text
 */
export async function parseLabResults(ocrText: string, reportDate: Date): Promise<Array<{
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
}>> {
  try {
    // Use Gemini to parse the OCR text into structured lab results
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a medical lab report parser. Extract individual test results from lab report text and return them as structured JSON.

For each test result, extract:
- testName: Full name of the test (e.g., "Hemoglobin", "White Blood Cell Count")
- testCode: Lab code if available (e.g., "HGB", "WBC")
- testCategory: Category (e.g., "Complete Blood Count", "Metabolic Panel", "Lipid Panel")
- value: The result value as shown (e.g., "14.5", "Negative", "Normal")
- numericValue: Numeric value if applicable (null for non-numeric)
- unit: Unit of measurement (e.g., "g/dL", "mg/dL", "cells/μL")
- referenceRangeMin: Lower bound of reference range (numeric)
- referenceRangeMax: Upper bound of reference range (numeric)
- referenceRangeText: Reference range as shown in report (e.g., "13.5-17.5 g/dL")
- status: "normal", "high", "low", "critical_high", "critical_low", or "unknown"
- abnormalFlag: true if outside reference range
- criticalFlag: true if critically abnormal

Return ONLY a JSON array of test results, no other text.`
        },
        {
          role: "user",
          content: `Parse this lab report text and extract all test results:\n\n${ocrText}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lab_results",
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
                    criticalFlag: { type: "boolean" }
                  },
                  required: ["testName", "value", "status", "abnormalFlag", "criticalFlag"],
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

    const parsed = JSON.parse(content);
    return parsed.results || [];
  } catch (error: any) {
    console.error("Lab result parsing error:", error);
    throw new Error(`Failed to parse lab results: ${error.message}`);
  }
}

/**
 * Interpret a single lab result using AI
 */
export async function interpretLabResult(result: {
  testName: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceRangeMin?: number;
  referenceRangeMax?: number;
  status: string;
  abnormalFlag: boolean;
  criticalFlag: boolean;
}): Promise<{
  interpretation: string;
  clinicalSignificance: string;
  possibleCauses: string[];
  recommendedFollowUp: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a medical lab result interpreter. Provide patient-friendly explanations of lab results.

For each result, provide:
1. interpretation: Simple explanation of what this test measures and what the result means
2. clinicalSignificance: Medical significance of this result (especially if abnormal)
3. possibleCauses: Array of possible causes if result is abnormal (empty array if normal)
4. recommendedFollowUp: What follow-up actions are recommended

Be clear, accurate, and helpful. Use simple language for patients but maintain medical accuracy.`
        },
        {
          role: "user",
          content: `Interpret this lab result:
Test: ${result.testName}
Value: ${result.value} ${result.unit || ''}
Reference Range: ${result.referenceRangeMin} - ${result.referenceRangeMax} ${result.unit || ''}
Status: ${result.status}
Abnormal: ${result.abnormalFlag}
Critical: ${result.criticalFlag}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lab_interpretation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              interpretation: { type: "string" },
              clinicalSignificance: { type: "string" },
              possibleCauses: {
                type: "array",
                items: { type: "string" }
              },
              recommendedFollowUp: { type: "string" }
            },
            required: ["interpretation", "clinicalSignificance", "possibleCauses", "recommendedFollowUp"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI interpreter");
    }

    const interpretation = JSON.parse(content);
    return {
      ...interpretation,
      possibleCauses: interpretation.possibleCauses || []
    };
  } catch (error: any) {
    console.error("Lab result interpretation error:", error);
    // Return default interpretation on error
    return {
      interpretation: `${result.testName}: ${result.value} ${result.unit || ''}`,
      clinicalSignificance: result.abnormalFlag ? "This result is outside the normal range." : "This result is within the normal range.",
      possibleCauses: [],
      recommendedFollowUp: result.abnormalFlag ? "Discuss this result with your healthcare provider." : "No immediate action needed."
    };
  }
}

/**
 * Generate overall interpretation of all lab results
 */
export async function generateOverallInterpretation(results: Array<{
  testName: string;
  value: string;
  status: string;
  abnormalFlag: boolean;
  criticalFlag: boolean;
  interpretation?: string;
}>): Promise<{
  overallInterpretation: string;
  riskLevel: string;
  recommendedActions: string[];
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a medical AI providing overall assessment of lab results.

Analyze all lab results together and provide:
1. overallInterpretation: Comprehensive summary of the patient's lab results
2. riskLevel: Overall risk level: "low", "moderate", "high", or "critical"
3. recommendedActions: Array of specific recommended actions

Consider patterns, combinations of abnormal results, and clinical significance.`
        },
        {
          role: "user",
          content: `Provide an overall interpretation of these lab results:\n\n${JSON.stringify(results, null, 2)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "overall_interpretation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallInterpretation: { type: "string" },
              riskLevel: { type: "string", enum: ["low", "moderate", "high", "critical"] },
              recommendedActions: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["overallInterpretation", "riskLevel", "recommendedActions"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error("Overall interpretation error:", error);
    // Return default interpretation on error
    const criticalCount = results.filter(r => r.criticalFlag).length;
    const abnormalCount = results.filter(r => r.abnormalFlag).length;
    
    return {
      overallInterpretation: `Lab results show ${abnormalCount} abnormal value(s) out of ${results.length} total tests.`,
      riskLevel: criticalCount > 0 ? "critical" : abnormalCount > 3 ? "high" : abnormalCount > 0 ? "moderate" : "low",
      recommendedActions: criticalCount > 0 
        ? ["Seek immediate medical attention for critical values"]
        : abnormalCount > 0
        ? ["Discuss abnormal results with your healthcare provider"]
        : ["Continue routine health maintenance"]
    };
  }
}
