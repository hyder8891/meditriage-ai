import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { analyzeClinicalPresentation, type PatientInfo } from "../clinical-reasoning";
import { getDb } from "../db";
import { differentialDiagnoses, triageRecords } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const vitalSignsSchema = z.object({
  heartRate: z.number().optional(),
  bloodPressure: z
    .object({
      systolic: z.number(),
      diastolic: z.number(),
    })
    .optional(),
  temperature: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  respiratoryRate: z.number().optional(),
});

const patientInfoSchema = z.object({
  complaints: z.string(),
  chiefComplaint: z.string(),
  age: z.number(),
  gender: z.enum(["male", "female", "other"]),
  vitalSigns: vitalSignsSchema,
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

export const clinicalReasoningRouter = router({
  /**
   * Analyze clinical presentation and generate differential diagnoses
   */
  analyze: protectedProcedure
    .input(
      z.object({
        patientInfo: patientInfoSchema,
        language: z.enum(["en", "ar"]).default("en"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { patientInfo, language } = input;

      // Perform clinical reasoning analysis
      const result = await analyzeClinicalPresentation(patientInfo as PatientInfo, language);

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Create triage record
      const [triageRecord] = await db.insert(triageRecords).values({
        userId: ctx.user.id,
        language,
        conversationHistory: JSON.stringify([]),
        urgencyLevel: result.urgencyAssessment.level,
        chiefComplaint: patientInfo.chiefComplaint,
        symptoms: JSON.stringify([patientInfo.complaints]),
        assessment: JSON.stringify(result),
        recommendations: JSON.stringify(result.recommendedTests),
        redFlags: JSON.stringify(result.redFlags),
        messageCount: 1,
      });

      // Store differential diagnoses
      for (const diagnosis of result.differentialDiagnoses) {
        await db.insert(differentialDiagnoses).values({
          triageRecordId: triageRecord.insertId,
          diagnosisName: diagnosis.diagnosisName,
          diagnosisNameAr: diagnosis.diagnosisNameAr,
          likelihoodScore: diagnosis.likelihoodScore,
          clinicalReasoning: diagnosis.clinicalReasoning,
          clinicalReasoningAr: diagnosis.clinicalReasoningAr,
          matchingSymptoms: JSON.stringify(diagnosis.matchingSymptoms),
          riskFactors: JSON.stringify(diagnosis.riskFactors),
          recommendedTests: JSON.stringify(
            result.recommendedTests.map((t) => ({
              name: t.testName,
              nameAr: t.testNameAr,
              priority: t.priority,
            }))
          ),
          recommendedTestsAr: JSON.stringify(
            result.recommendedTests.map((t) => ({
              name: t.testNameAr,
              priority: t.priority,
            }))
          ),
          redFlags: JSON.stringify(result.redFlags.map((f) => f.flag)),
          redFlagsAr: JSON.stringify(result.redFlags.map((f) => f.flagAr)),
          urgencyLevel: result.urgencyAssessment.level,
          urgencyReasoning: result.urgencyAssessment.reasoning,
          urgencyReasoningAr: result.urgencyAssessment.reasoningAr,
        });
      }

      return {
        triageRecordId: triageRecord.insertId,
        ...result,
      };
    }),

  /**
   * Get triage history for current user
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const records = await db
      .select()
      .from(triageRecords)
      .where(eq(triageRecords.userId, ctx.user.id))
      .orderBy(desc(triageRecords.createdAt))
      .limit(20);

    return records;
  }),

  /**
   * Get detailed triage record with differential diagnoses
   */
  getTriageDetail: protectedProcedure
    .input(z.object({ triageRecordId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [record] = await db
        .select()
        .from(triageRecords)
        .where(eq(triageRecords.id, input.triageRecordId));

      if (!record || record.userId !== ctx.user.id) {
        throw new Error("Triage record not found");
      }

      const diagnoses = await db
        .select()
        .from(differentialDiagnoses)
        .where(eq(differentialDiagnoses.triageRecordId, input.triageRecordId))
        .orderBy(desc(differentialDiagnoses.likelihoodScore));

      return {
        record,
        diagnoses,
      };
    }),
});
