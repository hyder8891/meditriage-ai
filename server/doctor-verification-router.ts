import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { doctorVerificationRequests, users } from "../drizzle/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

/**
 * Doctor Verification Router
 * Handles doctor registration approval workflow
 */
export const doctorVerificationRouter = router({
  /**
   * Submit a new verification request
   */
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
      // Document URLs (uploaded via separate endpoint)
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

      // Check if user already has a pending request
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

      // Create the verification request
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

      // Notify admin about new verification request
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

  /**
   * Get current user's verification status
   */
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

  /**
   * Get all pending verification requests (Admin only)
   */
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

      // Only admins can view pending requests
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

      // Get counts by status
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

  /**
   * Review a verification request (Admin only)
   */
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

      // Only admins can review requests
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get the request
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

      // Update the request
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

      // If approved, update the user's verified status and role
      if (input.action === "approve") {
        await db.update(users)
          .set({
            verified: true,
            role: "clinician",
            licenseNumber: request.medicalLicenseNumber,
            specialty: request.specialty,
          })
          .where(eq(users.id, request.userId));
      }

      return {
        success: true,
        newStatus,
        message: `Request ${input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : input.action === "request_more_info" ? "more info requested" : "under review"}`,
      };
    }),

  /**
   * Update a verification request (for doctors to provide more info)
   */
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

      // Get the request and verify ownership
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

      // Update the request
      await db.update(doctorVerificationRequests)
        .set({
          nationalIdDocumentUrl: input.nationalIdDocumentUrl || request.nationalIdDocumentUrl,
          nationalIdDocumentKey: input.nationalIdDocumentKey || request.nationalIdDocumentKey,
          medicalLicenseDocumentUrl: input.medicalLicenseDocumentUrl || request.medicalLicenseDocumentUrl,
          medicalLicenseDocumentKey: input.medicalLicenseDocumentKey || request.medicalLicenseDocumentKey,
          medicalDegreeDocumentUrl: input.medicalDegreeDocumentUrl || request.medicalDegreeDocumentUrl,
          medicalDegreeDocumentKey: input.medicalDegreeDocumentKey || request.medicalDegreeDocumentKey,
          additionalDocumentsJson: input.additionalDocumentsJson || request.additionalDocumentsJson,
          status: "pending", // Reset to pending after update
        })
        .where(eq(doctorVerificationRequests.id, input.requestId));

      return {
        success: true,
        message: "Request updated successfully",
      };
    }),
});
