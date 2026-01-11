/**
 * Doctor Verification Router
 * Handles doctor/clinician verification requests and admin review
 */

import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { doctorVerificationRequests, doctorVerificationDocuments, users } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const doctorVerificationRouter = router({
  /**
   * Get pending verification requests (admin only)
   */
  getPendingRequests: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "under_review", "requires_more_info"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Check admin access
      if (!["admin", "super_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      
      const whereClause = input.status 
        ? eq(doctorVerificationRequests.status, input.status)
        : undefined;

      const requests = await db!
        .select()
        .from(doctorVerificationRequests)
        .where(whereClause)
        .orderBy(desc(doctorVerificationRequests.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get user info for each request
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const [user] = await db!
            .select({
              id: users.id,
              email: users.email,
              phoneNumber: users.phoneNumber,
              name: users.name,
            })
            .from(users)
            .where(eq(users.id, request.userId))
            .limit(1);

          // Get documents for this request
          const documents = await db!
            .select()
            .from(doctorVerificationDocuments)
            .where(eq(doctorVerificationDocuments.userId, request.userId));

          return {
            request,
            user,
            documents,
          };
        })
      );

      // Get total count
      const [countResult] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(doctorVerificationRequests)
        .where(whereClause);

      return {
        requests: requestsWithUsers,
        total: countResult?.count || 0,
      };
    }),

  /**
   * Review a verification request (admin only)
   */
  reviewRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      action: z.enum(["approve", "reject", "request_more_info"]),
      notes: z.string().optional(),
      rejectionReason: z.string().optional(),
      additionalInfoRequested: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check admin access
      if (!["admin", "super_admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();

      // Get the request
      const [request] = await db!
        .select()
        .from(doctorVerificationRequests)
        .where(eq(doctorVerificationRequests.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      let newStatus: "approved" | "rejected" | "requires_more_info";
      let message: string;

      switch (input.action) {
        case "approve":
          newStatus = "approved";
          message = "Verification request approved";
          
          // Update user role to clinician/doctor
          await db!
            .update(users)
            .set({ 
              role: "clinician",
              verified: true,
            })
            .where(eq(users.id, request.userId));
          break;

        case "reject":
          newStatus = "rejected";
          message = "Verification request rejected";
          break;

        case "request_more_info":
          newStatus = "requires_more_info";
          message = "Additional information requested";
          break;
      }

      // Update the request
      await db!
        .update(doctorVerificationRequests)
        .set({
          status: newStatus,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes || null,
          rejectionReason: input.rejectionReason || null,
          additionalInfoRequested: input.additionalInfoRequested || null,
          updatedAt: new Date(),
        })
        .where(eq(doctorVerificationRequests.id, input.requestId));

      return { success: true, message };
    }),

  /**
   * Submit a verification request (for doctors/clinicians)
   */
  submitRequest: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2),
      specialty: z.string().optional(),
      medicalLicenseNumber: z.string().min(1),
      yearsOfExperience: z.number().min(0).optional(),
      hospitalAffiliation: z.string().optional(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Check if user already has a pending request
      const [existingRequest] = await db!
        .select()
        .from(doctorVerificationRequests)
        .where(and(
          eq(doctorVerificationRequests.userId, ctx.user.id),
          eq(doctorVerificationRequests.status, "pending")
        ))
        .limit(1);

      if (existingRequest) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "You already have a pending verification request" 
        });
      }

      // Create new request
      await db!
        .insert(doctorVerificationRequests)
        .values({
          userId: ctx.user.id,
          fullName: input.fullName,
          specialty: input.specialty || null,
          medicalLicenseNumber: input.medicalLicenseNumber,
          licenseIssuingAuthority: input.hospitalAffiliation || "Unknown",
          licenseIssueDate: new Date(),
          yearsOfExperience: input.yearsOfExperience || null,
          status: "pending",
        });

      return { success: true, message: "Verification request submitted successfully" };
    }),

  /**
   * Get my verification request status
   */
  getMyRequest: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();

    const [request] = await db!
      .select()
      .from(doctorVerificationRequests)
      .where(eq(doctorVerificationRequests.userId, ctx.user.id))
      .orderBy(desc(doctorVerificationRequests.createdAt))
      .limit(1);

    if (!request) {
      return null;
    }

    // Get documents
    const documents = await db!
      .select()
      .from(doctorVerificationDocuments)
      .where(eq(doctorVerificationDocuments.userId, ctx.user.id));

    return { request, documents };
  }),

  /**
   * Upload verification document
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      documentType: z.enum(["national_id", "medical_certificate"]),
      documentUrl: z.string().url(),
      documentName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Verify the request belongs to the user
      const [request] = await db!
        .select()
        .from(doctorVerificationRequests)
        .where(and(
          eq(doctorVerificationRequests.id, input.requestId),
          eq(doctorVerificationRequests.userId, ctx.user.id)
        ))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      // Add document
      await db!
        .insert(doctorVerificationDocuments)
        .values({
          userId: ctx.user.id,
          documentType: input.documentType,
          fileKey: input.documentUrl, // Using URL as key for now
          fileUrl: input.documentUrl,
          fileName: input.documentName,
          fileSize: 0, // Unknown size
          mimeType: "application/octet-stream", // Unknown type
        });

      return { success: true, message: "Document uploaded successfully" };
    }),
});

export type DoctorVerificationRouter = typeof doctorVerificationRouter;
