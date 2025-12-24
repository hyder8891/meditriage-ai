/**
 * SOAP Templates and EMR Export Router
 * tRPC procedures for managing SOAP note templates and exporting to EMR systems
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  seedSystemTemplates,
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  incrementTemplateUsage,
} from "./soap-templates";
import {
  exportToPdfWithQR,
  exportToHL7,
  getExportLog,
  getPatientExports,
  incrementExportAccess,
  SoapNoteData,
  ExportOptions,
} from "./soap-emr-export";

export const soapRouter = router({
  /**
   * Seed system templates (admin only)
   */
  seedTemplates: protectedProcedure.mutation(async ({ ctx }) => {
    // Only allow admins to seed templates
    if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const result = await seedSystemTemplates();
    return result;
  }),

  /**
   * Get all active SOAP note templates
   */
  getTemplates: protectedProcedure.query(async () => {
    const templates = await getAllTemplates();
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      nameAr: t.nameAr,
      category: t.category,
      description: t.description,
      descriptionAr: t.descriptionAr,
      usageCount: t.usageCount,
      lastUsed: t.lastUsed,
    }));
  }),

  /**
   * Get template by ID with full details
   */
  getTemplateById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const template = await getTemplateById(input.id);
      if (!template) {
        throw new Error("Template not found");
      }

      return {
        ...template,
        subjectiveTemplate: JSON.parse(template.subjectiveTemplate as string),
        objectiveTemplate: JSON.parse(template.objectiveTemplate as string),
        assessmentTemplate: JSON.parse(template.assessmentTemplate as string),
        planTemplate: JSON.parse(template.planTemplate as string),
        commonSymptoms: template.commonSymptoms
          ? JSON.parse(template.commonSymptoms as string)
          : [],
        redFlags: template.redFlags ? JSON.parse(template.redFlags as string) : [],
        typicalDiagnoses: template.typicalDiagnoses
          ? JSON.parse(template.typicalDiagnoses as string)
          : [],
      };
    }),

  /**
   * Get templates by category
   */
  getTemplatesByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const templates = await getTemplatesByCategory(input.category);
      return templates.map((t) => ({
        id: t.id,
        name: t.name,
        nameAr: t.nameAr,
        category: t.category,
        description: t.description,
        descriptionAr: t.descriptionAr,
        usageCount: t.usageCount,
        lastUsed: t.lastUsed,
      }));
    }),

  /**
   * Use a template (increment usage count)
   */
  useTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input }) => {
      await incrementTemplateUsage(input.templateId);
      return { success: true };
    }),

  /**
   * Export SOAP note to PDF with QR code
   */
  exportToPdf: protectedProcedure
    .input(
      z.object({
        soapNote: z.object({
          patientId: z.number(),
          patientName: z.string(),
          patientAge: z.number().optional(),
          patientGender: z.string().optional(),
          clinicianId: z.number(),
          clinicianName: z.string(),
          encounterDate: z.date(),
          subjective: z.string(),
          objective: z.string(),
          assessment: z.string(),
          plan: z.string(),
          vitalSigns: z
            .object({
              bp: z.string().optional(),
              hr: z.number().optional(),
              rr: z.number().optional(),
              temp: z.number().optional(),
              o2sat: z.number().optional(),
              weight: z.number().optional(),
              height: z.number().optional(),
            })
            .optional(),
          diagnosis: z.string().optional(),
          medications: z.array(z.string()).optional(),
          allergies: z.array(z.string()).optional(),
        }),
        options: z.object({
          format: z.enum(["pdf_with_qr", "pdf_simple"]),
          destinationSystem: z.string().optional(),
          destinationFacilityId: z.string().optional(),
          exportPurpose: z.string().optional(),
          expiresInHours: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await exportToPdfWithQR(
        input.soapNote as SoapNoteData,
        input.options as ExportOptions,
        ctx.user.id
      );

      if (!result.success) {
        throw new Error(result.error || "Export failed");
      }

      return {
        success: true,
        exportId: result.exportId,
        fileUrl: result.fileUrl,
      };
    }),

  /**
   * Export SOAP note to HL7 format
   */
  exportToHL7: protectedProcedure
    .input(
      z.object({
        soapNote: z.object({
          patientId: z.number(),
          patientName: z.string(),
          patientAge: z.number().optional(),
          patientGender: z.string().optional(),
          clinicianId: z.number(),
          clinicianName: z.string(),
          encounterDate: z.date(),
          subjective: z.string(),
          objective: z.string(),
          assessment: z.string(),
          plan: z.string(),
          vitalSigns: z
            .object({
              bp: z.string().optional(),
              hr: z.number().optional(),
              rr: z.number().optional(),
              temp: z.number().optional(),
              o2sat: z.number().optional(),
              weight: z.number().optional(),
              height: z.number().optional(),
            })
            .optional(),
          diagnosis: z.string().optional(),
          medications: z.array(z.string()).optional(),
          allergies: z.array(z.string()).optional(),
        }),
        options: z.object({
          format: z.enum(["hl7_v2", "hl7_v3"]),
          destinationSystem: z.string().optional(),
          destinationFacilityId: z.string().optional(),
          exportPurpose: z.string().optional(),
          expiresInHours: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await exportToHL7(
        input.soapNote as SoapNoteData,
        input.options as ExportOptions,
        ctx.user.id
      );

      if (!result.success) {
        throw new Error(result.error || "Export failed");
      }

      return {
        success: true,
        exportId: result.exportId,
        fileUrl: result.fileUrl,
      };
    }),

  /**
   * Get export log by ID
   */
  getExportLog: protectedProcedure
    .input(z.object({ exportId: z.string() }))
    .query(async ({ input, ctx }) => {
      const exportLog = await getExportLog(input.exportId);
      
      if (!exportLog) {
        throw new Error("Export not found");
      }

      // Only allow access to own exports or if admin
      if (
        exportLog.exportedBy !== ctx.user.id &&
        ctx.user.role !== "admin" &&
        ctx.user.role !== "super_admin"
      ) {
        throw new Error("Unauthorized: Cannot access this export");
      }

      // Increment access count
      await incrementExportAccess(input.exportId);

      return {
        ...exportLog,
        soapContent: JSON.parse(exportLog.soapContent as string),
        qrCodeData: exportLog.qrCodeData
          ? JSON.parse(exportLog.qrCodeData as string)
          : null,
      };
    }),

  /**
   * Get all exports for a patient
   */
  getPatientExports: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Only allow doctors/admins or the patient themselves to view exports
      if (
        input.patientId !== ctx.user.id &&
        ctx.user.role !== "doctor" &&
        ctx.user.role !== "clinician" &&
        ctx.user.role !== "admin" &&
        ctx.user.role !== "super_admin"
      ) {
        throw new Error("Unauthorized: Cannot access patient exports");
      }

      const exports = await getPatientExports(input.patientId);
      
      return exports.map((exp) => ({
        id: exp.id,
        exportId: exp.exportId,
        exportFormat: exp.exportFormat,
        encounterDate: exp.encounterDate,
        status: exp.status,
        destinationSystem: exp.destinationSystem,
        exportPurpose: exp.exportPurpose,
        accessedCount: exp.accessedCount,
        lastAccessedAt: exp.lastAccessedAt,
        expiresAt: exp.expiresAt,
        createdAt: exp.createdAt,
        fileUrl: exp.fileUrl,
      }));
    }),
});
