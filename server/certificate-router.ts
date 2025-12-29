import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  createMedicalCertificate,
  getMedicalCertificatesByUserId,
  getMedicalCertificateById,
  updateMedicalCertificate,
  deleteMedicalCertificate,
  getAllMedicalCertificates,
  verifyCertificate
} from "./db-certificates";

export const certificateRouter = router({
  // Create a new certificate
  create: protectedProcedure
    .input(z.object({
      certificateType: z.string(),
      certificateName: z.string(),
      issuingOrganization: z.string(),
      certificateNumber: z.string(),
      issueDate: z.string(), // ISO date string
      expiryDate: z.string().optional(),
      specialty: z.string().optional(),
      country: z.string().optional(),
      state: z.string().optional(),
      documentKey: z.string().optional(),
      documentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await createMedicalCertificate({
        userId: ctx.user.id,
        ...input,
        issueDate: new Date(input.issueDate),
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      });
    }),

  // Get all certificates for current user
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await getMedicalCertificatesByUserId(ctx.user.id);
    }),

  // Get a specific certificate
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const certificate = await getMedicalCertificateById(input.id);
      
      // Only allow users to view their own certificates, or admins to view any
      if (certificate && certificate.userId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new Error("Unauthorized");
      }
      
      return certificate;
    }),

  // Update a certificate
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      certificateType: z.string().optional(),
      certificateName: z.string().optional(),
      issuingOrganization: z.string().optional(),
      certificateNumber: z.string().optional(),
      issueDate: z.string().optional(),
      expiryDate: z.string().optional(),
      specialty: z.string().optional(),
      country: z.string().optional(),
      state: z.string().optional(),
      documentKey: z.string().optional(),
      documentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const certificate = await getMedicalCertificateById(input.id);
      
      // Only allow users to update their own certificates
      if (!certificate || certificate.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      const { id, ...updates } = input;
      return await updateMedicalCertificate(id, {
        ...updates,
        issueDate: updates.issueDate ? new Date(updates.issueDate) : undefined,
        expiryDate: updates.expiryDate ? new Date(updates.expiryDate) : undefined,
      });
    }),

  // Delete a certificate
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const certificate = await getMedicalCertificateById(input.id);
      
      // Only allow users to delete their own certificates
      if (!certificate || certificate.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      return await deleteMedicalCertificate(input.id);
    }),

  // Admin: Get all certificates (with optional filters)
  adminList: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "verified", "rejected", "expired"]).optional(),
      userId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await getAllMedicalCertificates(input);
    }),

  // Admin: Verify a certificate
  verify: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["verified", "rejected"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await verifyCertificate(
        input.id,
        input.status,
        ctx.user.id,
        input.notes
      );
    }),
});
