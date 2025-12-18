import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeDeepSeek, deepMedicalReasoning } from "./_core/deepseek";
import {
  createCase,
  getCaseById,
  getCasesByClinicianId,
  getAllActiveCases,
  updateCaseStatus,
  saveVitals,
  getVitalsByCaseId,
  saveDiagnosis,
  getDiagnosesByCaseId,
  saveClinicalNote,
  getClinicalNotesByCaseId,
  searchMedications,
  getMedicationById,
  searchFacilities,
  getEmergencyFacilities,
  addFacility,
} from "./clinical-db";

export const clinicalRouter = router({
  // Case Management
  createCase: protectedProcedure
    .input(z.object({
      patientName: z.string(),
      patientAge: z.number().optional(),
      patientGender: z.enum(["male", "female", "other"]).optional(),
      chiefComplaint: z.string(),
      urgency: z.enum(["emergency", "urgent", "semi-urgent", "non-urgent", "routine"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const caseId = await createCase({
        ...input,
        clinicianId: ctx.user.id,
      });

      return { caseId };
    }),

  getCase: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input.id);
      
      if (!caseData) {
        throw new Error('Case not found');
      }

      if (ctx.user.role !== 'admin' && caseData.clinicianId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      return caseData;
    }),

  getMyCases: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    return await getCasesByClinicianId(ctx.user.id);
  }),

  getAllCases: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    return await getAllActiveCases();
  }),

  updateCaseStatus: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      status: z.enum(["active", "completed", "archived"]),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      await updateCaseStatus(input.caseId, input.status);
      return { success: true };
    }),

  // Vitals Management
  saveVitals: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      bloodPressureSystolic: z.number().optional(),
      bloodPressureDiastolic: z.number().optional(),
      heartRate: z.number().optional(),
      temperature: z.string().optional(),
      oxygenSaturation: z.number().optional(),
      respiratoryRate: z.number().optional(),
      weight: z.string().optional(),
      height: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const vitalsId = await saveVitals(input);
      return { vitalsId };
    }),

  getVitals: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      return await getVitalsByCaseId(input.caseId);
    }),

  // Clinical Reasoning Engine
  generateDifferentialDiagnosis: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      chiefComplaint: z.string(),
      symptoms: z.array(z.string()),
      vitals: z.object({
        bloodPressure: z.string().optional(),
        heartRate: z.number().optional(),
        temperature: z.string().optional(),
        oxygenSaturation: z.number().optional(),
      }).optional(),
      patientAge: z.number().optional(),
      patientGender: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // Use DeepSeek for advanced medical reasoning
      const reasoning = await deepMedicalReasoning({
        symptoms: input.symptoms,
        history: `Chief Complaint: ${input.chiefComplaint}. Age: ${input.patientAge || 'unknown'}. Gender: ${input.patientGender || 'unknown'}.`,
        vitalSigns: input.vitals ? {
          bloodPressure: input.vitals.bloodPressure || '',
          heartRate: input.vitals.heartRate?.toString() || '',
          temperature: input.vitals.temperature || '',
          oxygenSaturation: input.vitals.oxygenSaturation?.toString() || '',
        } : undefined,
      });

      // Save top diagnoses to database
      for (let i = 0; i < reasoning.differentialDiagnosis.length; i++) {
        const diagnosis = reasoning.differentialDiagnosis[i];
        await saveDiagnosis({
          caseId: input.caseId,
          diagnosis: diagnosis,
          probability: Math.max(0, 100 - (i * 15)), // Decreasing probability
          reasoning: reasoning.reasoning,
          redFlags: JSON.stringify([]),
          recommendedActions: JSON.stringify(reasoning.recommendedTests),
        });
      }

      return reasoning;
    }),

  getDiagnoses: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const diagnoses = await getDiagnosesByCaseId(input.caseId);
      return diagnoses.map(d => ({
        ...d,
        redFlags: d.redFlags ? JSON.parse(d.redFlags) : [],
        recommendedActions: d.recommendedActions ? JSON.parse(d.recommendedActions) : [],
      }));
    }),

  // Clinical Notes (Live Scribe)
  saveClinicalNote: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      noteType: z.enum(["history", "examination", "assessment", "plan", "scribe"]),
      content: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const noteId = await saveClinicalNote({
        ...input,
        createdBy: ctx.user.id,
      });

      return { noteId };
    }),

  getClinicalNotes: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      return await getClinicalNotesByCaseId(input.caseId);
    }),

  // PharmaGuard - Drug Interaction Checker
  searchMedications: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await searchMedications(input.query);
    }),

  checkDrugInteractions: protectedProcedure
    .input(z.object({
      medications: z.array(z.number()), // medication IDs
    }))
    .mutation(async ({ input }) => {
      const meds = await Promise.all(
        input.medications.map(id => getMedicationById(id))
      );

      // Use DeepSeek to analyze interactions
      const medNames = meds.filter(m => m !== null).map(m => m!.name);
      
      const response = await invokeDeepSeek({
        messages: [
          {
            role: 'system',
            content: 'You are a clinical pharmacist expert. Analyze drug interactions and provide clear warnings.',
          },
          {
            role: 'user',
            content: `Analyze potential drug-drug interactions for these medications: ${medNames.join(', ')}. Provide: 1) Severity level (major/moderate/minor), 2) Interaction mechanism, 3) Clinical recommendations.`,
          },
        ],
      });

      return {
        medications: meds,
        analysis: response.choices[0]?.message?.content || '',
      };
    }),

  // Care Locator (Iraq-specific)
  searchFacilities: protectedProcedure
    .input(z.object({
      type: z.enum(["hospital", "clinic", "emergency", "specialist"]).optional(),
      city: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await searchFacilities(input.type, input.city);
    }),

  getEmergencyFacilities: protectedProcedure.query(async () => {
    return await getEmergencyFacilities();
  }),

  // Seed Iraqi facilities (admin only)
  seedIraqiFacilities: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const iraqiFacilities = [
      {
        name: "مستشفى الشيخ زايد (Sheikh Zayed Hospital)",
        type: "hospital" as const,
        address: "Baghdad, Al-Mansour District",
        phone: "+964 1 542 0000",
        specialties: "General Surgery, Cardiology, Neurology",
        emergencyServices: 1,
      },
      {
        name: "مستشفى اليرموك التعليمي (Yarmouk Teaching Hospital)",
        type: "hospital" as const,
        address: "Baghdad, Yarmouk",
        phone: "+964 1 543 1234",
        specialties: "Emergency Medicine, Trauma, General Medicine",
        emergencyServices: 1,
      },
      {
        name: "مستشفى البصرة التعليمي (Basra Teaching Hospital)",
        type: "hospital" as const,
        address: "Basra City Center",
        phone: "+964 40 123 4567",
        specialties: "General Medicine, Pediatrics, Obstetrics",
        emergencyServices: 1,
      },
      {
        name: "مستشفى روژهەڵات (Rojhalat Hospital)",
        type: "hospital" as const,
        address: "Erbil, 100 Meter Street",
        phone: "+964 66 123 4567",
        specialties: "Cardiology, Orthopedics, General Surgery",
        emergencyServices: 1,
      },
      {
        name: "مستشفى الموصل العام (Mosul General Hospital)",
        type: "hospital" as const,
        address: "Mosul, Left Bank",
        phone: "+964 60 123 4567",
        specialties: "Emergency, Trauma, General Medicine",
        emergencyServices: 1,
      },
      {
        name: "مستشفى الصدر التعليمي (Al-Sadr Teaching Hospital)",
        type: "hospital" as const,
        address: "Najaf, Old City",
        phone: "+964 33 123 4567",
        specialties: "Cardiology, Pulmonology, Internal Medicine",
        emergencyServices: 1,
      },
    ];

    for (const facility of iraqiFacilities) {
      await addFacility(facility);
    }

    return { success: true, count: iraqiFacilities.length };
  }),
});
