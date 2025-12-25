import { invokeLLM } from "./_core/llm";

export interface PatientInfo {
  complaints: string;
  chiefComplaint: string;
  age: number;
  gender: "male" | "female" | "other";
  vitalSigns: {
    heartRate?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

export interface DifferentialDiagnosis {
  diagnosisName: string;
  diagnosisNameAr: string;
  likelihoodScore: number;
  clinicalReasoning: string;
  clinicalReasoningAr: string;
  matchingSymptoms: string[];
  riskFactors: string[];
}

export interface DiagnosticTest {
  testName: string;
  testNameAr: string;
  reasoning: string;
  reasoningAr: string;
  priority: "immediate" | "urgent" | "routine";
}

export interface RedFlag {
  flag: string;
  flagAr: string;
  severity: "critical" | "high" | "moderate";
  action: string;
  actionAr: string;
}

export interface UrgencyAssessment {
  level: "emergency" | "urgent" | "semi-urgent" | "non-urgent" | "routine";
  reasoning: string;
  reasoningAr: string;
  recommendedAction: string;
  recommendedActionAr: string;
  timeframe: string;
  timeframeAr: string;
}

export interface ClinicalReasoningResult {
  differentialDiagnoses: DifferentialDiagnosis[];
  recommendedTests: DiagnosticTest[];
  redFlags: RedFlag[];
  urgencyAssessment: UrgencyAssessment;
}

/**
 * Generate comprehensive clinical reasoning analysis
 */
export async function analyzeClinicalPresentation(
  patientInfo: PatientInfo,
  language: "en" | "ar" = "en"
): Promise<ClinicalReasoningResult> {
  const systemPrompt = `You are an expert medical AI assistant specialized in clinical reasoning and differential diagnosis. Your task is to analyze patient presentations and provide comprehensive diagnostic assessments.

You MUST respond with valid JSON matching this exact schema:
{
  "differentialDiagnoses": [
    {
      "diagnosisName": "string (English medical term)",
      "diagnosisNameAr": "string (Arabic translation)",
      "likelihoodScore": number (0-100),
      "clinicalReasoning": "string (detailed English explanation)",
      "clinicalReasoningAr": "string (detailed Arabic explanation)",
      "matchingSymptoms": ["symptom1", "symptom2"],
      "riskFactors": ["factor1", "factor2"]
    }
  ],
  "recommendedTests": [
    {
      "testName": "string (English)",
      "testNameAr": "string (Arabic)",
      "reasoning": "string (English)",
      "reasoningAr": "string (Arabic)",
      "priority": "immediate" | "urgent" | "routine"
    }
  ],
  "redFlags": [
    {
      "flag": "string (English)",
      "flagAr": "string (Arabic)",
      "severity": "critical" | "high" | "moderate",
      "action": "string (English)",
      "actionAr": "string (Arabic)"
    }
  ],
  "urgencyAssessment": {
    "level": "emergency" | "urgent" | "semi-urgent" | "non-urgent" | "routine",
    "reasoning": "string (English)",
    "reasoningAr": "string (Arabic)",
    "recommendedAction": "string (English)",
    "recommendedActionAr": "string (Arabic)",
    "timeframe": "string (English, e.g., 'Within 1 hour')",
    "timeframeAr": "string (Arabic, e.g., 'خلال ساعة واحدة')"
  }
}

Guidelines:
1. Provide 3-5 differential diagnoses ranked by likelihood
2. Include detailed clinical reasoning for each diagnosis
3. Recommend SPECIFIC diagnostic tests based on the exact symptoms (e.g., for sore throat: RADT, throat culture; for chest pain: ECG, troponin, chest X-ray)
4. Identify SPECIFIC red flags based on the actual presentation (not generic warnings)
5. Assess urgency level based on presentation severity with specific timeframes
6. All content must be provided in BOTH English and Arabic
7. Use proper medical terminology
8. Consider patient age, gender, and vital signs in your assessment
9. Be thorough but concise in explanations
10. For diagnostic tests: explain WHY each test is needed for THIS specific case
11. For red flags: only include flags that are RELEVANT to the current symptoms (not generic lists)`;

  const userPrompt = `Analyze this clinical presentation:

**Chief Complaint:** ${patientInfo.chiefComplaint}

**Detailed Complaints:** ${patientInfo.complaints}

**Patient Demographics:**
- Age: ${patientInfo.age} years
- Gender: ${patientInfo.gender}

**Vital Signs:**
${patientInfo.vitalSigns.heartRate ? `- Heart Rate: ${patientInfo.vitalSigns.heartRate} bpm` : ""}
${patientInfo.vitalSigns.bloodPressure ? `- Blood Pressure: ${patientInfo.vitalSigns.bloodPressure.systolic}/${patientInfo.vitalSigns.bloodPressure.diastolic} mmHg` : ""}
${patientInfo.vitalSigns.temperature ? `- Temperature: ${patientInfo.vitalSigns.temperature}°C` : ""}
${patientInfo.vitalSigns.oxygenSaturation ? `- Oxygen Saturation: ${patientInfo.vitalSigns.oxygenSaturation}%` : ""}
${patientInfo.vitalSigns.respiratoryRate ? `- Respiratory Rate: ${patientInfo.vitalSigns.respiratoryRate} breaths/min` : ""}

${patientInfo.medicalHistory && patientInfo.medicalHistory.length > 0 ? `**Medical History:** ${patientInfo.medicalHistory.join(", ")}` : ""}
${patientInfo.currentMedications && patientInfo.currentMedications.length > 0 ? `**Current Medications:** ${patientInfo.currentMedications.join(", ")}` : ""}
${patientInfo.allergies && patientInfo.allergies.length > 0 ? `**Allergies:** ${patientInfo.allergies.join(", ")}` : ""}

Provide comprehensive clinical reasoning analysis with differential diagnoses, recommended tests, red flags, and urgency assessment.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "clinical_reasoning_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            differentialDiagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosisName: { type: "string" },
                  diagnosisNameAr: { type: "string" },
                  likelihoodScore: { type: "integer" },
                  clinicalReasoning: { type: "string" },
                  clinicalReasoningAr: { type: "string" },
                  matchingSymptoms: { type: "array", items: { type: "string" } },
                  riskFactors: { type: "array", items: { type: "string" } },
                },
                required: [
                  "diagnosisName",
                  "diagnosisNameAr",
                  "likelihoodScore",
                  "clinicalReasoning",
                  "clinicalReasoningAr",
                  "matchingSymptoms",
                  "riskFactors",
                ],
                additionalProperties: false,
              },
            },
            recommendedTests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  testName: { type: "string" },
                  testNameAr: { type: "string" },
                  reasoning: { type: "string" },
                  reasoningAr: { type: "string" },
                  priority: { type: "string", enum: ["immediate", "urgent", "routine"] },
                },
                required: ["testName", "testNameAr", "reasoning", "reasoningAr", "priority"],
                additionalProperties: false,
              },
            },
            redFlags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag: { type: "string" },
                  flagAr: { type: "string" },
                  severity: { type: "string", enum: ["critical", "high", "moderate"] },
                  action: { type: "string" },
                  actionAr: { type: "string" },
                },
                required: ["flag", "flagAr", "severity", "action", "actionAr"],
                additionalProperties: false,
              },
            },
            urgencyAssessment: {
              type: "object",
              properties: {
                level: {
                  type: "string",
                  enum: ["emergency", "urgent", "semi-urgent", "non-urgent", "routine"],
                },
                reasoning: { type: "string" },
                reasoningAr: { type: "string" },
                recommendedAction: { type: "string" },
                recommendedActionAr: { type: "string" },
                timeframe: { type: "string" },
                timeframeAr: { type: "string" },
              },
              required: [
                "level",
                "reasoning",
                "reasoningAr",
                "recommendedAction",
                "recommendedActionAr",
                "timeframe",
                "timeframeAr",
              ],
              additionalProperties: false,
            },
          },
          required: ["differentialDiagnoses", "recommendedTests", "redFlags", "urgencyAssessment"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  const contentStr = typeof content === "string" ? content : JSON.stringify(content);
  const result: ClinicalReasoningResult = JSON.parse(contentStr);
  return result;
}
