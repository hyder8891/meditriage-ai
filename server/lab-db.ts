/**
 * Lab Result Database Helper Functions
 * 
 * Database operations for lab reports and results
 */

import { getDb } from "./db";
import { labReports, labResults, labReferenceRanges } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Create a new lab report
 */
export async function createLabReport(data: {
  userId: number;
  reportDate: Date;
  reportName?: string;
  labName?: string;
  orderingPhysician?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [report] = await db.insert(labReports).values({
    userId: data.userId,
    reportDate: data.reportDate,
    reportName: data.reportName,
    labName: data.labName,
    orderingPhysician: data.orderingPhysician,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    fileSize: data.fileSize,
    uploadDate: new Date(),
    extractionStatus: "pending",
    status: "uploaded",
  });

  return report.insertId;
}

/**
 * Get all lab reports for a user
 */
export async function getLabReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labReports)
    .where(eq(labReports.userId, userId))
    .orderBy(desc(labReports.reportDate));
}

/**
 * Get a specific lab report
 */
export async function getLabReportById(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const reports = await db
    .select()
    .from(labReports)
    .where(eq(labReports.id, reportId))
    .limit(1);

  return reports[0] || null;
}

/**
 * Update lab report with OCR text and extraction status
 */
export async function updateLabReportExtraction(
  reportId: number,
  data: {
    ocrText?: string;
    extractionStatus: string;
    extractionError?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(labReports)
    .set({
      ocrText: data.ocrText,
      extractionStatus: data.extractionStatus,
      extractionError: data.extractionError,
      updatedAt: new Date(),
    })
    .where(eq(labReports.id, reportId));
}

/**
 * Update lab report with AI interpretation
 */
export async function updateLabReportInterpretation(
  reportId: number,
  data: {
    overallInterpretation: string;
    riskLevel: string;
    recommendedActions: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(labReports)
    .set({
      overallInterpretation: data.overallInterpretation,
      riskLevel: data.riskLevel,
      recommendedActions: data.recommendedActions,
      status: "processed",
      updatedAt: new Date(),
    })
    .where(eq(labReports.id, reportId));
}

/**
 * Create lab results from extracted data
 */
export async function createLabResults(results: Array<{
  reportId: number;
  userId: number;
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
  abnormalFlag?: boolean;
  criticalFlag?: boolean;
  interpretation?: string;
  clinicalSignificance?: string;
  possibleCauses?: string;
  recommendedFollowUp?: string;
  testDate: Date;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(labResults).values(results);
}

/**
 * Get all lab results for a report
 */
export async function getLabResultsByReport(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labResults)
    .where(eq(labResults.reportId, reportId))
    .orderBy(labResults.testCategory, labResults.testName);
}

/**
 * Get all lab results for a user
 */
export async function getLabResultsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labResults)
    .where(eq(labResults.userId, userId))
    .orderBy(desc(labResults.testDate));
}

/**
 * Get lab results for a specific test over time (for trending)
 */
export async function getLabResultsByTest(userId: number, testName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labResults)
    .where(and(
      eq(labResults.userId, userId),
      eq(labResults.testName, testName)
    ))
    .orderBy(desc(labResults.testDate));
}

/**
 * Get reference range for a test
 */
export async function getReferenceRange(
  testName: string,
  age?: number,
  gender?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build query conditions
  const conditions = [eq(labReferenceRanges.testName, testName)];
  
  if (age !== undefined) {
    conditions.push(
      and(
        gte(labReferenceRanges.ageMax, age),
        lte(labReferenceRanges.ageMin, age)
      ) as any
    );
  }
  
  if (gender) {
    conditions.push(eq(labReferenceRanges.gender, gender));
  }

  const ranges = await db
    .select()
    .from(labReferenceRanges)
    .where(and(...conditions))
    .limit(1);

  return ranges[0] || null;
}

/**
 * Get all reference ranges for seeding/admin
 */
export async function getAllReferenceRanges() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labReferenceRanges)
    .orderBy(labReferenceRanges.testCategory, labReferenceRanges.testName);
}

/**
 * Seed reference ranges
 */
export async function seedReferenceRanges(ranges: Array<{
  testName: string;
  testCode?: string;
  testCategory?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  referenceMin?: number;
  referenceMax?: number;
  unit: string;
  criticalLow?: number;
  criticalHigh?: number;
  description?: string;
  clinicalContext?: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(labReferenceRanges).values(ranges);
}

/**
 * Get abnormal lab results for a user
 */
export async function getAbnormalLabResults(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labResults)
    .where(and(
      eq(labResults.userId, userId),
      eq(labResults.abnormalFlag, true)
    ))
    .orderBy(desc(labResults.testDate));
}

/**
 * Get critical lab results for a user
 */
export async function getCriticalLabResults(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(labResults)
    .where(and(
      eq(labResults.userId, userId),
      eq(labResults.criticalFlag, true)
    ))
    .orderBy(desc(labResults.testDate));
}
