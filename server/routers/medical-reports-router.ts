/**
 * Medical Reports Router
 * tRPC procedures for medical report upload and AI-powered analysis
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";
import { analyzeMedicalReport, detectReportType, type ReportType } from "../_core/medical-reports-analysis";
import { extractTextFromLabReport } from "../lab-ocr";

export const medicalReportsRouter = router({
  /**
   * Upload and analyze a medical report
   */
  uploadAndAnalyze: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        fileType: z.string(), // mime type
        reportType: z.enum([
          "pathology",
          "blood_test",
          "discharge_summary",
          "consultation_note",
          "ecg",
          "pulmonary_function",
          "endoscopy",
          "colonoscopy",
          "cardiac_stress",
          "sleep_study",
          "genetic_test",
          "microbiology",
          "allergy_test",
          "urinalysis",
          "other",
        ]),
        patientAge: z.number().optional(),
        patientGender: z.string().optional(),
        medicalHistory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64 file data
        const buffer = Buffer.from(input.fileData, "base64");
        const fileSize = buffer.length;

        // Check file size (max 16MB)
        if (fileSize > 16 * 1024 * 1024) {
          throw new Error("File size exceeds 16MB limit");
        }

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split(".").pop() || "pdf";
        const fileKey = `medical-reports/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

        // Upload to S3
        const { url: fileUrl } = await storagePut(fileKey, buffer, input.fileType);

        // Extract text from report using OCR
        console.log("📄 Extracting text from medical report...");
        const extractedText = await extractTextFromLabReport(fileUrl, input.fileType);
        
        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error("Could not extract text from report. Please ensure the file is readable.");
        }

        console.log(`✅ Extracted ${extractedText.length} characters from report`);

        // Auto-detect report type if "other" was selected
        const reportType: ReportType = input.reportType === "other" 
          ? detectReportType(extractedText)
          : input.reportType;

        console.log(`🔍 Analyzing ${reportType} report with AI...`);

        // Analyze report with AI
        const analysis = await analyzeMedicalReport(reportType, extractedText, {
          age: input.patientAge,
          gender: input.patientGender,
          medicalHistory: input.medicalHistory,
        });

        console.log(`✅ Analysis complete. Urgency: ${analysis.urgency}, Findings: ${analysis.findings.length}`);

        return {
          success: true,
          fileUrl,
          reportType: analysis.reportType,
          extractedText: analysis.extractedText,
          findings: analysis.findings,
          diagnosis: analysis.diagnosis,
          recommendations: analysis.recommendations,
          criticalFlags: analysis.criticalFlags,
          technicalQuality: analysis.technicalQuality,
          urgency: analysis.urgency,
          summary: analysis.summary,
        };
      } catch (error: any) {
        console.error("❌ Medical report analysis error:", error);
        throw new Error(`Failed to analyze medical report: ${error.message}`);
      }
    }),

  /**
   * Re-analyze an existing report with different parameters
   */
  reanalyze: protectedProcedure
    .input(
      z.object({
        extractedText: z.string(),
        reportType: z.enum([
          "pathology",
          "blood_test",
          "discharge_summary",
          "consultation_note",
          "ecg",
          "pulmonary_function",
          "endoscopy",
          "colonoscopy",
          "cardiac_stress",
          "sleep_study",
          "genetic_test",
          "microbiology",
          "allergy_test",
          "urinalysis",
          "other",
        ]),
        patientAge: z.number().optional(),
        patientGender: z.string().optional(),
        medicalHistory: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`🔍 Re-analyzing ${input.reportType} report...`);

        const analysis = await analyzeMedicalReport(input.reportType, input.extractedText, {
          age: input.patientAge,
          gender: input.patientGender,
          medicalHistory: input.medicalHistory,
        });

        return {
          success: true,
          reportType: analysis.reportType,
          findings: analysis.findings,
          diagnosis: analysis.diagnosis,
          recommendations: analysis.recommendations,
          criticalFlags: analysis.criticalFlags,
          technicalQuality: analysis.technicalQuality,
          urgency: analysis.urgency,
          summary: analysis.summary,
        };
      } catch (error: any) {
        console.error("❌ Re-analysis error:", error);
        throw new Error(`Failed to re-analyze report: ${error.message}`);
      }
    }),
});
