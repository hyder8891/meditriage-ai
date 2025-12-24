import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { makeRequest } from "./_core/map";
import { invokeDeepSeek, deepMedicalReasoning } from "./_core/deepseek";
import { brain } from "./brain/index";
import { IRAQI_MEDICAL_CONTEXT_PROMPT } from "@shared/iraqiMedicalContext";
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
  createTimelineEvent,
  getTimelineEventsByCaseId,
  getTimelineEventsByType,
  deleteTimelineEvent,
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

      // Use BRAIN engine for comprehensive medical reasoning
      const brainResult = await brain.reason({
        symptoms: input.symptoms,
        patientInfo: {
          age: input.patientAge || 30,
          gender: (input.patientGender as 'male' | 'female' | 'other') || 'other',
          location: 'Iraq',
        },
        vitalSigns: input.vitals ? {
          bloodPressure: parseFloat(input.vitals.bloodPressure?.split('/')[0] || '0'),
          heartRate: input.vitals.heartRate || 0,
          temperature: parseFloat(input.vitals.temperature || '0'),
          oxygenSaturation: input.vitals.oxygenSaturation || 0,
        } : undefined,
        language: 'en',
      });

      // Format BRAIN output to match expected reasoning structure
      const reasoning = {
        differentialDiagnosis: brainResult.diagnosis.differentialDiagnosis.map((dx: any) => ({
          condition: dx.condition,
          probability: dx.probability,
          reasoning: dx.reasoning,
          keyFindings: dx.supportingEvidence,
        })),
        recommendedTests: brainResult.diagnosis.recommendations.tests,
        urgencyLevel: brainResult.diagnosis.redFlags.length > 0 ? 'urgent' : 'routine',
        redFlags: brainResult.diagnosis.redFlags,
        clinicalPearls: brainResult.diagnosis.recommendations.immediateActions,
        citations: brainResult.evidence.map((e: any) => `${e.title} (${e.source})`),
      };

      // Save top diagnoses to database
      for (const diagnosisItem of reasoning.differentialDiagnosis.slice(0, 5)) {
        await saveDiagnosis({
          caseId: input.caseId,
          diagnosis: diagnosisItem.condition,
          probability: diagnosisItem.probability,
          reasoning: diagnosisItem.reasoning,
          redFlags: JSON.stringify(reasoning.redFlags),
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
            content: `You are a clinical pharmacist expert. Analyze drug interactions with Iraqi medication context.

${IRAQI_MEDICAL_CONTEXT_PROMPT}
            
Provide structured JSON output with this exact format:
            {
              "interactions": [
                {
                  "drugs": ["Drug A", "Drug B"],
                  "severity": "contraindicated|major|moderate|minor",
                  "severityScore": 8,
                  "mechanism": "detailed explanation of interaction mechanism",
                  "clinicalSignificance": "what this means for the patient",
                  "timeToOnset": "immediate|hours|days|weeks",
                  "management": "how to manage this interaction",
                  "alternatives": ["alternative medication options with rationale"],
                  "timing": "timing recommendations if applicable",
                  "dosageAdjustment": "specific dosage modifications if needed",
                  "monitoringParameters": [
                    {
                      "parameter": "vital sign or lab test",
                      "frequency": "how often to monitor",
                      "targetRange": "normal range or goal"
                    }
                  ],
                  "patientCounseling": "key points to tell the patient",
                  "references": ["medical literature citations"]
                }
              ],
              "overallRisk": "high|moderate|low",
              "overallRiskScore": 7,
              "recommendations": ["specific clinical recommendations"],
              "monitoring": ["what to monitor"],
              "foodInteractions": [
                {
                  "food": "food or beverage name",
                  "interaction": "description of interaction",
                  "recommendation": "how to avoid or manage"
                }
              ],
              "costEffectiveness": "analysis of cost vs alternatives in Iraqi market",
              "availabilityNotes": "notes on medication availability in Iraq"
            }`,
          },
          {
            role: 'user',
            content: `Analyze drug-drug interactions for: ${medNames.join(', ')}. Consider Iraqi medication availability and common formulations.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch (e) {
        // Fallback if JSON parsing fails
        return {
          interactions: [],
          overallRisk: 'low',
          recommendations: ['Unable to parse interaction data. Please verify medications manually.'],
          monitoring: [],
          foodInteractions: [],
          analysis: content,
        };
      }
    }),

  // Care Locator (Iraq-specific)
  searchFacilities: protectedProcedure
    .input(z.object({
      type: z.enum(["hospital", "clinic", "emergency", "specialist"]).or(z.literal("")).optional(),
      city: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const facilityType = (input.type === "" || !input.type) 
        ? undefined 
        : (input.type as "hospital" | "clinic" | "emergency" | "specialist");
      return await searchFacilities(facilityType, input.city);
    }),

  // Search real hospitals using Google Places API
  searchRealFacilities: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
      radius: z.number().optional().default(10000), // 10km default
      type: z.enum(["hospital", "clinic", "emergency", "specialist"]).optional(),
    }))
    .query(async ({ input }) => {
      const { query, location, radius, type } = input;
      
      // Map facility type to Google Places types
      const placeTypeMap: Record<string, string> = {
        hospital: "hospital",
        clinic: "doctor|health",
        emergency: "hospital",
        specialist: "doctor",
      };
      
      let searchQuery = query;
      if (!searchQuery && location) {
        // If no query provided, search by type and location
        const typeKeywords: Record<string, string> = {
          hospital: "hospital",
          clinic: "clinic",
          emergency: "emergency hospital",
          specialist: "specialist doctor",
        };
        searchQuery = `${type ? typeKeywords[type] : "hospital"} in Iraq`;
      }
      
      try {
        interface PlacesSearchResult {
          results: Array<{
            place_id: string;
            name: string;
            formatted_address: string;
            geometry: {
              location: { lat: number; lng: number };
            };
            rating?: number;
            user_ratings_total?: number;
            opening_hours?: {
              open_now?: boolean;
              weekday_text?: string[];
            };
            photos?: Array<{
              photo_reference: string;
              height: number;
              width: number;
            }>;
            types: string[];
          }>;
          status: string;
        }
        
        const params: Record<string, unknown> = {
          query: searchQuery,
        };
        
        if (location) {
          params.location = `${location.lat},${location.lng}`;
          params.radius = radius;
        }
        
        const result = await makeRequest<PlacesSearchResult>(
          "/maps/api/place/textsearch/json",
          params
        );
        
        if (result.status !== "OK" && result.status !== "ZERO_RESULTS") {
          throw new Error(`Places API error: ${result.status}`);
        }
        
        return result.results.map((place) => ({
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat.toString(),
          longitude: place.geometry.location.lng.toString(),
          rating: place.rating?.toString(),
          phone: null, // Will be fetched in details
          hours: place.opening_hours?.open_now !== undefined 
            ? (place.opening_hours.open_now ? "Open now" : "Closed")
            : null,
          services: null,
          specialties: null,
          website: null,
          type: type || "hospital",
          city: null,
          emergencyServices: type === "emergency" ? 1 : 0,
          photoReference: place.photos?.[0]?.photo_reference,
          types: place.types,
        }));
      } catch (error) {
        console.error("Error searching facilities:", error);
        throw new Error(`Failed to search facilities: ${error}`);
      }
    }),

  // Get detailed facility information from Google Places
  getFacilityDetails: protectedProcedure
    .input(z.object({
      placeId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        interface PlaceDetailsResult {
          result: {
            place_id: string;
            name: string;
            formatted_address: string;
            formatted_phone_number?: string;
            international_phone_number?: string;
            website?: string;
            rating?: number;
            user_ratings_total?: number;
            opening_hours?: {
              open_now?: boolean;
              weekday_text?: string[];
              periods?: Array<{
                open: { day: number; time: string };
                close?: { day: number; time: string };
              }>;
            };
            geometry: {
              location: { lat: number; lng: number };
            };
            photos?: Array<{
              photo_reference: string;
              height: number;
              width: number;
            }>;
            reviews?: Array<{
              author_name: string;
              rating: number;
              text: string;
              time: number;
            }>;
            types: string[];
          };
          status: string;
        }
        
        const result = await makeRequest<PlaceDetailsResult>(
          "/maps/api/place/details/json",
          {
            place_id: input.placeId,
            fields: "name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,opening_hours,geometry,photos,reviews,types",
          }
        );
        
        if (result.status !== "OK") {
          throw new Error(`Place Details API error: ${result.status}`);
        }
        
        const place = result.result;
        return {
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat.toString(),
          longitude: place.geometry.location.lng.toString(),
          phone: place.formatted_phone_number || place.international_phone_number,
          website: place.website,
          rating: place.rating?.toString(),
          hours: place.opening_hours?.weekday_text?.join(", "),
          openNow: place.opening_hours?.open_now,
          photos: place.photos?.map(p => p.photo_reference),
          reviews: place.reviews?.slice(0, 5).map(r => ({
            author: r.author_name,
            rating: r.rating,
            text: r.text,
            date: new Date(r.time * 1000).toLocaleDateString(),
          })),
          types: place.types,
        };
      } catch (error) {
        console.error("Error fetching facility details:", error);
        throw new Error(`Failed to fetch facility details: ${error}`);
      }
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

  getVitalsByCaseId: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await getVitalsByCaseId(input.caseId);
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

  // Upload audio file to S3 and return URL
  uploadAudioFile: protectedProcedure
    .input(z.object({
      audioBase64: z.string(),
      mimeType: z.string(),
      filename: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { storagePut } = await import("./storage");
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(input.audioBase64, 'base64');
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileKey = `audio/${ctx.user.id}/${timestamp}-${input.filename}`;
      
      // Upload to S3
      const { url } = await storagePut(fileKey, audioBuffer, input.mimeType);
      
      return { url, fileKey };
    }),

  transcribeAudio: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().default("en"),
    }))
    .mutation(async ({ input }) => {
      // Import Whisper transcription
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

  // Smart Clinical Notes Generator: Convert transcription to SOAP format
  generateSOAPNote: protectedProcedure
    .input(z.object({
      transcriptionText: z.string(),
      patientName: z.string().optional(),
      patientAge: z.number().optional(),
      patientGender: z.string().optional(),
      chiefComplaint: z.string().optional(),
      vitals: z.object({
        bloodPressure: z.string().optional(),
        heartRate: z.number().optional(),
        temperature: z.number().optional(),
        respiratoryRate: z.number().optional(),
        oxygenSaturation: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const patientInfo = input.patientName 
        ? `Patient: ${input.patientName}${input.patientAge ? `, Age: ${input.patientAge}` : ''}${input.patientGender ? `, Gender: ${input.patientGender}` : ''}`
        : '';
      
      const chiefComplaintInfo = input.chiefComplaint 
        ? `Chief Complaint: ${input.chiefComplaint}`
        : '';
      
      const vitalsInfo = input.vitals 
        ? `Vitals: BP ${input.vitals.bloodPressure || 'N/A'}, HR ${input.vitals.heartRate || 'N/A'}, Temp ${input.vitals.temperature || 'N/A'}°C, RR ${input.vitals.respiratoryRate || 'N/A'}, SpO2 ${input.vitals.oxygenSaturation || 'N/A'}%`
        : '';

      const systemPrompt = `You are a medical documentation expert specializing in Iraqi healthcare. Convert clinical transcriptions into structured, professional SOAP notes with excellent visual organization.

**SOAP Note Structure:**

# SOAP Note

**Date:** [Current date and time]
**Documentation Status:** ✅ Complete / ⚠️ Partial / ❌ Incomplete (assess based on available data)

---

## S - SUBJECTIVE

### Chief Complaint
> "[Patient's exact words describing main concern]"

### History of Present Illness

| Aspect | Details | Status |
|--------|---------|--------|
| **Onset** | [When symptoms started] | ✅ / ⚠️ / ❌ |
| **Duration** | [How long symptoms lasted] | ✅ / ⚠️ / ❌ |
| **Location** | [Where the problem is] | ✅ / ⚠️ / ❌ |
| **Quality** | [Character of symptom] | ✅ / ⚠️ / ❌ |
| **Severity** | [Scale 1-10 or mild/moderate/severe] | ✅ / ⚠️ / ❌ |
| **Context** | [What makes it better/worse] | ✅ / ⚠️ / ❌ |
| **Associated Symptoms** | [Other related symptoms] | ✅ / ⚠️ / ❌ |
| **Modifying Factors** | [Aggravating/relieving factors] | ✅ / ⚠️ / ❌ |

### Relevant Medical History

**Past Medical History:**
- [List conditions with diagnosis dates if known]
- Use ❌ if no history mentioned

**Current Medications:**

| Medication | Dose | Frequency | Duration |
|------------|------|-----------|----------|
| [Drug name] | [Dose] | [Frequency] | [Duration] |

*Use "⚠️ Not reported" if medications not discussed*

**Allergies:**
- [Allergen]: [Reaction]
- Or: ✅ No known drug allergies (NKDA)
- Or: ⚠️ Not assessed

---

## O - OBJECTIVE

### Vital Signs

| Parameter | Value | Status | Reference Range |
|-----------|-------|--------|------------------|
| **Blood Pressure** | [Value] mmHg | ✅ Normal / ⚠️ Abnormal / ❌ Not recorded | 90-120/60-80 |
| **Heart Rate** | [Value] bpm | ✅ Normal / ⚠️ Abnormal / ❌ Not recorded | 60-100 |
| **Temperature** | [Value]°C | ✅ Normal / ⚠️ Abnormal / ❌ Not recorded | 36.5-37.5 |
| **Respiratory Rate** | [Value] /min | ✅ Normal / ⚠️ Abnormal / ❌ Not recorded | 12-20 |
| **Oxygen Saturation** | [Value]% | ✅ Normal / ⚠️ Abnormal / ❌ Not recorded | >95% |

### Physical Examination

**General Appearance:**
[Description of patient's overall appearance and distress level]

**System-by-System Findings:**

| System | Findings | Status |
|--------|----------|--------|
| **Cardiovascular** | [Findings] | ✅ Examined / ⚠️ Limited / ❌ Not examined |
| **Pulmonary** | [Findings] | ✅ Examined / ⚠️ Limited / ❌ Not examined |
| **Abdominal** | [Findings] | ✅ Examined / ⚠️ Limited / ❌ Not examined |
| **Neurological** | [Findings] | ✅ Examined / ⚠️ Limited / ❌ Not examined |
| **Musculoskeletal** | [Findings] | ✅ Examined / ⚠️ Limited / ❌ Not examined |

### Laboratory & Imaging

**Laboratory Results:**

| Test | Result | Status | Reference Range |
|------|--------|--------|------------------|
| [Test name] | [Value] | ✅ Normal / ⚠️ Abnormal | [Range] |

*Use "⚠️ Pending" or "❌ Not ordered" if no results available*

**Imaging Studies:**
- [Study type]: [Findings]
- Or: ⚠️ Pending / ❌ Not ordered

---

## A - ASSESSMENT

### Primary Diagnosis
**[Diagnosis Name]**  
📋 ICD-10: [Code]  
🎯 Confidence: High/Medium/Low ([Percentage]%)

**Clinical Reasoning:**
[Explain why this is the primary diagnosis based on S and O findings]

---

### Differential Diagnoses

| Rank | Diagnosis | ICD-10 | Likelihood | Supporting Factors | Against Factors |
|------|-----------|--------|------------|--------------------|-----------------|
| 1 | [Diagnosis] | [Code] | High | [Factors] | [Factors] |
| 2 | [Diagnosis] | [Code] | Medium | [Factors] | [Factors] |
| 3 | [Diagnosis] | [Code] | Low | [Factors] | [Factors] |

---

### Severity Assessment
- **Severity Level:** Mild / Moderate / Severe / Critical
- **Urgency:** Routine / Urgent / Emergent
- **Risk Factors:** [List complications risks]

---

### Red Flags
⚠️ **Critical Findings:**
- [List any red flags]

Or: ✅ **No red flags identified**

---

## P - PLAN

### 1. Immediate Management

**Medications:**

| Medication | Indication | Dose | Route | Frequency | Duration |
|------------|------------|------|-------|-----------|----------|
| [Drug] | [Indication] | [Dose] | PO/IV/IM | [Frequency] | [Duration] |

**Procedures/Interventions:**
- [Procedure]: [Details]
- Or: ❌ None required

---

### 2. Investigations Ordered

**Laboratory Tests:**
- [ ] [Test name] - Reason: [Reason]

**Imaging Studies:**
- [ ] [Study] - Reason: [Reason]

**Consultations:**
- [ ] [Specialty] - Reason: [Reason]

Or: ❌ No additional investigations needed

---

### 3. Follow-up Plan

**Next Appointment:** [Timeframe]  
**Purpose:** [Reason]

**Return Precautions - Seek immediate care if:**
🚨 [Warning sign 1]  
🚨 [Warning sign 2]  
🚨 [Warning sign 3]

---

### 4. Patient Education

**Condition Explanation:**
[Brief patient-friendly explanation]

**Self-Care Instructions:**
- [Instruction 1]
- [Instruction 2]

**Lifestyle Modifications:**
- Diet: [Recommendations]
- Activity: [Recommendations]
- Restrictions: [Any restrictions]

---

**FORMATTING RULES:**
1. Use status indicators: ✅ (confirmed/normal), ⚠️ (abnormal/partial), ❌ (missing/not done)
2. Use tables for structured data (vitals, medications, labs, differentials)
3. Use horizontal rules (---) to separate major sections
4. Use blockquotes (>) for chief complaint
5. Use emoji for visual markers (📋 🎯 🚨)
6. Mark data status clearly - never assume data that wasn't provided
7. If information is missing, explicitly mark it as ⚠️ or ❌
8. Consider Iraqi healthcare context (common diseases, available medications)
9. Use proper medical terminology
10. Be professional and concise`;

      const userPrompt = `${patientInfo ? patientInfo + '\n' : ''}${chiefComplaintInfo ? chiefComplaintInfo + '\n' : ''}${vitalsInfo ? vitalsInfo + '\n' : ''}\n\nTranscription:\n${input.transcriptionText}\n\nGenerate a complete SOAP note from this transcription.`;

      const response = await invokeDeepSeek({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const soapNote = response.choices[0]?.message?.content || '';

      return {
        soapNote,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Case Timeline: Get timeline events for a case
  getCaseTimeline: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await getTimelineEventsByCaseId(input.caseId);
    }),

  getTimelineByType: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      eventType: z.string(),
    }))
    .query(async ({ input }) => {
      return await getTimelineEventsByType(input.caseId, input.eventType);
    }),

  createTimelineEvent: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      eventType: z.enum([
        "symptom",
        "vital_signs",
        "diagnosis",
        "treatment",
        "medication",
        "procedure",
        "lab_result",
        "imaging",
        "note",
      ]),
      title: z.string(),
      description: z.string().optional(),
      eventData: z.any().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      eventTime: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const eventId = await createTimelineEvent({
        ...input,
        recordedBy: ctx.user.id,
      });
      return { eventId };
    }),

  deleteTimelineEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTimelineEvent(input.eventId);
      return { success: true };
    }),

  // Appointment Management
  createAppointment: publicProcedure
    .input(z.object({
      patientId: z.number(),
      facilityId: z.number().optional(),
      facilityName: z.string().optional(),
      facilityAddress: z.string().optional(),
      clinicianId: z.number().optional(),
      appointmentDate: z.date(),
      duration: z.number().default(30),
      appointmentType: z.enum(["consultation", "follow_up", "emergency", "screening", "vaccination", "other"]).default("consultation"),
      chiefComplaint: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { createAppointment, checkAppointmentConflicts } = await import("./appointment-db");
      
      // Check for conflicts if clinician is assigned
      if (input.clinicianId) {
        const conflicts = await checkAppointmentConflicts(
          input.clinicianId,
          input.appointmentDate,
          input.duration
        );
        
        if (conflicts.length > 0) {
          throw new Error("Appointment time conflicts with existing appointment");
        }
      }
      
      const appointmentId = await createAppointment(input);
      return { appointmentId };
    }),

  getAppointmentsByPatient: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const { getAppointmentsByPatientId } = await import("./appointment-db");
      return getAppointmentsByPatientId(input.patientId);
    }),

  getAppointmentsByClinician: protectedProcedure
    .input(z.object({ clinicianId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const { getAppointmentsByClinicianId } = await import("./appointment-db");
      return getAppointmentsByClinicianId(input.clinicianId);
    }),

  getAppointmentsByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      clinicianId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const { getAppointmentsByDateRange, getAppointmentsByClinicianAndDateRange } = await import("./appointment-db");
      
      if (input.clinicianId) {
        return getAppointmentsByClinicianAndDateRange(
          input.clinicianId,
          input.startDate,
          input.endDate
        );
      }
      
      return getAppointmentsByDateRange(input.startDate, input.endDate);
    }),

  getAllAppointments: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const { getAllAppointments } = await import("./appointment-db");
      return getAllAppointments();
    }),

  updateAppointmentStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
    }))
    .mutation(async ({ input }) => {
      const { updateAppointmentStatus } = await import("./appointment-db");
      await updateAppointmentStatus(input.id, input.status);
      return { success: true };
    }),

  cancelAppointment: publicProcedure
    .input(z.object({
      appointmentId: z.number(),
      cancelledBy: z.number(),
      cancellationReason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { cancelAppointment } = await import("./appointment-db");
      await cancelAppointment(
        input.appointmentId,
        input.cancelledBy,
        input.cancellationReason
      );
      return { success: true };
    }),

  rescheduleAppointment: publicProcedure
    .input(z.object({
      appointmentId: z.number(),
      newDate: z.date(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getAppointmentById, updateAppointment, checkAppointmentConflicts } = await import("./appointment-db");
      
      const appointment = await getAppointmentById(input.appointmentId);
      if (!appointment) {
        throw new Error("Appointment not found");
      }
      
      // Check for conflicts if clinician is assigned
      if (appointment.clinicianId) {
        const conflicts = await checkAppointmentConflicts(
          appointment.clinicianId,
          input.newDate,
          input.duration || appointment.duration || 30,
          input.appointmentId
        );
        
        if (conflicts.length > 0) {
          throw new Error("New appointment time conflicts with existing appointment");
        }
      }
      
      await updateAppointment(input.appointmentId, {
        appointmentDate: input.newDate,
        ...(input.duration && { duration: input.duration }),
      });
      
      return { success: true };
    }),

  // Prescription Management
  createPrescription: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      medicationName: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.number(),
      instructions: z.string().optional(),
      startDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const { createPrescription } = await import("./prescription-db");
      const prescriptionId = await createPrescription({
        ...input,
        clinicianId: ctx.user.id,
      });
      return { prescriptionId };
    }),

  getAllPrescriptions: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const { getAllPrescriptions } = await import("./prescription-db");
      return getAllPrescriptions();
    }),

  getPrescriptionsByPatient: publicProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const { getPrescriptionsByPatientId } = await import("./prescription-db");
      return getPrescriptionsByPatientId(input.patientId);
    }),

  updateMedicationAdherence: publicProcedure
    .input(z.object({
      prescriptionId: z.number(),
      patientId: z.number(),
      taken: z.boolean(),
      takenAt: z.date().optional(),
      scheduledTime: z.date(),
    }))
    .mutation(async ({ input }) => {
      const { recordMedicationAdherence } = await import("./prescription-db");
      await recordMedicationAdherence({
        prescriptionId: input.prescriptionId,
        patientId: input.patientId,
        taken: input.taken,
        takenAt: input.takenAt || new Date(),
        scheduledTime: input.scheduledTime,
      });
      return { success: true };
    }),

  // Messaging procedures
  sendMessage: protectedProcedure
    .input(z.object({
      senderId: z.number(),
      recipientId: z.number(),
      subject: z.string().optional(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { sendMessage } = await import("./messaging-db");
      return sendMessage(input);
    }),

  getMessagesBySender: protectedProcedure
    .input(z.object({ senderId: z.number() }))
    .query(async ({ input }) => {
      const { getMessagesBySender } = await import("./messaging-db");
      return getMessagesBySender(input.senderId);
    }),

  getMessagesByRecipient: protectedProcedure
    .input(z.object({ recipientId: z.number() }))
    .query(async ({ input }) => {
      const { getMessagesByRecipient } = await import("./messaging-db");
      return getMessagesByRecipient(input.recipientId);
    }),

  getMessagesBetweenUsers: protectedProcedure
    .input(z.object({ userId1: z.number(), userId2: z.number() }))
    .query(async ({ input }) => {
      const { getMessagesBetweenUsers } = await import("./messaging-db");
      return getMessagesBetweenUsers(input.userId1, input.userId2);
    }),

  markMessageAsRead: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input }) => {
      const { markMessageAsRead } = await import("./messaging-db");
      await markMessageAsRead(input.messageId);
      return { success: true };
    }),

  getUnreadMessageCount: protectedProcedure
    .input(z.object({ recipientId: z.number() }))
    .query(async ({ input }) => {
      const { getUnreadMessageCount } = await import("./messaging-db");
      return getUnreadMessageCount(input.recipientId);
    }),

  // Medication Reminders
  createMedicationReminders: protectedProcedure
    .input(z.object({ prescriptionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const { createMedicationReminders } = await import("./medication-reminders");
      return createMedicationReminders(input.prescriptionId);
    }),

  getUpcomingReminders: protectedProcedure
    .input(z.object({ 
      patientId: z.number(),
      hoursAhead: z.number().optional().default(24),
    }))
    .query(async ({ input }) => {
      const { getUpcomingReminders } = await import("./medication-reminders");
      return getUpcomingReminders(input.patientId, input.hoursAhead);
    }),

  processPendingReminders: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const { processPendingReminders } = await import("./medication-reminders");
      return processPendingReminders();
    }),
});
