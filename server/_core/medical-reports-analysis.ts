/**
 * Medical Reports Analysis Module
 * AI-powered analysis for various medical reports and diagnostic tests
 * Similar to medical-imaging.ts but for non-imaging reports
 */

import { invokeGemini } from "./gemini";
import { performMedGeminiReportAnalysis, generateCoTSystemPrompt } from "./med-gemini";

export type ReportType =
  | "pathology"
  | "blood_test"
  | "discharge_summary"
  | "consultation_note"
  | "ecg"
  | "pulmonary_function"
  | "endoscopy"
  | "colonoscopy"
  | "cardiac_stress"
  | "sleep_study"
  | "genetic_test"
  | "microbiology"
  | "allergy_test"
  | "urinalysis"
  | "other";

export interface ReportAnalysisResult {
  reportType: ReportType;
  extractedText: string;
  findings: {
    category: string;
    finding: string;
    severity: "normal" | "abnormal" | "critical";
    location?: string;
  }[];
  diagnosis: {
    primary: string;
    differential: string[];
    confidence: number;
  };
  recommendations: {
    immediate: string[];
    followUp: string[];
    lifestyle: string[];
  };
  criticalFlags: string[];
  technicalQuality: {
    completeness: "complete" | "partial" | "incomplete";
    readability: "excellent" | "good" | "fair" | "poor";
    notes: string;
  };
  urgency: "routine" | "semi-urgent" | "urgent" | "emergency";
  summary: string;
}

/**
 * Get specialized AI prompt for each report type
 */
function getReportTypePrompt(reportType: ReportType): string {
  const prompts: Record<ReportType, string> = {
    pathology: `You are an expert pathologist analyzing a pathology report (biopsy, cytology, histopathology).

**Analysis Focus:**
- Specimen type and site
- Microscopic findings and cellular characteristics
- Presence of malignancy, dysplasia, or inflammation
- Tumor grade and stage (if applicable)
- Margins status (positive/negative)
- Immunohistochemistry results
- Molecular markers
- Comparison with previous biopsies

**Critical Findings to Flag:**
- Malignancy detected
- High-grade dysplasia
- Positive margins requiring re-excision
- Unexpected findings requiring urgent follow-up`,

    blood_test: `You are an expert clinical pathologist analyzing blood test results.

**Analysis Focus:**
- Complete Blood Count (CBC): WBC, RBC, hemoglobin, hematocrit, platelets
- Metabolic Panel: glucose, electrolytes, kidney function (BUN, creatinine)
- Liver Function Tests: ALT, AST, bilirubin, alkaline phosphatase
- Lipid Panel: cholesterol, triglycerides, HDL, LDL
- Thyroid Function: TSH, T3, T4
- Inflammatory markers: CRP, ESR
- Comparison with reference ranges (age/gender-specific)

**Critical Findings to Flag:**
- Severe anemia (Hgb <7 g/dL)
- Thrombocytopenia (<50,000)
- Severe electrolyte imbalances
- Acute kidney injury
- Severe liver dysfunction
- Critically high/low glucose`,

    discharge_summary: `You are an expert physician analyzing a hospital discharge summary.

**Analysis Focus:**
- Admission diagnosis and chief complaint
- Hospital course and procedures performed
- Final diagnosis at discharge
- Medications prescribed (new/changed/discontinued)
- Follow-up appointments and instructions
- Pending test results
- Complications during hospitalization
- Functional status at discharge

**Critical Findings to Flag:**
- Unresolved critical conditions
- Required urgent follow-up
- High-risk medications requiring monitoring
- Pending critical test results`,

    consultation_note: `You are an expert physician analyzing a specialist consultation note.

**Analysis Focus:**
- Reason for consultation
- Specialist's assessment and findings
- Diagnostic impressions
- Recommended diagnostic workup
- Treatment recommendations
- Prognosis and expected outcomes
- Follow-up plan

**Critical Findings to Flag:**
- Urgent diagnostic tests recommended
- High-risk conditions identified
- Immediate treatment changes needed`,

    ecg: `You are an expert cardiologist analyzing an ECG/EKG report.

**Analysis Focus:**
- Heart rate and rhythm (sinus, atrial fibrillation, etc.)
- PR interval, QRS duration, QT interval
- Axis deviation
- ST segment changes (elevation/depression)
- T wave abnormalities
- Q waves (pathological)
- Chamber enlargement
- Conduction blocks (AV block, bundle branch block)
- Comparison with previous ECGs

**Critical Findings to Flag:**
- ST elevation (STEMI)
- Complete heart block
- Ventricular tachycardia
- Prolonged QT interval (>500ms)
- New Q waves suggesting MI`,

    pulmonary_function: `You are an expert pulmonologist analyzing Pulmonary Function Test (PFT) results.

**Analysis Focus:**
- FEV1 (Forced Expiratory Volume in 1 second)
- FVC (Forced Vital Capacity)
- FEV1/FVC ratio
- TLC (Total Lung Capacity)
- DLCO (Diffusing Capacity)
- Pattern: obstructive, restrictive, or mixed
- Severity: mild, moderate, severe
- Bronchodilator response
- Comparison with predicted values

**Critical Findings to Flag:**
- Severe obstruction (FEV1 <30%)
- Severe restriction (TLC <50%)
- Severely reduced DLCO (<40%)
- Poor bronchodilator response in asthma`,

    endoscopy: `You are an expert gastroenterologist analyzing an endoscopy report (upper GI).

**Analysis Focus:**
- Indication for procedure
- Anatomical findings (esophagus, stomach, duodenum)
- Mucosal abnormalities (inflammation, ulcers, masses)
- Presence of H. pylori
- Biopsies taken and sites
- Interventions performed (biopsy, polypectomy)
- Complications during procedure

**Critical Findings to Flag:**
- Malignancy suspected
- Active bleeding
- Perforation
- Large ulcers requiring urgent treatment
- High-grade dysplasia`,

    colonoscopy: `You are an expert gastroenterologist analyzing a colonoscopy report.

**Analysis Focus:**
- Indication for procedure
- Quality of bowel preparation
- Extent of examination (cecum reached?)
- Polyps found (number, size, location, morphology)
- Histology of polyps (adenomatous, hyperplastic)
- Presence of diverticulosis, hemorrhoids, inflammation
- Biopsies taken
- Interventions performed (polypectomy)

**Critical Findings to Flag:**
- Malignancy suspected
- Large polyps (>1cm)
- High-grade dysplasia
- Active bleeding
- Incomplete examination`,

    cardiac_stress: `You are an expert cardiologist analyzing a cardiac stress test report.

**Analysis Focus:**
- Test type (exercise, pharmacological)
- Baseline and peak heart rate/blood pressure
- Exercise duration and metabolic equivalents (METs)
- ECG changes during stress (ST depression/elevation)
- Symptoms during test (chest pain, dyspnea)
- Arrhythmias during test
- Imaging findings (if nuclear or echo stress)
- Functional capacity

**Critical Findings to Flag:**
- ST elevation during stress
- Significant ST depression (>2mm)
- Sustained ventricular arrhythmias
- Severe symptoms at low workload
- Hypotensive response to exercise`,

    sleep_study: `You are an expert sleep medicine physician analyzing a polysomnography (sleep study) report.

**Analysis Focus:**
- Apnea-Hypopnea Index (AHI)
- Oxygen desaturation index
- Sleep stages and architecture
- Periodic limb movements
- Snoring intensity
- Body position effects
- REM vs non-REM events
- Severity: mild, moderate, severe OSA

**Critical Findings to Flag:**
- Severe OSA (AHI >30)
- Severe oxygen desaturations (<80%)
- Central sleep apnea
- Cheyne-Stokes respiration`,

    genetic_test: `You are an expert medical geneticist analyzing a genetic test report.

**Analysis Focus:**
- Gene(s) tested and methodology
- Variants detected (pathogenic, likely pathogenic, VUS)
- Clinical significance of variants
- Inheritance pattern
- Disease associations
- Carrier status
- Pharmacogenomic implications
- Recommendations for family testing

**Critical Findings to Flag:**
- Pathogenic variants for treatable conditions
- Cancer predisposition syndromes
- Carrier status for recessive disorders
- Variants requiring immediate intervention`,

    microbiology: `You are an expert microbiologist analyzing a microbiology/culture report.

**Analysis Focus:**
- Specimen type and source
- Organisms identified (bacteria, fungi, virus)
- Colony count (significant vs contamination)
- Antibiotic susceptibility testing
- Resistant organisms (MRSA, VRE, ESBL)
- Gram stain results
- Special stains (AFB, fungal)

**Critical Findings to Flag:**
- Multi-drug resistant organisms
- Bloodstream infections (bacteremia)
- Fungal infections in immunocompromised
- Tuberculosis detected
- Resistant organisms requiring isolation`,

    allergy_test: `You are an expert allergist analyzing an allergy test report.

**Analysis Focus:**
- Test type (skin prick, specific IgE, patch test)
- Allergens tested
- Positive reactions and severity
- Cross-reactivity patterns
- Food vs environmental allergens
- Correlation with clinical symptoms

**Critical Findings to Flag:**
- Severe food allergies (peanut, shellfish)
- Anaphylaxis risk
- Multiple severe sensitivities
- Occupational allergens`,

    urinalysis: `You are an expert nephrologist analyzing a urinalysis report.

**Analysis Focus:**
- Physical properties (color, clarity, specific gravity)
- Chemical analysis (pH, protein, glucose, ketones, blood)
- Microscopic examination (RBCs, WBCs, casts, crystals, bacteria)
- Protein-to-creatinine ratio
- Microalbumin levels

**Critical Findings to Flag:**
- Significant proteinuria (>300mg/day)
- Hematuria with RBC casts (glomerulonephritis)
- Pyuria with bacteria (UTI)
- Glucose in urine (diabetes)
- Ketones (DKA risk)`,

    other: `You are an expert physician analyzing a medical report.

**Analysis Focus:**
- Document type and purpose
- Key clinical findings
- Diagnostic impressions
- Recommended actions
- Follow-up requirements

**Critical Findings to Flag:**
- Any urgent or life-threatening findings
- Required immediate interventions
- Critical abnormalities`,
  };

  return prompts[reportType];
}

/**
 * Analyze a medical report using Med-Gemini AI with Chain-of-Thought reasoning
 * 
 * Med-Gemini capabilities for report analysis:
 * - Chain-of-Thought (CoT) systematic analysis methodology
 * - Evidence-based interpretation with confidence scoring
 * - Critical flag detection with urgency assessment
 * - Uncertainty-guided external search when confidence is low
 */
export async function analyzeMedicalReport(
  reportType: ReportType,
  extractedText: string,
  patientContext?: {
    age?: number;
    gender?: string;
    medicalHistory?: string;
  },
  language: 'en' | 'ar' = 'en'
): Promise<ReportAnalysisResult> {
  // Generate Med-Gemini Chain-of-Thought system prompt
  const medGeminiCoTPrompt = generateCoTSystemPrompt(language);
  const reportTypePrompt = getReportTypePrompt(reportType);

  const contextInfo = patientContext
    ? `\n\n**Patient Context:**\n- Age: ${patientContext.age || "Unknown"}\n- Gender: ${patientContext.gender || "Unknown"}\n- Medical History: ${patientContext.medicalHistory || "Not provided"}`
    : "";

  // Combine Med-Gemini CoT methodology with report-specific instructions
  const userPrompt = `${medGeminiCoTPrompt}

${reportTypePrompt}${contextInfo}

**Report Text:**
${extractedText}

**Med-Gemini Chain-of-Thought Analysis Instructions:**
Analyze this medical report using systematic Chain-of-Thought reasoning:
1. Read and understand the complete report
2. Identify all findings and classify by severity
3. Correlate findings with clinical context
4. Determine primary diagnosis with confidence level
5. Identify critical flags requiring immediate attention
6. Provide evidence-based recommendations

Provide a comprehensive analysis in JSON format with the following structure:

{
  "findings": [
    {
      "category": "Category name (e.g., Hematology, Pathology, etc.)",
      "finding": "Specific finding description",
      "severity": "normal" | "abnormal" | "critical",
      "location": "Anatomical location if applicable"
    }
  ],
  "diagnosis": {
    "primary": "Primary diagnosis or impression",
    "differential": ["Alternative diagnosis 1", "Alternative diagnosis 2"],
    "confidence": 0-100 (percentage)
  },
  "recommendations": {
    "immediate": ["Immediate action 1", "Immediate action 2"],
    "followUp": ["Follow-up action 1", "Follow-up action 2"],
    "lifestyle": ["Lifestyle recommendation 1", "Lifestyle recommendation 2"]
  },
  "criticalFlags": ["Critical finding 1", "Critical finding 2"],
  "technicalQuality": {
    "completeness": "complete" | "partial" | "incomplete",
    "readability": "excellent" | "good" | "fair" | "poor",
    "notes": "Notes about report quality"
  },
  "urgency": "routine" | "semi-urgent" | "urgent" | "emergency",
  "summary": "2-3 sentence summary of the report in plain language"
}

Provide ONLY the JSON object, no additional text.`;

  try {
    // Use Med-Gemini (Gemini Pro) with Chain-of-Thought reasoning for report analysis
    console.log(`[Medical Reports] Analyzing ${reportType} report with Med-Gemini Chain-of-Thought reasoning`);
    
    const response = await invokeGemini({
      messages: [
        {
          role: "system" as const,
          content: `You are Med-Gemini, an advanced medical AI system for report analysis.

Use Chain-of-Thought (CoT) reasoning methodology:
1. Systematic reading and comprehension
2. Finding identification and classification
3. Clinical correlation and interpretation
4. Diagnosis formulation with confidence scoring
5. Critical flag detection
6. Evidence-based recommendations

Provide structured, accurate analysis in JSON format.`,
        },
        {
          role: "user" as const,
          content: userPrompt as string,
        },
      ],
      task: 'clinical_reasoning', // Uses Gemini Pro for Med-Gemini clinical analysis
      temperature: 0.2, // Low temperature for clinical accuracy
      thinkingBudget: 3072, // Higher thinking budget for Med-Gemini Chain-of-Thought analysis
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "medical_report_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              findings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    finding: { type: "string" },
                    severity: { type: "string", enum: ["normal", "abnormal", "critical"] },
                    location: { type: "string" },
                  },
                  required: ["category", "finding", "severity"],
                  additionalProperties: false,
                },
              },
              diagnosis: {
                type: "object",
                properties: {
                  primary: { type: "string" },
                  differential: { type: "array", items: { type: "string" } },
                  confidence: { type: "number" },
                },
                required: ["primary", "differential", "confidence"],
                additionalProperties: false,
              },
              recommendations: {
                type: "object",
                properties: {
                  immediate: { type: "array", items: { type: "string" } },
                  followUp: { type: "array", items: { type: "string" } },
                  lifestyle: { type: "array", items: { type: "string" } },
                },
                required: ["immediate", "followUp", "lifestyle"],
                additionalProperties: false,
              },
              criticalFlags: { type: "array", items: { type: "string" } },
              technicalQuality: {
                type: "object",
                properties: {
                  completeness: { type: "string", enum: ["complete", "partial", "incomplete"] },
                  readability: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
                  notes: { type: "string" },
                },
                required: ["completeness", "readability", "notes"],
                additionalProperties: false,
              },
              urgency: { type: "string", enum: ["routine", "semi-urgent", "urgent", "emergency"] },
              summary: { type: "string" },
            },
            required: [
              "findings",
              "diagnosis",
              "recommendations",
              "criticalFlags",
              "technicalQuality",
              "urgency",
              "summary",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Ensure content is a string (handle both string and array types)
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const analysis = JSON.parse(contentStr);

    return {
      reportType,
      extractedText,
      ...analysis,
    };
  } catch (error: any) {
    console.error("Medical report analysis error:", error);
    throw new Error(`Failed to analyze medical report: ${error.message}`);
  }
}

/**
 * Auto-detect report type from extracted text (best effort)
 */
export function detectReportType(extractedText: string): ReportType {
  const text = extractedText.toLowerCase();

  // Pathology keywords
  if (
    text.includes("biopsy") ||
    text.includes("histopathology") ||
    text.includes("cytology") ||
    text.includes("malignancy") ||
    text.includes("specimen")
  ) {
    return "pathology";
  }

  // Blood test keywords
  if (
    text.includes("hemoglobin") ||
    text.includes("wbc") ||
    text.includes("platelet") ||
    text.includes("glucose") ||
    text.includes("creatinine") ||
    text.includes("alt") ||
    text.includes("ast")
  ) {
    return "blood_test";
  }

  // ECG keywords
  if (
    text.includes("ecg") ||
    text.includes("ekg") ||
    text.includes("electrocardiogram") ||
    text.includes("st segment") ||
    text.includes("qrs")
  ) {
    return "ecg";
  }

  // Endoscopy keywords
  if (
    text.includes("endoscopy") ||
    text.includes("esophagus") ||
    text.includes("gastroscopy") ||
    text.includes("duodenum")
  ) {
    return "endoscopy";
  }

  // Colonoscopy keywords
  if (text.includes("colonoscopy") || text.includes("colon") || text.includes("polyp")) {
    return "colonoscopy";
  }

  // Discharge summary keywords
  if (
    text.includes("discharge summary") ||
    text.includes("hospital course") ||
    text.includes("admission date")
  ) {
    return "discharge_summary";
  }

  // Default to other
  return "other";
}
