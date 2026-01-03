import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  virtualConsultationRooms,
  hospitalAffiliations,
  doctorShifts,
  referralRequests,
  clinicalGuidelinesLibrary,
  medicalCalculators,
  calculatorUsageHistory,
  doctorPublicProfiles,
  doctorReviews,
  cmeTracking,
  peerConsultations,
  mentorshipRelationships,
  caseStudiesLibrary,
  doctorRevenueTracking,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

/**
 * Router for new graduate doctor features
 * Handles telemedicine, hospital affiliations, referrals, learning resources, and revenue tracking
 */
export const newGraduateRouter = router({
  // ==================== VIRTUAL CONSULTATION ROOMS ====================
  
  createConsultationRoom: protectedProcedure
    .input(z.object({
      consultationId: z.number(),
      patientId: z.number(),
      scheduledStartTime: z.string(),
      videoEnabled: z.boolean().default(true),
      audioEnabled: z.boolean().default(true),
      recordingEnabled: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const roomId = `room_${nanoid(16)}`;
      
      await db.insert(virtualConsultationRooms).values({
        consultationId: input.consultationId,
        doctorId: ctx.user.id,
        patientId: input.patientId,
        roomId,
        scheduledStartTime: new Date(input.scheduledStartTime),
        videoEnabled: input.videoEnabled,
        audioEnabled: input.audioEnabled,
        recordingEnabled: input.recordingEnabled,
        roomStatus: "waiting",
      });
      
      const room = await db
        .select()
        .from(virtualConsultationRooms)
        .where(eq(virtualConsultationRooms.roomId, roomId))
        .limit(1);
      
      return room[0];
    }),
  
  getMyConsultationRooms: protectedProcedure
    .input(z.object({
      status: z.enum(["waiting", "active", "ended", "cancelled"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let query = db
        .select()
        .from(virtualConsultationRooms)
        .where(eq(virtualConsultationRooms.doctorId, ctx.user.id))
        .orderBy(desc(virtualConsultationRooms.scheduledStartTime))
        .limit(input.limit);
      
      if (input.status) {
        query = db
          .select()
          .from(virtualConsultationRooms)
          .where(and(
            eq(virtualConsultationRooms.doctorId, ctx.user.id),
            eq(virtualConsultationRooms.roomStatus, input.status)
          ))
          .orderBy(desc(virtualConsultationRooms.scheduledStartTime))
          .limit(input.limit);
      }
      
      const rooms = await query;
      return rooms;
    }),
  
  startConsultationRoom: protectedProcedure
    .input(z.object({
      roomId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.update(virtualConsultationRooms)
        .set({
          roomStatus: "active",
          actualStartTime: new Date(),
        })
        .where(and(
          eq(virtualConsultationRooms.roomId, input.roomId),
          eq(virtualConsultationRooms.doctorId, ctx.user.id)
        ));
      
      const room = await db
        .select()
        .from(virtualConsultationRooms)
        .where(eq(virtualConsultationRooms.roomId, input.roomId))
        .limit(1);
      
      return room[0];
    }),
  
  endConsultationRoom: protectedProcedure
    .input(z.object({
      roomId: z.string(),
      connectionQuality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
      technicalIssues: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const existingRoom = await db
        .select()
        .from(virtualConsultationRooms)
        .where(and(
          eq(virtualConsultationRooms.roomId, input.roomId),
          eq(virtualConsultationRooms.doctorId, ctx.user.id)
        ))
        .limit(1);
      
      if (!existingRoom[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }
      
      const room = existingRoom[0];
      const duration = room.actualStartTime 
        ? Math.floor((Date.now() - room.actualStartTime.getTime()) / 1000)
        : 0;
      
      await db.update(virtualConsultationRooms)
        .set({
          roomStatus: "ended",
          endTime: new Date(),
          duration,
          connectionQuality: input.connectionQuality,
          technicalIssues: input.technicalIssues ? JSON.stringify(input.technicalIssues) : null,
        })
        .where(eq(virtualConsultationRooms.roomId, input.roomId));
      
      const updatedRoom = await db
        .select()
        .from(virtualConsultationRooms)
        .where(eq(virtualConsultationRooms.roomId, input.roomId))
        .limit(1);
      
      return updatedRoom[0];
    }),
  
  // ==================== HOSPITAL AFFILIATIONS ====================
  
  createHospitalAffiliation: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      affiliationType: z.enum(["staff", "visiting", "consultant", "resident", "fellow", "temporary"]),
      department: z.string().optional(),
      position: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.insert(hospitalAffiliations).values({
        doctorId: ctx.user.id,
        facilityId: input.facilityId,
        affiliationType: input.affiliationType,
        department: input.department,
        position: input.position,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: "pending",
        verificationStatus: "pending",
      });
      
      return { success: true };
    }),
  
  getMyAffiliations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const affiliations = await db
        .select()
        .from(hospitalAffiliations)
        .where(eq(hospitalAffiliations.doctorId, ctx.user.id))
        .orderBy(desc(hospitalAffiliations.startDate));
      
      return affiliations;
    }),
  
  // ==================== DOCTOR SHIFTS ====================
  
  createShift: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      shiftDate: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      shiftType: z.enum(["day", "evening", "night", "on_call", "emergency"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.insert(doctorShifts).values({
        doctorId: ctx.user.id,
        facilityId: input.facilityId,
        shiftDate: new Date(input.shiftDate),
        startTime: input.startTime,
        endTime: input.endTime,
        shiftType: input.shiftType,
        status: "scheduled",
      });
      
      return { success: true };
    }),
  
  getMyShifts: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [eq(doctorShifts.doctorId, ctx.user.id)];
      
      if (input.startDate) {
        conditions.push(sql`${doctorShifts.shiftDate} >= ${input.startDate}`);
      }
      
      if (input.endDate) {
        conditions.push(sql`${doctorShifts.shiftDate} <= ${input.endDate}`);
      }
      
      if (input.status) {
        conditions.push(eq(doctorShifts.status, input.status));
      }
      
      let query = db
        .select()
        .from(doctorShifts)
        .where(and(...conditions));
      
      const shifts = await query;
      
      return shifts;
    }),
  
  checkInShift: protectedProcedure
    .input(z.object({
      shiftId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.update(doctorShifts)
        .set({
          status: "in_progress",
          checkInTime: new Date(),
        })
        .where(and(
          eq(doctorShifts.id, input.shiftId),
          eq(doctorShifts.doctorId, ctx.user.id)
        ));
      
      return { success: true };
    }),
  
  checkOutShift: protectedProcedure
    .input(z.object({
      shiftId: z.number(),
      patientsSeenCount: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const existingShift = await db
        .select()
        .from(doctorShifts)
        .where(and(
          eq(doctorShifts.id, input.shiftId),
          eq(doctorShifts.doctorId, ctx.user.id)
        ))
        .limit(1);
      
      if (!existingShift[0] || !existingShift[0].checkInTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Shift not found or not checked in" });
      }
      
      const shift = existingShift[0];
      if (!shift.checkInTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Shift check-in time not found" });
      }
      const actualDuration = Math.floor((Date.now() - shift.checkInTime.getTime()) / 60000); // minutes
      
      await db.update(doctorShifts)
        .set({
          status: "completed",
          checkOutTime: new Date(),
          actualDuration,
          patientsSeenCount: input.patientsSeenCount,
          notes: input.notes,
        })
        .where(eq(doctorShifts.id, input.shiftId));
      
      return { success: true };
    }),
  
  // ==================== REFERRAL REQUESTS ====================
  
  createReferral: protectedProcedure
    .input(z.object({
      referredDoctorId: z.number().optional(),
      patientId: z.number(),
      referralType: z.enum(["specialist", "second_opinion", "emergency", "follow_up", "procedure"]),
      specialty: z.string().optional(),
      urgency: z.enum(["routine", "urgent", "emergency"]).default("routine"),
      reason: z.string(),
      clinicalSummary: z.string(),
      relevantHistory: z.string().optional(),
      currentMedications: z.string().optional(),
      attachedDocuments: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.insert(referralRequests).values({
        referringDoctorId: ctx.user.id,
        referredDoctorId: input.referredDoctorId,
        patientId: input.patientId,
        referralType: input.referralType,
        specialty: input.specialty,
        urgency: input.urgency,
        reason: input.reason,
        clinicalSummary: input.clinicalSummary,
        relevantHistory: input.relevantHistory,
        currentMedications: input.currentMedications,
        attachedDocuments: input.attachedDocuments ? JSON.stringify(input.attachedDocuments) : null,
        status: "pending",
      });
      
      return { success: true };
    }),
  
  getMyReferrals: protectedProcedure
    .input(z.object({
      type: z.enum(["sent", "received"]).default("sent"),
      status: z.enum(["pending", "accepted", "declined", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = input.type === "sent"
        ? [eq(referralRequests.referringDoctorId, ctx.user.id)]
        : [eq(referralRequests.referredDoctorId, ctx.user.id)];
      
      if (input.status) {
        conditions.push(eq(referralRequests.status, input.status));
      }
      
      let query = db
        .select()
        .from(referralRequests)
        .where(and(...conditions));
      
      const referrals = await query;
      
      return referrals;
    }),
  
  respondToReferral: protectedProcedure
    .input(z.object({
      referralId: z.number(),
      status: z.enum(["accepted", "declined"]),
      responseNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.update(referralRequests)
        .set({
          status: input.status,
          responseNotes: input.responseNotes,
          respondedAt: new Date(),
        })
        .where(and(
          eq(referralRequests.id, input.referralId),
          eq(referralRequests.referredDoctorId, ctx.user.id)
        ));
      
      return { success: true };
    }),
  
  // ==================== CLINICAL GUIDELINES ====================
  
  searchGuidelines: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [eq(clinicalGuidelinesLibrary.status, "active")];
      
      if (input.category) {
        conditions.push(eq(clinicalGuidelinesLibrary.category, input.category));
      }
      
      let query = db
        .select()
        .from(clinicalGuidelinesLibrary)
        .where(and(...conditions))
        .limit(input.limit);
      
      const guidelines = await query;
      
      return guidelines;
    }),
  
  getGuidelineById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const guideline = await db
        .select()
        .from(clinicalGuidelinesLibrary)
        .where(eq(clinicalGuidelinesLibrary.id, input.id))
        .limit(1);
      
      if (guideline[0]) {
        // Increment view count
        await db.update(clinicalGuidelinesLibrary)
          .set({
            viewCount: sql`${clinicalGuidelinesLibrary.viewCount} + 1`,
          })
          .where(eq(clinicalGuidelinesLibrary.id, input.id));
      }
      
      return guideline[0];
    }),
  
  // ==================== MEDICAL CALCULATORS ====================
  
  getCalculators: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [eq(medicalCalculators.status, "active")];
      
      if (input.category) {
        conditions.push(eq(medicalCalculators.category, input.category));
      }
      
      const calculators = await db
        .select()
        .from(medicalCalculators)
        .where(and(...conditions))
        .orderBy(desc(medicalCalculators.usageCount));
      
      return calculators;
    }),
  
  useCalculator: protectedProcedure
    .input(z.object({
      calculatorId: z.number(),
      inputData: z.record(z.string(), z.any()),
      outputData: z.record(z.string(), z.any()),
      patientId: z.number().optional(),
      consultationId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Save usage history
      await db.insert(calculatorUsageHistory).values({
        calculatorId: input.calculatorId,
        userId: ctx.user.id,
        patientId: input.patientId,
        inputData: JSON.stringify(input.inputData),
        outputData: JSON.stringify(input.outputData),
        consultationId: input.consultationId,
        notes: input.notes,
      });
      
      // Increment usage count
      await db.update(medicalCalculators)
        .set({
          usageCount: sql`${medicalCalculators.usageCount} + 1`,
        })
        .where(eq(medicalCalculators.id, input.calculatorId));
      
      return { success: true };
    }),
  
  // ==================== DOCTOR PUBLIC PROFILE ====================
  
  getMyPublicProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const profile = await db
        .select()
        .from(doctorPublicProfiles)
        .where(eq(doctorPublicProfiles.doctorId, ctx.user.id))
        .limit(1);
      
      return profile[0] || null;
    }),
  
  updatePublicProfile: protectedProcedure
    .input(z.object({
      displayName: z.string(),
      bio: z.string().optional(),
      specialties: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      consultationFee: z.number().optional(),
      acceptingNewPatients: z.boolean().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const existingProfile = await db
        .select()
        .from(doctorPublicProfiles)
        .where(eq(doctorPublicProfiles.doctorId, ctx.user.id))
        .limit(1);
      
      if (existingProfile[0]) {
        await db.update(doctorPublicProfiles)
          .set({
            displayName: input.displayName,
            bio: input.bio,
            specialties: input.specialties ? JSON.stringify(input.specialties) : null,
            languages: input.languages ? JSON.stringify(input.languages) : null,
            consultationFee: input.consultationFee?.toString(),
            acceptingNewPatients: input.acceptingNewPatients,
            isPublic: input.isPublic,
          })
          .where(eq(doctorPublicProfiles.doctorId, ctx.user.id));
      } else {
        const profileSlug = `dr-${ctx.user.name?.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`;
        
        await db.insert(doctorPublicProfiles).values({
          doctorId: ctx.user.id,
          displayName: input.displayName,
          bio: input.bio,
          specialties: input.specialties ? JSON.stringify(input.specialties) : null,
          languages: input.languages ? JSON.stringify(input.languages) : null,
          consultationFee: input.consultationFee?.toString(),
          acceptingNewPatients: input.acceptingNewPatients ?? true,
          isPublic: input.isPublic ?? false,
          profileSlug,
        });
      }
      
      return { success: true };
    }),
  
  // ==================== CME TRACKING ====================
  
  addCmeActivity: protectedProcedure
    .input(z.object({
      activityType: z.enum(["course", "conference", "workshop", "webinar", "journal_review", "case_study", "other"]),
      activityTitle: z.string(),
      provider: z.string().optional(),
      creditsEarned: z.number(),
      activityDate: z.string(),
      completionDate: z.string().optional(),
      category: z.string().optional(),
      certificateKey: z.string().optional(),
      certificateUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const values: any = {
        doctorId: ctx.user.id,
        activityType: input.activityType,
        activityTitle: input.activityTitle,
        provider: input.provider,
        creditsEarned: input.creditsEarned.toString(),
        activityDate: input.activityDate,
        completionDate: input.completionDate,
        category: input.category,
        certificateKey: input.certificateKey,
        certificateUrl: input.certificateUrl,
        status: "completed" as const,
      };
      
      await db.insert(cmeTracking).values(values);
      
      return { success: true };
    }),
  
  getMyCmeActivities: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const activities = await db
        .select()
        .from(cmeTracking)
        .where(eq(cmeTracking.doctorId, ctx.user.id))
        .orderBy(desc(cmeTracking.activityDate));
      
      return activities;
    }),
  
  getCmeStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const activities = await db
        .select()
        .from(cmeTracking)
        .where(eq(cmeTracking.doctorId, ctx.user.id));
      
      const totalCredits = activities.reduce((sum: number, activity: any) => {
        return sum + parseFloat(activity.creditsEarned || "0");
      }, 0);
      
      const currentYear = new Date().getFullYear();
      const thisYearActivities = activities.filter((a: any) => 
        new Date(a.activityDate).getFullYear() === currentYear
      );
      
      const creditsThisYear = thisYearActivities.reduce((sum: number, activity: any) => {
        return sum + parseFloat(activity.creditsEarned || "0");
      }, 0);
      
      return {
        totalCredits,
        creditsThisYear,
        totalActivities: activities.length,
        activitiesThisYear: thisYearActivities.length,
      };
    }),
  
  // ==================== REVENUE TRACKING ====================
  
  getMyRevenue: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [eq(doctorRevenueTracking.doctorId, ctx.user.id)];
      
      if (input.startDate) {
        conditions.push(sql`${doctorRevenueTracking.createdAt} >= ${input.startDate}`);
      }
      
      if (input.endDate) {
        conditions.push(sql`${doctorRevenueTracking.createdAt} <= ${input.endDate}`);
      }
      
      const transactions = await db
        .select()
        .from(doctorRevenueTracking)
        .where(and(...conditions))
        .orderBy(desc(doctorRevenueTracking.createdAt));
      
      return transactions;
    }),
  
  getRevenueStats: protectedProcedure
    .input(z.object({
      year: z.number().optional(),
      quarter: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [
        eq(doctorRevenueTracking.doctorId, ctx.user.id),
        eq(doctorRevenueTracking.status, "completed"),
      ];
      
      if (input.year) {
        conditions.push(eq(doctorRevenueTracking.taxYear, input.year));
      }
      
      if (input.quarter) {
        conditions.push(eq(doctorRevenueTracking.taxQuarter, input.quarter));
      }
      
      const transactions = await db
        .select()
        .from(doctorRevenueTracking)
        .where(and(...conditions));
      
      const totalRevenue = transactions.reduce((sum: number, t: any) => {
        return sum + parseFloat(t.amount || "0");
      }, 0);
      
      const totalNetRevenue = transactions.reduce((sum: number, t: any) => {
        return sum + parseFloat(t.netAmount || "0");
      }, 0);
      
      const totalPlatformFees = transactions.reduce((sum: number, t: any) => {
        return sum + parseFloat(t.platformFee || "0");
      }, 0);
      
      return {
        totalRevenue,
        totalNetRevenue,
        totalPlatformFees,
        transactionCount: transactions.length,
      };
    }),
});
