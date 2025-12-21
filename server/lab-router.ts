/**
 * Lab Result Interpretation Router
 * tRPC procedures for lab report upload, processing, and interpretation
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { sendLabResultNotification, sendCriticalLabResultAlert } from "./services/email";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import {
  createLabReport,
  getLabReportsByUser,
  getLabReportById,
  updateLabReportExtraction,
  updateLabReportInterpretation,
  createLabResults,
  getLabResultsByReport,
  getLabResultsByUser,
  getLabResultsByTest,
  getAbnormalLabResults,
  getCriticalLabResults,
} from "./lab-db";
import {
  extractTextFromLabReport,
  parseLabResults,
  interpretLabResult,
  generateOverallInterpretation,
} from "./lab-ocr";

export const labRouter = router({
  /**
   * Upload a lab report file
   */
  uploadLabReport: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
        fileType: z.string(), // mime type
        reportDate: z.string(), // ISO date string
        reportName: z.string().optional(),
        labName: z.string().optional(),
        orderingPhysician: z.string().optional(),
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
        const fileKey = `lab-reports/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

        // Upload to S3
        const { url: fileUrl } = await storagePut(fileKey, buffer, input.fileType);

        // Create lab report record
        const reportId = await createLabReport({
          userId: ctx.user.id,
          reportDate: new Date(input.reportDate),
          reportName: input.reportName,
          labName: input.labName,
          orderingPhysician: input.orderingPhysician,
          fileUrl,
          fileType: input.fileType,
          fileSize,
        });

        return {
          success: true,
          reportId,
          fileUrl,
        };
      } catch (error: any) {
        console.error("Lab report upload error:", error);
        throw new Error(`Failed to upload lab report: ${error.message}`);
      }
    }),

  /**
   * Process a lab report (OCR + AI interpretation)
   */
  processLabReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the lab report
        const report = await getLabReportById(input.reportId);
        if (!report) {
          throw new Error("Lab report not found");
        }

        // Verify ownership
        if (report.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Update status to processing
        await updateLabReportExtraction(input.reportId, {
          extractionStatus: "processing",
        });

        // Step 1: Extract text using OCR
        let ocrText: string;
        try {
          ocrText = await extractTextFromLabReport(report.fileUrl, report.fileType || "application/pdf");
          
          await updateLabReportExtraction(input.reportId, {
            ocrText,
            extractionStatus: "extracted",
          });
        } catch (error: any) {
          await updateLabReportExtraction(input.reportId, {
            extractionStatus: "failed",
            extractionError: error.message,
          });
          throw error;
        }

        // Step 2: Parse lab results from OCR text
        const parsedResults = await parseLabResults(ocrText, report.reportDate);

        // Step 3: Interpret each lab result
        const interpretedResults = await Promise.all(
          parsedResults.map(async (result) => {
            const interpretation = await interpretLabResult(result);
            return {
              reportId: input.reportId,
              userId: ctx.user.id,
              ...result,
              interpretation: interpretation.interpretation,
              clinicalSignificance: interpretation.clinicalSignificance,
              possibleCauses: JSON.stringify(interpretation.possibleCauses),
              recommendedFollowUp: interpretation.recommendedFollowUp,
              testDate: report.reportDate,
            };
          })
        );

        // Step 4: Save lab results to database
        await createLabResults(interpretedResults);

        // Step 5: Generate overall interpretation
        const overall = await generateOverallInterpretation(
          interpretedResults.map((r) => ({
            testName: r.testName,
            value: r.value,
            status: r.status,
            abnormalFlag: r.abnormalFlag || false,
            criticalFlag: r.criticalFlag || false,
            interpretation: r.interpretation,
          }))
        );

        // Step 6: Update report with overall interpretation
        await updateLabReportInterpretation(input.reportId, {
          overallInterpretation: overall.overallInterpretation,
          riskLevel: overall.riskLevel,
          recommendedActions: JSON.stringify(overall.recommendedActions),
        });

        // Step 7: Send email notifications
        try {
          const db = await getDb();
          const [user] = await db!
            .select()
            .from(users)
            .where(eq(users.id, ctx.user.id))
            .limit(1);
          
          if (user && user.email) {
            const abnormalTests = interpretedResults
              .filter(r => r.abnormalFlag)
              .map(r => r.testName);
            
            const criticalTests = interpretedResults
              .filter(r => r.criticalFlag)
              .map(r => r.testName);
            
            const viewUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://app.manus.space"}/lab-results/${input.reportId}`;
            
            // Send critical alert if there are critical results
            if (criticalTests.length > 0) {
              sendCriticalLabResultAlert({
                patientName: user.name || "Patient",
                patientEmail: user.email,
                reportDate: report.reportDate.toLocaleDateString('en-US'),
                criticalTests,
                viewUrl,
                language: "ar",
              }).catch(err => console.error("[Lab] Failed to send critical alert:", err));
            } else {
              // Send normal notification
              sendLabResultNotification({
                patientName: user.name || "Patient",
                patientEmail: user.email,
                reportDate: report.reportDate.toLocaleDateString('en-US'),
                abnormalTests: abnormalTests.length > 0 ? abnormalTests : undefined,
                viewUrl,
                language: "ar",
              }).catch(err => console.error("[Lab] Failed to send notification:", err));
            }
          }
        } catch (err) {
          console.error("[Lab] Error sending email notification:", err);
        }

        return {
          success: true,
          resultsCount: interpretedResults.length,
          riskLevel: overall.riskLevel,
        };
      } catch (error: any) {
        console.error("Lab report processing error:", error);
        throw new Error(`Failed to process lab report: ${error.message}`);
      }
    }),

  /**
   * Get all lab reports for current user
   */
  getMyLabReports: protectedProcedure.query(async ({ ctx }) => {
    return await getLabReportsByUser(ctx.user.id);
  }),

  /**
   * Get a specific lab report with all results
   */
  getLabReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }) => {
      const report = await getLabReportById(input.reportId);
      if (!report) {
        throw new Error("Lab report not found");
      }

      // Verify ownership
      if (report.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const results = await getLabResultsByReport(input.reportId);

      return {
        report,
        results,
      };
    }),

  /**
   * Get all lab results for current user
   */
  getMyLabResults: protectedProcedure.query(async ({ ctx }) => {
    return await getLabResultsByUser(ctx.user.id);
  }),

  /**
   * Get lab results for a specific test (for trending)
   */
  getLabTrend: protectedProcedure
    .input(z.object({ testName: z.string() }))
    .query(async ({ ctx, input }) => {
      const results = await getLabResultsByTest(ctx.user.id, input.testName);
      
      // Calculate trend statistics
      if (results.length < 2) {
        return {
          testName: input.testName,
          results,
          trend: null,
        };
      }

      const numericResults = results
        .filter((r) => r.numericValue !== null)
        .map((r) => ({
          value: Number(r.numericValue),
          date: r.testDate,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (numericResults.length < 2) {
        return {
          testName: input.testName,
          results,
          trend: null,
        };
      }

      const first = numericResults[0];
      const last = numericResults[numericResults.length - 1];
      const percentChange = ((last.value - first.value) / first.value) * 100;
      const timeSpanDays = Math.floor(
        (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24)
      );

      let direction: string;
      if (Math.abs(percentChange) < 5) {
        direction = "stable";
      } else if (percentChange > 0) {
        direction = "increasing";
      } else {
        direction = "decreasing";
      }

      return {
        testName: input.testName,
        results,
        trend: {
          direction,
          percentChange: Math.round(percentChange * 10) / 10,
          timeSpanDays,
          firstValue: first.value,
          lastValue: last.value,
          measurementCount: numericResults.length,
        },
      };
    }),

  /**
   * Get abnormal lab results for current user
   */
  getAbnormalResults: protectedProcedure.query(async ({ ctx }) => {
    return await getAbnormalLabResults(ctx.user.id);
  }),

  /**
   * Get critical lab results for current user
   */
  getCriticalResults: protectedProcedure.query(async ({ ctx }) => {
    return await getCriticalLabResults(ctx.user.id);
  }),

  /**
   * Get lab dashboard summary
   */
  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const [allReports, allResults, abnormalResults, criticalResults] = await Promise.all([
      getLabReportsByUser(ctx.user.id),
      getLabResultsByUser(ctx.user.id),
      getAbnormalLabResults(ctx.user.id),
      getCriticalLabResults(ctx.user.id),
    ]);

    // Get latest report
    const latestReport = allReports[0] || null;

    // Count by risk level
    const riskCounts = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    allReports.forEach((report) => {
      const level = report.riskLevel as keyof typeof riskCounts;
      if (level && riskCounts[level] !== undefined) {
        riskCounts[level]++;
      }
    });

    return {
      totalReports: allReports.length,
      totalResults: allResults.length,
      abnormalCount: abnormalResults.length,
      criticalCount: criticalResults.length,
      latestReport,
      riskCounts,
    };
  }),
});
