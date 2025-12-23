/**
 * Lab Reports Integration System
 * 
 * Integrates lab results into the diagnostic process, enabling AI to:
 * - Parse lab reports (PDF/image uploads)
 * - Extract key biomarkers and flag abnormal values
 * - Use lab data to refine differential diagnoses
 * - Track trends over time for chronic conditions
 */

import { getDb } from "../db";
import { labReports } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeGeminiFlash } from "../_core/gemini-dual";
import { storagePut } from "../storage";

export interface LabReport {
  id: number;
  userId: number;
  reportName: string | null;
  reportDate: Date;
  uploadDate: Date;
  fileUrl: string;
  ocrText: string | null;
  overallInterpretation: string | null;
  riskLevel: string | null;
}

export interface LabReportData {
  testName: string;
  testDate: string;
  laboratory: string;
  biomarkers: Biomarker[];
  summary: string;
}

export interface Biomarker {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: "normal" | "low" | "high" | "critical";
  clinicalNote?: string;
}

/**
 * Upload and parse a lab report
 */
export async function uploadLabReport(
  userId: number,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<LabReport> {
  // Step 1: Upload to S3
  const fileKey = `lab-reports/${userId}/${Date.now()}-${fileName}`;
  const { url: fileUrl } = await storagePut(fileKey, file, mimeType);

  // Step 2: Parse the report using Gemini Vision
  const parsedData = await parseLabReportWithAI(fileUrl, mimeType);

  // Step 3: Flag abnormal values
  const abnormalFlags = identifyAbnormalValues(parsedData);

  // Step 4: Generate clinical significance summary
  const clinicalSignificance = await generateClinicalSignificance(parsedData, abnormalFlags);

  // Step 5: Save to database
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [report] = await db.insert(labReports).values({
    userId,
    reportName: parsedData.testName,
    reportDate: new Date(parsedData.testDate),
    uploadDate: new Date(),
    fileUrl,
    fileType: mimeType,
    ocrText: JSON.stringify(parsedData),
    overallInterpretation: clinicalSignificance,
    riskLevel: abnormalFlags.length > 0 ? "moderate" : "low",
    extractionStatus: "completed",
    status: "uploaded",
  }).returning();

  return report as LabReport;
}

/**
 * Parse lab report using Gemini Vision API
 */
async function parseLabReportWithAI(
  fileUrl: string,
  mimeType: string
): Promise<LabReportData> {
  const prompt = `You are a medical lab report parser. Extract structured data from this lab report.

Return a JSON object with this exact structure:
{
  "testName": "Complete Blood Count" or "Lipid Panel" etc.,
  "testDate": "YYYY-MM-DD",
  "laboratory": "Lab name",
  "biomarkers": [
    {
      "name": "Hemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "referenceRange": "13.5-17.5",
      "status": "normal" | "low" | "high" | "critical"
    }
  ],
  "summary": "Brief clinical summary"
}

Extract ALL biomarkers/test results visible in the report. For status, compare value to reference range.`;

  const response = await invokeGeminiFlash({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: fileUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lab_report_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            testName: { type: "string" },
            testDate: { type: "string" },
            laboratory: { type: "string" },
            biomarkers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  unit: { type: "string" },
                  referenceRange: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["normal", "low", "high", "critical"],
                  },
                },
                required: ["name", "value", "unit", "referenceRange", "status"],
                additionalProperties: false,
              },
            },
            summary: { type: "string" },
          },
          required: ["testName", "testDate", "laboratory", "biomarkers", "summary"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

/**
 * Identify abnormal values that need clinical attention
 */
function identifyAbnormalValues(parsedData: LabReportData): string[] {
  const abnormal: string[] = [];

  for (const biomarker of parsedData.biomarkers) {
    if (biomarker.status === "high" || biomarker.status === "low" || biomarker.status === "critical") {
      abnormal.push(`${biomarker.name}: ${biomarker.value} ${biomarker.unit} (${biomarker.status})`);
    }
  }

  return abnormal;
}

/**
 * Generate clinical significance summary using AI
 */
async function generateClinicalSignificance(
  parsedData: LabReportData,
  abnormalFlags: string[]
): Promise<string> {
  if (abnormalFlags.length === 0) {
    return "All values within normal range. No immediate clinical concerns.";
  }

  const prompt = `You are a clinical pathologist. Given these abnormal lab values, provide a brief clinical significance summary (2-3 sentences).

Test: ${parsedData.testName}
Abnormal values:
${abnormalFlags.join("\n")}

Full biomarkers:
${JSON.stringify(parsedData.biomarkers, null, 2)}

Provide a concise clinical interpretation focusing on:
1. What these abnormalities might indicate
2. Whether immediate action is needed
3. Recommended follow-up

Keep it under 100 words.`;

  const response = await invokeGeminiFlash([
    { role: "system", content: "You are a clinical pathologist providing lab result interpretations." },
    { role: "user", content: prompt },
  ]);

  // invokeGeminiFlash returns string directly when no response_format is specified
  return typeof response === 'string' ? response : response.choices[0].message.content;
}

/**
 * Get recent lab reports for a user
 */
export async function getRecentLabReports(
  userId: number,
  limit: number = 10
): Promise<LabReport[]> {
  const db = await getDb();
  if (!db) return [];
  
  const reports = await db.query.labReports.findMany({
    where: eq(labReports.userId, userId),
    orderBy: [desc(labReports.reportDate)],
    limit,
  });

  return reports as LabReport[];
}

/**
 * Get lab report by ID
 */
export async function getLabReportById(
  reportId: number,
  userId: number
): Promise<LabReport | null> {
  const db = await getDb();
  if (!db) return null;
  
  const report = await db.query.labReports.findFirst({
    where: and(
      eq(labReports.id, reportId),
      eq(labReports.userId, userId)
    ),
  });

  return report as LabReport | null;
}

/**
 * Integrate lab reports into diagnostic context
 * 
 * This function is called by the orchestrator to enrich the context vector
 * with recent lab data.
 */
export async function getLabContextForDiagnosis(userId: number): Promise<string> {
  const recentReports = await getRecentLabReports(userId, 3);

  if (recentReports.length === 0) {
    return "No recent lab reports available.";
  }

  const summaries = recentReports.map(report => {
    const riskLevel = report.riskLevel || "unknown";
    return `- ${report.reportName || "Lab Report"} (${new Date(report.reportDate).toLocaleDateString()}): Risk level ${riskLevel}. ${report.overallInterpretation || "No interpretation available."}`;
  });

  return `Recent lab reports:\n${summaries.join("\n")}`;
}

/**
 * Track biomarker trends over time
 * 
 * Useful for chronic conditions like diabetes, hypertension, etc.
 */
export async function getBiomarkerTrend(
  userId: number,
  biomarkerName: string,
  months: number = 6
): Promise<Array<{ date: Date; value: string; status: string }>> {
  const db = await getDb();
  if (!db) return [];
  
  const reports = await db.query.labReports.findMany({
    where: eq(labReports.userId, userId),
    orderBy: [desc(labReports.reportDate)],
  });

  const trend: Array<{ date: Date; value: string; status: string }> = [];

  for (const report of reports) {
    if (!report.ocrText) continue;

    try {
      const parsedData = JSON.parse(report.ocrText) as LabReportData;
      const biomarker = parsedData.biomarkers.find(
        b => b.name.toLowerCase().includes(biomarkerName.toLowerCase())
      );

      if (biomarker) {
        trend.push({
          date: new Date(report.reportDate),
          value: `${biomarker.value} ${biomarker.unit}`,
          status: biomarker.status,
        });
      }
    } catch (e) {
      // Skip invalid JSON
      continue;
    }
  }

  return trend;
}

/**
 * Delete a lab report
 */
export async function deleteLabReport(
  reportId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.delete(labReports)
    .where(
      and(
        eq(labReports.id, reportId),
        eq(labReports.userId, userId)
      )
    );

  return result.length > 0;
}
