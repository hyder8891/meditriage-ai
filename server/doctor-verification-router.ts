import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { doctorVerificationRequests, doctorVerificationDocuments, users } from "../drizzle/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import {
  processDocument,
  verifyDocuments,
  adminVerifyDoctor,
  calculateNameSimilarity,
} from "./services/document-verification";
import { nanoid } from "nanoid";

/**
 * Doctor Verification Router
 * Handles doctor registration approval workflow with document-based verification
 */
export const doctorVerificationRouter = router({
  /**
   * Upload a verification document (ID or medical certificate)
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      documentType: z.enum(["national_id", "medical_certificate"]),
      fileData: z.string(), // Base64 encoded file data
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Only doctors/clinicians can upload verification documents
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Only doctors can upload verification documents" 
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      try {
        // Check if document of this type already exists
        const existingDoc = await db
          .select()
          .from(doctorVerificationDocuments)
          .where(
            and(
              eq(doctorVerificationDocuments.userId, ctx.user.id),
              eq(doctorVerificationDocuments.documentType, input.documentType)
            )
          )
          .limit(1);

        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileSize = fileBuffer.length;

        // Generate unique file key
        const fileKey = `doctor-verification/${ctx.user.id}/${input.documentType}-${nanoid(10)}${getFileExtension(input.fileName)}`;

        // Upload to S3
        const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);

        if (existingDoc.length > 0) {
          // Update existing document
          await db.update(doctorVerificationDocuments)
            .set({
              fileKey,
              fileUrl,
              fileName: input.fileName,
              fileSize,
              mimeType: input.mimeType,
              processingStatus: "pending",
              processingError: null,
              processedAt: null,
              verificationStatus: "pending",
              nameMatchScore: null,
              nameMatchPassed: null,
            })
            .where(eq(doctorVerificationDocuments.id, existingDoc[0].id));

          // Process the document asynchronously
          processDocument(existingDoc[0].id, fileUrl, input.documentType).catch(console.error);

          return {
            success: true,
            documentId: existingDoc[0].id,
            message: "Document updated and processing started",
          };
        } else {
          // Insert new document
          const [result] = await db.insert(doctorVerificationDocuments).values({
            userId: ctx.user.id,
            documentType: input.documentType,
            fileKey,
            fileUrl,
            fileName: input.fileName,
            fileSize,
            mimeType: input.mimeType,
            processingStatus: "pending",
            verificationStatus: "pending",
          });

          // Update user status to pending_documents
          await db.update(users)
            .set({ 
              verificationStatus: "pending_documents",
              documentsSubmittedAt: new Date(),
            })
            .where(eq(users.id, ctx.user.id));

          // Process the document asynchronously
          processDocument(result.insertId, fileUrl, input.documentType).catch(console.error);

          return {
            success: true,
            documentId: result.insertId,
            message: "Document uploaded and processing started",
          };
        }
      } catch (error) {
        console.error("[DoctorVerification] Upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload document",
        });
      }
    }),

  /**
   * Get document processing status
   */
  getDocumentStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const documents = await db
        .select()
        .from(doctorVerificationDocuments)
        .where(eq(doctorVerificationDocuments.userId, ctx.user.id));

      const idDoc = documents.find(d => d.documentType === "national_id");
      const certDoc = documents.find(d => d.documentType === "medical_certificate");

      return {
        nationalId: idDoc ? {
          id: idDoc.id,
          fileName: idDoc.fileName,
          processingStatus: idDoc.processingStatus,
          verificationStatus: idDoc.verificationStatus,
          extractedName: idDoc.extractedName,
          extractedNameArabic: idDoc.extractedNameArabic,
          nameMatchScore: idDoc.nameMatchScore,
          nameMatchPassed: idDoc.nameMatchPassed,
          uploadedAt: idDoc.createdAt,
          processedAt: idDoc.processedAt,
        } : null,
        medicalCertificate: certDoc ? {
          id: certDoc.id,
          fileName: certDoc.fileName,
          processingStatus: certDoc.processingStatus,
          verificationStatus: certDoc.verificationStatus,
          extractedName: certDoc.extractedName,
          extractedNameArabic: certDoc.extractedNameArabic,
          extractedLicenseNumber: certDoc.extractedLicenseNumber,
          extractedSpecialty: certDoc.extractedSpecialty,
          extractedMedicalSchool: certDoc.extractedMedicalSchool,
          extractedGraduationYear: certDoc.extractedGraduationYear,
          nameMatchScore: certDoc.nameMatchScore,
          nameMatchPassed: certDoc.nameMatchPassed,
          uploadedAt: certDoc.createdAt,
          processedAt: certDoc.processedAt,
        } : null,
        bothUploaded: !!idDoc && !!certDoc,
        bothProcessed: idDoc?.processingStatus === "completed" && certDoc?.processingStatus === "completed",
        verificationStatus: ctx.user.verificationStatus || "unverified",
        isVerified: ctx.user.verified || false,
        adminVerified: ctx.user.adminVerified || false,
      };
    }),

  /**
   * Trigger verification after both documents are processed
   */
  triggerVerification: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Check if both documents exist and are processed
      const documents = await db
        .select()
        .from(doctorVerificationDocuments)
        .where(eq(doctorVerificationDocuments.userId, ctx.user.id));

      const idDoc = documents.find(d => d.documentType === "national_id");
      const certDoc = documents.find(d => d.documentType === "medical_certificate");

      if (!idDoc || !certDoc) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both ID and medical certificate must be uploaded",
        });
      }

      if (idDoc.processingStatus !== "completed" || certDoc.processingStatus !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Documents are still being processed. Please wait.",
        });
      }

      // Run verification
      const result = await verifyDocuments(ctx.user.id);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Verification failed",
        });
      }

      // Notify admin if manual review is needed
      if (!result.verified) {
        try {
          await notifyOwner({
            title: "Doctor Verification Needs Review",
            content: `Doctor ${ctx.user.name || ctx.user.email} requires manual verification review.\nName match score: ${result.nameMatchScore}%\nThreshold: 85%`,
          });
        } catch (e) {
          console.error("Failed to notify admin:", e);
        }
      }

      return {
        success: true,
        verified: result.verified,
        nameMatchScore: result.nameMatchScore,
        message: result.verified
          ? "Verification successful! Your account is now verified."
          : "Name matching did not pass automatic verification. An admin will review your documents.",
        profileData: result.profileData,
      };
    }),

  /**
   * Get verification status for current user
   */
  getVerificationStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return {
        isVerified: ctx.user.verified || false,
        verificationStatus: ctx.user.verificationStatus || "unverified",
        adminVerified: ctx.user.adminVerified || false,
        adminVerifiedAt: ctx.user.adminVerifiedAt,
        autoVerifiedAt: ctx.user.autoVerifiedAt,
        documentsSubmittedAt: ctx.user.documentsSubmittedAt,
        canAccessDashboard: (ctx.user.verified || ctx.user.adminVerified) || false,
      };
    }),

  /**
   * Admin: Get all pending verifications
   */
  getPendingVerifications: protectedProcedure
    .input(z.object({
      status: z.enum(["pending_documents", "pending_review", "verified", "rejected", "all"]).default("pending_review"),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get doctors with their verification documents
      const conditions = [
        or(eq(users.role, "doctor"), eq(users.role, "clinician")),
      ];

      if (input.status !== "all") {
        conditions.push(eq(users.verificationStatus, input.status));
      }

      const doctors = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phoneNumber: users.phoneNumber,
          verificationStatus: users.verificationStatus,
          verified: users.verified,
          adminVerified: users.adminVerified,
          documentsSubmittedAt: users.documentsSubmittedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(desc(users.documentsSubmittedAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get documents for each doctor
      const doctorsWithDocs = await Promise.all(
        doctors.map(async (doctor) => {
          const docs = await db
            .select()
            .from(doctorVerificationDocuments)
            .where(eq(doctorVerificationDocuments.userId, doctor.id));

          return {
            ...doctor,
            documents: {
              nationalId: docs.find(d => d.documentType === "national_id") || null,
              medicalCertificate: docs.find(d => d.documentType === "medical_certificate") || null,
            },
          };
        })
      );

      // Get counts
      const [counts] = await db
        .select({
          pendingDocuments: sql<number>`SUM(CASE WHEN verification_status = 'pending_documents' THEN 1 ELSE 0 END)`,
          pendingReview: sql<number>`SUM(CASE WHEN verification_status = 'pending_review' THEN 1 ELSE 0 END)`,
          verified: sql<number>`SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END)`,
          rejected: sql<number>`SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END)`,
          total: sql<number>`COUNT(*)`,
        })
        .from(users)
        .where(or(eq(users.role, "doctor"), eq(users.role, "clinician")));

      return {
        doctors: doctorsWithDocs,
        counts: {
          pendingDocuments: counts?.pendingDocuments || 0,
          pendingReview: counts?.pendingReview || 0,
          verified: counts?.verified || 0,
          rejected: counts?.rejected || 0,
          total: counts?.total || 0,
        },
      };
    }),

  /**
   * Admin: Manually verify a doctor (bypass document verification)
   */
  adminVerify: protectedProcedure
    .input(z.object({
      doctorId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const result = await adminVerifyDoctor(input.doctorId, ctx.user.id, input.notes);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to verify doctor",
        });
      }

      return {
        success: true,
        message: "Doctor verified successfully",
      };
    }),

  /**
   * Admin: Reject a doctor's verification
   */
  adminReject: protectedProcedure
    .input(z.object({
      doctorId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      await db.update(users)
        .set({
          verificationStatus: "rejected",
          verified: false,
        })
        .where(eq(users.id, input.doctorId));

      await db.update(doctorVerificationDocuments)
        .set({
          verificationStatus: "rejected",
          verificationNotes: input.reason,
        })
        .where(eq(doctorVerificationDocuments.userId, input.doctorId));

      return {
        success: true,
        message: "Doctor verification rejected",
      };
    }),

  // Keep existing endpoints for backward compatibility
  submitRequest: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2),
      dateOfBirth: z.string().optional(),
      nationalIdNumber: z.string().optional(),
      medicalLicenseNumber: z.string().min(1),
      licenseIssuingAuthority: z.string().min(1),
      licenseIssueDate: z.string(),
      licenseExpiryDate: z.string().optional(),
      specialty: z.string().optional(),
      subspecialty: z.string().optional(),
      yearsOfExperience: z.number().optional(),
      medicalSchool: z.string().optional(),
      graduationYear: z.number().optional(),
      nationalIdDocumentUrl: z.string().optional(),
      nationalIdDocumentKey: z.string().optional(),
      medicalLicenseDocumentUrl: z.string().optional(),
      medicalLicenseDocumentKey: z.string().optional(),
      medicalDegreeDocumentUrl: z.string().optional(),
      medicalDegreeDocumentKey: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const existingRequest = await db
        .select()
        .from(doctorVerificationRequests)
        .where(
          and(
            eq(doctorVerificationRequests.userId, ctx.user.id),
            or(
              eq(doctorVerificationRequests.status, "pending"),
              eq(doctorVerificationRequests.status, "under_review")
            )
          )
        )
        .limit(1);

      if (existingRequest.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending verification request",
        });
      }

      const [result] = await db.insert(doctorVerificationRequests).values({
        userId: ctx.user.id,
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        nationalIdNumber: input.nationalIdNumber || null,
        medicalLicenseNumber: input.medicalLicenseNumber,
        licenseIssuingAuthority: input.licenseIssuingAuthority,
        licenseIssueDate: new Date(input.licenseIssueDate),
        licenseExpiryDate: input.licenseExpiryDate ? new Date(input.licenseExpiryDate) : null,
        specialty: input.specialty || null,
        subspecialty: input.subspecialty || null,
        yearsOfExperience: input.yearsOfExperience || null,
        medicalSchool: input.medicalSchool || null,
        graduationYear: input.graduationYear || null,
        nationalIdDocumentUrl: input.nationalIdDocumentUrl || null,
        nationalIdDocumentKey: input.nationalIdDocumentKey || null,
        medicalLicenseDocumentUrl: input.medicalLicenseDocumentUrl || null,
        medicalLicenseDocumentKey: input.medicalLicenseDocumentKey || null,
        medicalDegreeDocumentUrl: input.medicalDegreeDocumentUrl || null,
        medicalDegreeDocumentKey: input.medicalDegreeDocumentKey || null,
        status: "pending",
      });

      try {
        await notifyOwner({
          title: "New Doctor Verification Request",
          content: `Dr. ${input.fullName} has submitted a verification request.\nLicense: ${input.medicalLicenseNumber}\nSpecialty: ${input.specialty || 'Not specified'}`,
        });
      } catch (e) {
        console.error("Failed to notify admin:", e);
      }

      return {
        success: true,
        requestId: result.insertId,
        message: "Verification request submitted successfully",
      };
    }),

  getMyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [request] = await db
        .select()
        .from(doctorVerificationRequests)
        .where(eq(doctorVerificationRequests.userId, ctx.user.id))
        .orderBy(desc(doctorVerificationRequests.createdAt))
        .limit(1);

      return request || null;
    }),

  getPendingRequests: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "under_review", "approved", "rejected", "requires_more_info", "all"]).default("pending"),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const conditions = input.status !== "all" 
        ? [eq(doctorVerificationRequests.status, input.status)]
        : [];

      const requests = await db
        .select({
          request: doctorVerificationRequests,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            phoneNumber: users.phoneNumber,
          },
        })
        .from(doctorVerificationRequests)
        .leftJoin(users, eq(doctorVerificationRequests.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(doctorVerificationRequests.submittedAt))
        .limit(input.limit)
        .offset(input.offset);

      const [counts] = await db
        .select({
          pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
          underReview: sql<number>`SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END)`,
          approved: sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`,
          rejected: sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`,
          requiresMoreInfo: sql<number>`SUM(CASE WHEN status = 'requires_more_info' THEN 1 ELSE 0 END)`,
          total: sql<number>`COUNT(*)`,
        })
        .from(doctorVerificationRequests);

      return {
        requests,
        counts: {
          pending: counts?.pending || 0,
          underReview: counts?.underReview || 0,
          approved: counts?.approved || 0,
          rejected: counts?.rejected || 0,
          requiresMoreInfo: counts?.requiresMoreInfo || 0,
          total: counts?.total || 0,
        },
      };
    }),

  reviewRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      action: z.enum(["approve", "reject", "request_more_info", "start_review"]),
      notes: z.string().optional(),
      rejectionReason: z.string().optional(),
      additionalInfoRequested: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [request] = await db
        .select()
        .from(doctorVerificationRequests)
        .where(eq(doctorVerificationRequests.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      let newStatus: "pending" | "under_review" | "approved" | "rejected" | "requires_more_info";
      switch (input.action) {
        case "approve":
          newStatus = "approved";
          break;
        case "reject":
          newStatus = "rejected";
          break;
        case "request_more_info":
          newStatus = "requires_more_info";
          break;
        case "start_review":
          newStatus = "under_review";
          break;
        default:
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid action" });
      }

      await db.update(doctorVerificationRequests)
        .set({
          status: newStatus,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes || null,
          rejectionReason: input.action === "reject" ? input.rejectionReason : null,
          additionalInfoRequested: input.action === "request_more_info" ? input.additionalInfoRequested : null,
        })
        .where(eq(doctorVerificationRequests.id, input.requestId));

      if (input.action === "approve") {
        await db.update(users)
          .set({
            verified: true,
            verificationStatus: "verified",
            role: "clinician",
            licenseNumber: request.medicalLicenseNumber,
            specialty: request.specialty,
            adminVerified: true,
            adminVerifiedBy: ctx.user.id,
            adminVerifiedAt: new Date(),
          })
          .where(eq(users.id, request.userId));
      }

      return {
        success: true,
        newStatus,
        message: `Request ${input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : input.action === "request_more_info" ? "more info requested" : "under review"}`,
      };
    }),

  updateRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      nationalIdDocumentUrl: z.string().optional(),
      nationalIdDocumentKey: z.string().optional(),
      medicalLicenseDocumentUrl: z.string().optional(),
      medicalLicenseDocumentKey: z.string().optional(),
      medicalDegreeDocumentUrl: z.string().optional(),
      medicalDegreeDocumentKey: z.string().optional(),
      additionalDocumentsJson: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const [request] = await db
        .select()
        .from(doctorVerificationRequests)
        .where(
          and(
            eq(doctorVerificationRequests.id, input.requestId),
            eq(doctorVerificationRequests.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      if (request.status !== "requires_more_info" && request.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Request cannot be updated in current status" });
      }

      await db.update(doctorVerificationRequests)
        .set({
          nationalIdDocumentUrl: input.nationalIdDocumentUrl || request.nationalIdDocumentUrl,
          nationalIdDocumentKey: input.nationalIdDocumentKey || request.nationalIdDocumentKey,
          medicalLicenseDocumentUrl: input.medicalLicenseDocumentUrl || request.medicalLicenseDocumentUrl,
          medicalLicenseDocumentKey: input.medicalLicenseDocumentKey || request.medicalLicenseDocumentKey,
          medicalDegreeDocumentUrl: input.medicalDegreeDocumentUrl || request.medicalDegreeDocumentUrl,
          medicalDegreeDocumentKey: input.medicalDegreeDocumentKey || request.medicalDegreeDocumentKey,
          additionalDocumentsJson: input.additionalDocumentsJson || request.additionalDocumentsJson,
          status: "pending",
        })
        .where(eq(doctorVerificationRequests.id, input.requestId));

      return {
        success: true,
        message: "Request updated successfully",
      };
    }),
});

// Helper function to get file extension
function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop();
  return ext ? `.${ext}` : '';
}
