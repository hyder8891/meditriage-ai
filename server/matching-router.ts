import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  specialties,
  doctorSpecialties,
  matchingHistory,
  matchingAlgorithmConfig,
  patientMatchingPreferences,
  doctorAvailabilityStatus,
  matchingSuccessMetrics,
  emergencyAssignmentQueue,
  users,
  doctorPublicProfiles,
} from "../drizzle/schema";
import { eq, and, desc, sql, inArray, gte, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Intelligent Doctor-Patient Matching Router
 * Implements Phase 1, 2, and 3 of the matching system
 */
export const matchingRouter = router({
  // ==================== SPECIALTY MANAGEMENT ====================
  
  /**
   * Get all specialties with hierarchy
   */
  getSpecialties: publicProcedure
    .input(z.object({
      parentId: z.number().optional(),
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [];
      
      if (!input.includeInactive) {
        conditions.push(eq(specialties.isActive, true));
      }
      
      if (input.parentId !== undefined) {
        if (input.parentId === 0) {
          conditions.push(sql`${specialties.parentSpecialtyId} IS NULL`);
        } else {
          conditions.push(eq(specialties.parentSpecialtyId, input.parentId));
        }
      }
      
      const query = conditions.length > 0
        ? db.select().from(specialties).where(and(...conditions))
        : db.select().from(specialties);
      
      const result = await query;
      return result;
    }),
  
  /**
   * Add specialty to doctor profile
   */
  addDoctorSpecialty: protectedProcedure
    .input(z.object({
      specialtyId: z.number(),
      isPrimary: z.boolean().default(false),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
      yearsOfExperience: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if doctor role
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only doctors can add specialties" });
      }
      
      // If setting as primary, unset other primary specialties
      if (input.isPrimary) {
        await db.update(doctorSpecialties)
          .set({ isPrimary: false })
          .where(eq(doctorSpecialties.doctorId, ctx.user.id));
      }
      
      await db.insert(doctorSpecialties).values({
        doctorId: ctx.user.id,
        specialtyId: input.specialtyId,
        isPrimary: input.isPrimary,
        proficiencyLevel: input.proficiencyLevel,
        yearsOfExperience: input.yearsOfExperience,
      });
      
      return { success: true };
    }),
  
  /**
   * Get doctor's specialties
   */
  getMySpecialties: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const result = await db
        .select()
        .from(doctorSpecialties)
        .where(eq(doctorSpecialties.doctorId, ctx.user.id));
      
      return result;
    }),
  
  // ==================== PHASE 1: CORE MATCHING ====================
  
  /**
   * Find best matching doctors for a patient
   * Implements basic filtering and ranking algorithm
   */
  findMatchingDoctors: protectedProcedure
    .input(z.object({
      specialtyId: z.number().optional(),
      urgencyLevel: z.enum(["routine", "urgent", "emergency"]).default("routine"),
      triageRecordId: z.number().optional(),
      limit: z.number().default(5),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get active matching algorithm config
      const [config] = await db
        .select()
        .from(matchingAlgorithmConfig)
        .where(eq(matchingAlgorithmConfig.isActive, true))
        .limit(1);
      
      if (!config) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No active matching algorithm configured" });
      }
      
      // Emergency override: bypass capacity limits
      const bypassCapacity = input.urgencyLevel === "emergency" && config.emergencyBypassCapacity;
      
      // Get available doctors
      const availableDoctors = await db
        .select({
          doctorId: doctorAvailabilityStatus.doctorId,
          isAvailable: doctorAvailabilityStatus.isAvailable,
          currentPatientsToday: doctorAvailabilityStatus.currentPatientsToday,
          currentPatientsThisHour: doctorAvailabilityStatus.currentPatientsThisHour,
          maxPatientsPerDay: doctorAvailabilityStatus.maxPatientsPerDay,
          maxPatientsPerHour: doctorAvailabilityStatus.maxPatientsPerHour,
          estimatedWaitTimeMinutes: doctorAvailabilityStatus.estimatedWaitTimeMinutes,
          currentLatitude: doctorAvailabilityStatus.currentLatitude,
          currentLongitude: doctorAvailabilityStatus.currentLongitude,
        })
        .from(doctorAvailabilityStatus)
        .where(eq(doctorAvailabilityStatus.isAvailable, true));
      
      // Filter by capacity (unless emergency bypass)
      const capacityFilteredDoctors = bypassCapacity
        ? availableDoctors
        : availableDoctors.filter(d => 
            d.currentPatientsToday < d.maxPatientsPerDay &&
            d.currentPatientsThisHour < d.maxPatientsPerHour
          );
      
      if (capacityFilteredDoctors.length === 0) {
        return [];
      }
      
      const doctorIds = capacityFilteredDoctors.map(d => d.doctorId);
      
      // Get doctor details and specialties
      const doctors = await db
        .select()
        .from(users)
        .where(inArray(users.id, doctorIds));
      
      // Get doctor specialties
      const doctorSpecialtiesData = await db
        .select()
        .from(doctorSpecialties)
        .where(inArray(doctorSpecialties.doctorId, doctorIds));
      
      // Get doctor profiles for ratings
      const doctorProfiles = await db
        .select()
        .from(doctorPublicProfiles)
        .where(inArray(doctorPublicProfiles.doctorId, doctorIds));
      
      // Calculate match scores
      const matches = doctors.map(doctor => {
        const availability = capacityFilteredDoctors.find(d => d.doctorId === doctor.id)!;
        const specialtiesForDoctor = doctorSpecialtiesData.filter(ds => ds.doctorId === doctor.id);
        const profile = doctorProfiles.find(p => p.doctorId === doctor.id);
        
        let matchScore = 0;
        const reasons = [];
        
        // Specialty match (35%)
        if (input.specialtyId) {
          const hasSpecialty = specialtiesForDoctor.some(ds => ds.specialtyId === input.specialtyId);
          if (hasSpecialty) {
            matchScore += config.specialtyMatchWeight * 100;
            reasons.push("Specialty match");
          }
        } else {
          // No specific specialty required, give partial credit
          matchScore += config.specialtyMatchWeight * 50;
        }
        
        // Availability (25%)
        const availabilityScore = Math.max(0, 100 - availability.estimatedWaitTimeMinutes);
        matchScore += (config.availabilityWeight * availabilityScore);
        reasons.push(`Wait time: ${availability.estimatedWaitTimeMinutes}min`);
        
        // Experience (15%)
        const primarySpecialty = specialtiesForDoctor.find(ds => ds.isPrimary);
        const experienceYears = primarySpecialty?.yearsOfExperience || 0;
        const experienceScore = Math.min(100, experienceYears * 10); // Max at 10 years
        matchScore += (config.experienceWeight * experienceScore);
        reasons.push(`Experience: ${experienceYears} years`);
        
        // Rating (10%)
        const rating = profile ? parseFloat(profile.averageRating || "0") : 0;
        const ratingScore = (rating / 5) * 100;
        matchScore += (config.ratingWeight * ratingScore);
        if (rating > 0) {
          reasons.push(`Rating: ${rating.toFixed(1)}/5`);
        }
        
        // Language match (5%)
        // TODO: Implement language matching when patient preferences are available
        matchScore += (config.languageMatchWeight * 50); // Neutral score for now
        
        return {
          doctor,
          availability,
          specialties: specialtiesForDoctor,
          profile,
          matchScore: Math.round(matchScore),
          matchReasons: reasons,
        };
      });
      
      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);
      
      // Return top matches
      return matches.slice(0, input.limit);
    }),
  
  /**
   * Assign doctor to patient (one-at-a-time with patient choice)
   */
  assignDoctor: protectedProcedure
    .input(z.object({
      doctorId: z.number(),
      triageRecordId: z.number().optional(),
      urgencyLevel: z.enum(["routine", "urgent", "emergency"]).default("routine"),
      specialtyRequired: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if doctor is available
      const [availability] = await db
        .select()
        .from(doctorAvailabilityStatus)
        .where(eq(doctorAvailabilityStatus.doctorId, input.doctorId))
        .limit(1);
      
      if (!availability || !availability.isAvailable) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Doctor is not available" });
      }
      
      // Create matching history record
      await db.insert(matchingHistory).values({
        patientId: ctx.user.id,
        doctorId: input.doctorId,
        triageRecordId: input.triageRecordId,
        matchScore: 0, // Will be updated by algorithm
        status: "assigned",
        assignedAt: new Date(),
        urgencyLevel: input.urgencyLevel,
        specialtyRequired: input.specialtyRequired,
      });
      
      // Update doctor's patient count
      await db.update(doctorAvailabilityStatus)
        .set({
          currentPatientsToday: sql`${doctorAvailabilityStatus.currentPatientsToday} + 1`,
          currentPatientsThisHour: sql`${doctorAvailabilityStatus.currentPatientsThisHour} + 1`,
          currentQueueLength: sql`${doctorAvailabilityStatus.currentQueueLength} + 1`,
        })
        .where(eq(doctorAvailabilityStatus.doctorId, input.doctorId));
      
      return { success: true, message: "Doctor assigned successfully" };
    }),
  
  /**
   * Patient accepts or declines assigned doctor
   */
  respondToAssignment: protectedProcedure
    .input(z.object({
      matchingHistoryId: z.number(),
      accepted: z.boolean(),
      declineReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const newStatus = input.accepted ? "accepted" : "declined";
      
      await db.update(matchingHistory)
        .set({
          status: newStatus,
          respondedAt: new Date(),
          patientDeclineReason: input.declineReason,
        })
        .where(and(
          eq(matchingHistory.id, input.matchingHistoryId),
          eq(matchingHistory.patientId, ctx.user.id)
        ));
      
      // If declined, decrease doctor's queue
      if (!input.accepted) {
        const [match] = await db
          .select()
          .from(matchingHistory)
          .where(eq(matchingHistory.id, input.matchingHistoryId))
          .limit(1);
        
        if (match) {
          await db.update(doctorAvailabilityStatus)
            .set({
              currentQueueLength: sql`GREATEST(0, ${doctorAvailabilityStatus.currentQueueLength} - 1)`,
            })
            .where(eq(doctorAvailabilityStatus.doctorId, match.doctorId));
        }
      }
      
      return { success: true };
    }),
  
  // ==================== PHASE 2: ENHANCED FEATURES ====================
  
  /**
   * Update doctor availability status
   */
  updateAvailability: protectedProcedure
    .input(z.object({
      isAvailable: z.boolean(),
      availabilityStatus: z.enum(["online", "busy", "offline", "in_consultation"]),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if doctor role
      if (ctx.user.role !== "doctor" && ctx.user.role !== "clinician") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only doctors can update availability" });
      }
      
      // Check if record exists
      const [existing] = await db
        .select()
        .from(doctorAvailabilityStatus)
        .where(eq(doctorAvailabilityStatus.doctorId, ctx.user.id))
        .limit(1);
      
      if (existing) {
        await db.update(doctorAvailabilityStatus)
          .set({
            isAvailable: input.isAvailable,
            availabilityStatus: input.availabilityStatus,
            currentLatitude: input.latitude,
            currentLongitude: input.longitude,
            locationUpdatedAt: input.latitude ? new Date() : undefined,
            lastStatusChange: new Date(),
          })
          .where(eq(doctorAvailabilityStatus.doctorId, ctx.user.id));
      } else {
        await db.insert(doctorAvailabilityStatus).values({
          doctorId: ctx.user.id,
          isAvailable: input.isAvailable,
          availabilityStatus: input.availabilityStatus,
          currentLatitude: input.latitude,
          currentLongitude: input.longitude,
          locationUpdatedAt: input.latitude ? new Date() : undefined,
        });
      }
      
      return { success: true };
    }),
  
  /**
   * Get my availability status
   */
  getMyAvailability: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [status] = await db
        .select()
        .from(doctorAvailabilityStatus)
        .where(eq(doctorAvailabilityStatus.doctorId, ctx.user.id))
        .limit(1);
      
      return status || null;
    }),
  
  /**
   * Quick assign for urgent/emergency cases
   * Finds the first available doctor matching criteria
   */
  quickAssign: protectedProcedure
    .input(z.object({
      specialtyId: z.number().optional(),
      urgencyLevel: z.enum(["urgent", "emergency"]),
      triageRecordId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Find matching doctors
      const matches = await db
        .select()
        .from(doctorAvailabilityStatus)
        .where(and(
          eq(doctorAvailabilityStatus.isAvailable, true),
          eq(doctorAvailabilityStatus.availabilityStatus, "online")
        ))
        .limit(10);
      
      if (matches.length === 0) {
        // Add to emergency queue
        await db.insert(emergencyAssignmentQueue).values({
          patientId: ctx.user.id,
          triageRecordId: input.triageRecordId || 0,
          urgencyLevel: input.urgencyLevel === "emergency" ? "critical" : "urgent",
          priorityScore: input.urgencyLevel === "emergency" ? 100 : 50,
          requiredSpecialtyId: input.specialtyId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        });
        
        return { 
          success: false, 
          message: "No doctors available. Added to emergency queue.",
          queued: true,
        };
      }
      
      // Assign to first available doctor
      const firstDoctor = matches[0];
      
      await db.insert(matchingHistory).values({
        patientId: ctx.user.id,
        doctorId: firstDoctor.doctorId,
        triageRecordId: input.triageRecordId,
        matchScore: 100, // Quick assign gets max score
        matchReason: JSON.stringify(["Quick assign for " + input.urgencyLevel]),
        status: "assigned",
        assignedAt: new Date(),
        urgencyLevel: input.urgencyLevel,
      });
      
      await db.update(doctorAvailabilityStatus)
        .set({
          currentPatientsToday: sql`${doctorAvailabilityStatus.currentPatientsToday} + 1`,
          currentPatientsThisHour: sql`${doctorAvailabilityStatus.currentPatientsThisHour} + 1`,
          currentQueueLength: sql`${doctorAvailabilityStatus.currentQueueLength} + 1`,
        })
        .where(eq(doctorAvailabilityStatus.doctorId, firstDoctor.doctorId));
      
      return { 
        success: true, 
        doctorId: firstDoctor.doctorId,
        message: "Doctor assigned immediately",
      };
    }),
  
  /**
   * Get patient matching preferences
   */
  getMyPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [prefs] = await db
        .select()
        .from(patientMatchingPreferences)
        .where(eq(patientMatchingPreferences.patientId, ctx.user.id))
        .limit(1);
      
      return prefs || null;
    }),
  
  /**
   * Update patient matching preferences
   */
  updateMyPreferences: protectedProcedure
    .input(z.object({
      preferredGender: z.enum(["male", "female", "any"]).optional(),
      preferredLanguages: z.array(z.string()).optional(),
      preferredCommunicationStyle: z.enum(["direct", "detailed", "empathetic", "any"]).optional(),
      maxWaitingTimeMinutes: z.number().optional(),
      maxDistanceKm: z.number().optional(),
      minDoctorExperienceYears: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [existing] = await db
        .select()
        .from(patientMatchingPreferences)
        .where(eq(patientMatchingPreferences.patientId, ctx.user.id))
        .limit(1);
      
      if (existing) {
        await db.update(patientMatchingPreferences)
          .set({
            preferredGender: input.preferredGender,
            preferredLanguages: input.preferredLanguages ? JSON.stringify(input.preferredLanguages) : undefined,
            preferredCommunicationStyle: input.preferredCommunicationStyle,
            maxWaitingTimeMinutes: input.maxWaitingTimeMinutes,
            maxDistanceKm: input.maxDistanceKm,
            minDoctorExperienceYears: input.minDoctorExperienceYears,
          })
          .where(eq(patientMatchingPreferences.patientId, ctx.user.id));
      } else {
        await db.insert(patientMatchingPreferences).values({
          patientId: ctx.user.id,
          preferredGender: input.preferredGender || "any",
          preferredLanguages: input.preferredLanguages ? JSON.stringify(input.preferredLanguages) : null,
          preferredCommunicationStyle: input.preferredCommunicationStyle || "any",
          maxWaitingTimeMinutes: input.maxWaitingTimeMinutes || 30,
          maxDistanceKm: input.maxDistanceKm || 20,
          minDoctorExperienceYears: input.minDoctorExperienceYears || 0,
        });
      }
      
      return { success: true };
    }),
  
  // ==================== PHASE 3: ANALYTICS & ML ====================
  
  /**
   * Get matching history for analytics
   */
  getMatchingHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      status: z.enum(["suggested", "assigned", "accepted", "declined", "completed", "cancelled"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const conditions = [eq(matchingHistory.patientId, ctx.user.id)];
      
      if (input.status) {
        conditions.push(eq(matchingHistory.status, input.status));
      }
      
      const history = await db
        .select()
        .from(matchingHistory)
        .where(and(...conditions))
        .limit(input.limit);
      
      return history;
    }),
  
  /**
   * Get doctor success metrics
   */
  getDoctorSuccessMetrics: protectedProcedure
    .input(z.object({
      doctorId: z.number(),
      periodDays: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const periodStart = new Date(Date.now() - input.periodDays * 24 * 60 * 60 * 1000);
      
      const metrics = await db
        .select()
        .from(matchingSuccessMetrics)
        .where(and(
          eq(matchingSuccessMetrics.doctorId, input.doctorId),
          gte(matchingSuccessMetrics.periodStart, periodStart)
        ));
      
      return metrics;
    }),
  
  /**
   * Submit feedback after consultation (for ML learning)
   */
  submitMatchingFeedback: protectedProcedure
    .input(z.object({
      matchingHistoryId: z.number(),
      rating: z.number().min(1).max(5),
      feedback: z.string().optional(),
      treatmentSuccessful: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db.update(matchingHistory)
        .set({
          patientRating: input.rating,
          patientFeedback: input.feedback,
          treatmentSuccessful: input.treatmentSuccessful,
          consultationCompleted: true,
          status: "completed",
        })
        .where(and(
          eq(matchingHistory.id, input.matchingHistoryId),
          eq(matchingHistory.patientId, ctx.user.id)
        ));
      
      return { success: true };
    }),
  
  /**
   * Get emergency queue status
   */
  getEmergencyQueueStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [queueItem] = await db
        .select()
        .from(emergencyAssignmentQueue)
        .where(and(
          eq(emergencyAssignmentQueue.patientId, ctx.user.id),
          eq(emergencyAssignmentQueue.status, "pending")
        ))
        .limit(1);
      
      return queueItem || null;
    }),
  
  /**
   * Get matching algorithm configuration (admin only)
   */
  getAlgorithmConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      
      const configs = await db
        .select()
        .from(matchingAlgorithmConfig);
      
      return configs;
    }),
});
