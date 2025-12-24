import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeDeepSeek } from "./_core/deepseek";
import { IRAQI_MEDICAL_CONTEXT_PROMPT } from "@shared/iraqiMedicalContext";
import {
  addPatientMedication,
  getPatientMedications,
  getPatientMedicationById,
  updatePatientMedication,
  deactivatePatientMedication,
  deletePatientMedication,
  addMedicalCondition,
  getPatientConditions,
  getMedicalConditionById,
  updateMedicalCondition,
  deleteMedicalCondition,
  saveMedicineImage,
  getMedicineImageById,
  getUserMedicineImages,
  updateMedicineImage,
  deleteMedicineImage,
  logDrugInteractionCheck,
  getUserInteractionChecks,
} from "./pharmaguard-db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

export const pharmaguardRouter = router({
  /**
   * Patient Medications Management
   */
  addMedication: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(), // if not provided, use current user
      drugName: z.string(),
      genericName: z.string().optional(),
      brandName: z.string().optional(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      route: z.string().optional(),
      startDate: z.date().optional(),
      source: z.enum(["prescription", "otc", "self_reported"]).default("self_reported"),
      purpose: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization: users can only add meds for themselves, clinicians can add for patients
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to add medications for this patient" });
      }
      
      const medicationId = await addPatientMedication({
        patientId,
        drugName: input.drugName,
        genericName: input.genericName,
        brandName: input.brandName,
        dosage: input.dosage,
        frequency: input.frequency,
        route: input.route,
        startDate: input.startDate || new Date(),
        source: input.source,
        purpose: input.purpose,
        notes: input.notes,
        isActive: true,
      });
      
      return { success: true, medicationId };
    }),

  getMyMedications: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      activeOnly: z.boolean().default(true),
    }))
    .query(async ({ input, ctx }) => {
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view medications for this patient" });
      }
      
      return await getPatientMedications(patientId, input.activeOnly);
    }),

  removeMedication: protectedProcedure
    .input(z.object({
      medicationId: z.number(),
      deleteCompletely: z.boolean().default(false), // if false, just deactivate
    }))
    .mutation(async ({ input, ctx }) => {
      const medication = await getPatientMedicationById(input.medicationId);
      if (!medication) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Medication not found" });
      }
      
      // Check authorization
      if (medication.patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to remove this medication" });
      }
      
      if (input.deleteCompletely) {
        await deletePatientMedication(input.medicationId);
      } else {
        await deactivatePatientMedication(input.medicationId);
      }
      
      return { success: true };
    }),

  /**
   * Medical Conditions Management
   */
  addCondition: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      conditionName: z.string(),
      conditionType: z.enum(["chronic_disease", "allergy", "contraindication", "risk_factor", "past_condition"]),
      severity: z.enum(["mild", "moderate", "severe"]).optional(),
      diagnosedDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to add conditions for this patient" });
      }
      
      const conditionId = await addMedicalCondition({
        patientId,
        conditionName: input.conditionName,
        conditionType: input.conditionType,
        severity: input.severity || "moderate",
        status: "active",
        diagnosedDate: input.diagnosedDate,
        notes: input.notes,
        affectsMedications: true,
      });
      
      return { success: true, conditionId };
    }),

  getMyConditions: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      activeOnly: z.boolean().default(true),
    }))
    .query(async ({ input, ctx }) => {
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view conditions for this patient" });
      }
      
      return await getPatientConditions(patientId, input.activeOnly);
    }),

  removeCondition: protectedProcedure
    .input(z.object({
      conditionId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const condition = await getMedicalConditionById(input.conditionId);
      if (!condition) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Condition not found" });
      }
      
      // Check authorization
      if (condition.patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to remove this condition" });
      }
      
      await deleteMedicalCondition(input.conditionId);
      return { success: true };
    }),

  /**
   * Personalized Drug Interaction Checking
   * This considers the patient's current medications AND medical conditions
   */
  checkPersonalizedInteractions: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      newMedication: z.string(), // new drug to check against patient's profile
    }))
    .mutation(async ({ input, ctx }) => {
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to check interactions for this patient" });
      }
      
      // Get patient's current medications
      const currentMeds = await getPatientMedications(patientId, true);
      const medNames = currentMeds.map(m => m.drugName);
      
      // Get patient's medical conditions
      const conditions = await getPatientConditions(patientId, true);
      const conditionNames = conditions.map(c => c.conditionName);
      
      // Build comprehensive prompt
      const prompt = `You are a clinical pharmacist expert. Analyze drug interactions with Iraqi medication context.

${IRAQI_MEDICAL_CONTEXT_PROMPT}

PATIENT PROFILE:
- Current Medications: ${medNames.length > 0 ? medNames.join(", ") : "None"}
- Medical Conditions: ${conditionNames.length > 0 ? conditionNames.join(", ") : "None"}

NEW MEDICATION TO CHECK: ${input.newMedication}

Analyze for:
1. Drug-Drug Interactions (with current medications)
2. Drug-Disease Interactions (with medical conditions)
3. Contraindications based on patient profile
4. Special precautions for Iraqi context

Provide structured JSON output with this exact format:
{
  "safe": boolean,
  "overallRisk": "low" | "moderate" | "high",
  "interactions": [
    {
      "type": "drug-drug" | "drug-disease",
      "with": "medication name or condition name",
      "severity": "minor" | "moderate" | "major" | "contraindicated",
      "mechanism": "explanation of interaction",
      "clinicalSignificance": "what this means for the patient",
      "management": "how to handle this",
      "alternatives": ["alternative medication 1", "alternative medication 2"]
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "monitoring": ["what to monitor 1", "what to monitor 2"],
  "warnings": ["warning 1", "warning 2"]
}`;

      const response = await invokeDeepSeek({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Check ${input.newMedication} for this patient` }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Log this check
      await logDrugInteractionCheck({
        userId: patientId,
        performedBy: ctx.user.id,
        medicationsChecked: JSON.stringify([...medNames, input.newMedication]),
        conditionsConsidered: JSON.stringify(conditionNames),
        interactionsFound: result.interactions?.length || 0,
        highestSeverity: result.interactions?.length > 0 
          ? result.interactions.reduce((max: string, curr: any) => {
              const severityOrder = ["none", "minor", "moderate", "major", "contraindicated"];
              return severityOrder.indexOf(curr.severity) > severityOrder.indexOf(max) ? curr.severity : max;
            }, "none")
          : "none",
        overallRisk: result.overallRisk || "low",
        fullResults: JSON.stringify(result),
      });
      
      return result;
    }),

  /**
   * Get interaction check history
   */
  getInteractionHistory: protectedProcedure
    .input(z.object({
      patientId: z.number().optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to view interaction history for this patient" });
      }
      
      return await getUserInteractionChecks(patientId, input.limit);
    }),

  /**
   * Medicine Image Recognition
   * Upload and identify medicine from box/strip photo
   */
  uploadMedicineImage: protectedProcedure
    .input(z.object({
      imageBase64: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate image type
      if (!input.mimeType.startsWith("image/")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image type" });
      }
      
      // Upload to S3
      const buffer = Buffer.from(input.imageBase64, "base64");
      const fileKey = `medicine-images/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${input.mimeType.split("/")[1]}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      
      // Save to database
      const imageId = await saveMedicineImage({
        userId: ctx.user.id,
        imageUrl: url,
        imageKey: fileKey,
        fileSize: buffer.length,
        mimeType: input.mimeType,
        identificationStatus: "pending",
      });
      
      return { success: true, imageId, imageUrl: url };
    }),

  identifyMedicine: protectedProcedure
    .input(z.object({
      imageId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const image = await getMedicineImageById(input.imageId);
      if (!image) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }
      
      // Check authorization
      if (image.userId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to identify this image" });
      }
      
      // Use AI to identify the medicine from the image
      const prompt = `You are a pharmaceutical expert specializing in Iraqi medications. Analyze this medicine box/strip image and identify:

${IRAQI_MEDICAL_CONTEXT_PROMPT}

Extract the following information:
1. Drug name (generic name)
2. Brand name
3. Dosage (e.g., 500mg, 10mg)
4. Form (tablet, capsule, syrup, etc.)
5. Manufacturer
6. Any visible warnings or instructions

Provide structured JSON output:
{
  "identified": boolean,
  "confidence": number (0-100),
  "drugName": "generic name",
  "brandName": "brand name",
  "dosage": "dosage with unit",
  "form": "tablet|capsule|syrup|injection|etc",
  "manufacturer": "company name",
  "extractedText": "all visible text on the package",
  "warnings": ["warning 1", "warning 2"],
  "instructions": "usage instructions if visible"
}

If the image is unclear or not a medicine package, set "identified" to false and explain why in "extractedText".`;

      try {
        // Note: DeepSeek doesn't support image analysis yet, so we'll use a text-based approach
        // In production, you would use a vision model like GPT-4V or Gemini
        const response = await invokeDeepSeek({
          messages: [
            { 
              role: "system", 
              content: prompt
            },
            {
              role: "user",
              content: `Analyze the medicine image at URL: ${image.imageUrl}. Note: This is a placeholder - actual image analysis would require a vision model.`
            }
          ],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        // Update the image record with identification results
        await updateMedicineImage(input.imageId, {
          identificationStatus: result.identified ? "identified" : "failed",
          identifiedDrugName: result.drugName,
          identifiedGenericName: result.drugName,
          identifiedBrandName: result.brandName,
          identifiedDosage: result.dosage,
          identificationConfidence: result.confidence,
          extractedText: result.extractedText,
          lastProcessedAt: new Date(),
          processingAttempts: (image.processingAttempts || 0) + 1,
        });
        
        return {
          success: true,
          ...result,
        };
      } catch (error: any) {
        // Update with error
        await updateMedicineImage(input.imageId, {
          identificationStatus: "failed",
          errorMessage: error.message,
          lastProcessedAt: new Date(),
          processingAttempts: (image.processingAttempts || 0) + 1,
        });
        
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to identify medicine: " + error.message 
        });
      }
    }),

  getMyMedicineImages: protectedProcedure
    .query(async ({ ctx }) => {
      return await getUserMedicineImages(ctx.user.id);
    }),

  addMedicationFromImage: protectedProcedure
    .input(z.object({
      imageId: z.number(),
      patientId: z.number().optional(),
      frequency: z.string().optional(),
      purpose: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const image = await getMedicineImageById(input.imageId);
      if (!image) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }
      
      if (image.identificationStatus !== "identified") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Medicine not yet identified" });
      }
      
      const patientId = input.patientId || ctx.user.id;
      
      // Check authorization
      if (patientId !== ctx.user.id && !["clinician", "doctor", "admin"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to add medications for this patient" });
      }
      
      // Add medication to patient's record
      const medicationId = await addPatientMedication({
        patientId,
        drugName: image.identifiedDrugName || "Unknown",
        genericName: image.identifiedGenericName,
        brandName: image.identifiedBrandName,
        dosage: image.identifiedDosage,
        frequency: input.frequency,
        purpose: input.purpose,
        source: "self_reported",
        identifiedFromImage: true,
        medicineImageId: input.imageId,
        isActive: true,
      });
      
      return { success: true, medicationId };
    }),
});
