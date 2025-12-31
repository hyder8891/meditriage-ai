import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { createMedicalDocument, getMedicalDocumentsByUserId } from "./db";
import { getDb } from "./db";
import { medicalDocuments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Medical Records Router
 * Handles file upload and management for patient medical records
 */

export const medicalRecordsRouter = router({
  /**
   * Upload a medical document
   * Accepts base64 file data and uploads to S3
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file
        mimeType: z.string(),
        documentType: z.enum([
          "lab_result",
          "imaging",
          "prescription",
          "insurance",
          "vaccination",
          "medical_history",
          "other",
        ]),
        description: z.string().optional(),
        triageRecordId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Decode base64 to buffer
        const base64Data = input.fileData.replace(/^data:.*?;base64,/, "");
        const fileBuffer = Buffer.from(base64Data, "base64");
        const fileSize = fileBuffer.length;

        // Validate file size (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size exceeds 10MB limit",
          });
        }

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileKey = `medical-records/${ctx.user.id}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Save metadata to database
        await createMedicalDocument({
          userId: ctx.user.id,
          triageRecordId: input.triageRecordId || null,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize,
          mimeType: input.mimeType,
          documentType: input.documentType,
          description: input.description || null,
        });

        return {
          success: true,
          fileUrl: url,
          message: "Document uploaded successfully",
        };
      } catch (error) {
        console.error("[Medical Records] Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to upload document",
        });
      }
    }),

  /**
   * Get all medical documents for current user
   */
  getMyDocuments: protectedProcedure.query(async ({ ctx }) => {
    try {
      const documents = await getMedicalDocumentsByUserId(ctx.user.id);
      return documents;
    } catch (error) {
      console.error("[Medical Records] Get documents error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve documents",
      });
    }
  }),

  /**
   * Delete a medical document
   */
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      try {
        // Verify ownership
        const [document] = await db
          .select()
          .from(medicalDocuments)
          .where(eq(medicalDocuments.id, input.documentId))
          .limit(1);

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        if (document.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this document",
          });
        }

        // Delete from database
        await db.delete(medicalDocuments).where(eq(medicalDocuments.id, input.documentId));

        // Note: We don't delete from S3 to maintain data integrity
        // Files can be cleaned up later with a separate maintenance job

        return {
          success: true,
          message: "Document deleted successfully",
        };
      } catch (error) {
        console.error("[Medical Records] Delete error:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete document",
        });
      }
    }),

  /**
   * Get document statistics
   */
  getDocumentStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    try {
      const documents = await getMedicalDocumentsByUserId(ctx.user.id);

      const stats = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        byType: documents.reduce((acc, doc) => {
          acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return stats;
    } catch (error) {
      console.error("[Medical Records] Stats error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get document statistics",
      });
    }
  }),
});
