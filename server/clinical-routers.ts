import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
  createTranscription,
  getTranscriptionById,
  getTranscriptionsByClinicianId,
  getTranscriptionsByCaseId,
  updateTranscription,
  deleteTranscription,
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

  // Patient symptom analysis
  patientSymptomAnalysis: publicProcedure
    .input(z.object({
      symptoms: z.string(),
    }))
    .mutation(async ({ input }: { input: { symptoms: string } }) => {
      // Use DeepSeek for patient-friendly symptom analysis
      const response = await invokeDeepSeek({
        messages: [
          {
            role: 'system',
            content: `You are a compassionate medical AI assistant helping patients understand their symptoms. Provide:
1. Urgency level (EMERGENCY, URGENT, SEMI-URGENT, NON-URGENT, ROUTINE)
2. Personalized care guide with clear next steps
3. Doctor communication script (how to describe symptoms to doctor)
4. Possible conditions (3-5 most likely)
5. Home care advice

Be empathetic, clear, and avoid medical jargon. Always encourage seeking professional care when appropriate.`,
          },
          {
            role: 'user',
            content: `Patient symptoms: ${input.symptoms}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';

      // Parse structured response
      const urgencyMatch = content.match(/urgency[:\s]*(emergency|urgent|semi-urgent|non-urgent|routine)/i);
      const urgencyLevel = urgencyMatch ? urgencyMatch[1].toUpperCase() : 'NON-URGENT';

      return {
        urgencyLevel,
        careGuide: content,
        doctorScript: `When speaking with your doctor, you can say: "${input.symptoms}"`,
        possibleConditions: [],
        homeCareAdvice: 'Rest, stay hydrated, and monitor your symptoms.',
      };
    }),

  // PharmaGuard: Drug interaction checkerr
  searchMedications: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await searchMedications(input.query);
    }),

  checkDrugInteractions: protectedProcedure
    .input(z.object({
      medications: z.array(z.string()), // medication names
    }))
    .mutation(async ({ input }) => {
      const medNames = input.medications;
      
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

      const content = response.choices[0]?.message?.content || '';
      
      return {
        interactions: [],
        recommendations: [],
        analysis: content,
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

  // Live Scribe: Voice transcription
  createTranscription: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      audioKey: z.string().optional(),
      audioUrl: z.string().optional(),
      duration: z.number().optional(),
      transcriptionText: z.string(),
      language: z.string().default("en"),
      speaker: z.enum(["clinician", "patient", "mixed"]).default("clinician"),
    }))
    .mutation(async ({ input, ctx }) => {
      const transcriptionId = await createTranscription({
        ...input,
        clinicianId: ctx.user.id,
      });
      return { transcriptionId };
    }),

  getTranscription: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getTranscriptionById(input.id);
    }),

  getMyTranscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      return await getTranscriptionsByClinicianId(ctx.user.id);
    }),

  getCaseTranscriptions: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await getTranscriptionsByCaseId(input.caseId);
    }),

  updateTranscription: protectedProcedure
    .input(z.object({
      id: z.number(),
      transcriptionText: z.string().optional(),
      status: z.enum(["draft", "final", "archived"]).optional(),
      savedToClinicalNotes: z.boolean().optional(),
      clinicalNoteId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await updateTranscription(id, updates);
      return { success: true };
    }),

  deleteTranscription: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTranscription(input.id);
      return { success: true };
    }),

  transcribeAudio: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().default("en"),
    }))
    .mutation(async ({ input }) => {
      // Import transcribeAudio from voice transcription helper
      const { transcribeAudio } = await import("./_core/voiceTranscription");
      
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language,
      });

      // Check if it's an error
      if ('error' in result) {
        throw new Error(result.error);
      }

      return {
        text: result.text,
        language: result.language,
        duration: result.duration,
      };
    }),
});
