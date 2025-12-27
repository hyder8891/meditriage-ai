import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sendAppointmentConfirmation } from "./services/email";
import { getDb } from "./db";
import { users, consultations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { emitNotificationToUser } from "./_core/socket-server";
import {
  createConsultation,
  getConsultationById,
  getConsultationByRoomId,
  getConsultationsByPatient,
  getConsultationsByClinician,
  getUpcomingConsultations,
  updateConsultationStatus,
  startConsultation,
  endConsultation,
  saveChatTranscript,
  rateConsultation,
} from "./consultation-db";

export const consultationRouter = router({
  // Book consultation (patient-facing)
  book: protectedProcedure
    .input(z.object({
      doctorId: z.number(),
      scheduledAt: z.date(),
      consultationType: z.enum(["video", "in-person"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await createConsultation({
        patientId: ctx.user.id,
        clinicianId: input.doctorId,
        scheduledTime: input.scheduledAt,
        chiefComplaint: input.reason,
      });
      
      // Send appointment confirmation email
      try {
        const db = await getDb();
        
        const [patient] = await db!
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        const [clinician] = await db!
          .select()
          .from(users)
          .where(eq(users.id, input.doctorId))
          .limit(1);
        
        if (patient && clinician && patient.email) {
          sendAppointmentConfirmation({
            patientName: patient.name || "Patient",
            patientEmail: patient.email,
            doctorName: clinician.name || "Doctor",
            appointmentDate: input.scheduledAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            appointmentTime: input.scheduledAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            appointmentType: input.reason || "General Consultation",
            language: "ar",
          }).catch(err => console.error("[Consultation] Failed to send confirmation:", err));
        }
      } catch (err) {
        console.error("[Consultation] Error sending confirmation:", err);
      }
      
      return result;
    }),

  // Cancel consultation
  cancel: protectedProcedure
    .input(z.object({
      consultationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.consultationId);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }
      
      // Check authorization
      if (
        ctx.user.role !== 'admin' &&
        consultation.patientId !== ctx.user.id &&
        consultation.clinicianId !== ctx.user.id
      ) {
        throw new Error('Unauthorized');
      }
      
      await updateConsultationStatus(input.consultationId, 'cancelled');
      
      return { success: true };
    }),

  // Create new consultation (admin/clinician-facing)
  create: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      clinicianId: z.number(),
      scheduledTime: z.string().transform(str => new Date(str)),
      chiefComplaint: z.string().optional(),
      appointmentId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await createConsultation(input);
      
      // Send appointment confirmation email
      try {
        const db = await getDb();
        
        // Get patient and clinician details
        const [patient] = await db!
          .select()
          .from(users)
          .where(eq(users.id, input.patientId))
          .limit(1);
        
        const [clinician] = await db!
          .select()
          .from(users)
          .where(eq(users.id, input.clinicianId))
          .limit(1);
        
        if (patient && clinician && patient.email) {
          const appointmentDate = new Date(input.scheduledTime);
          
          sendAppointmentConfirmation({
            patientName: patient.name || "Patient",
            patientEmail: patient.email,
            doctorName: clinician.name || "Doctor",
            appointmentDate: appointmentDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            appointmentTime: appointmentDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            appointmentType: input.chiefComplaint || "General Consultation",
            language: "ar",
          }).catch(err => console.error("[Consultation] Failed to send appointment confirmation:", err));
        }
      } catch (err) {
        console.error("[Consultation] Error sending appointment confirmation:", err);
      }
      
      return result;
    }),

  // Get consultation by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Check authorization
      if (
        ctx.user.role !== 'admin' &&
        consultation.patientId !== ctx.user.id &&
        consultation.clinicianId !== ctx.user.id
      ) {
        throw new Error('Unauthorized');
      }

      return consultation;
    }),

  // Get consultation by room ID
  getByRoomId: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input, ctx }) => {
      const consultation = await getConsultationByRoomId(input.roomId);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Check authorization
      if (
        ctx.user.role !== 'admin' &&
        consultation.patientId !== ctx.user.id &&
        consultation.clinicianId !== ctx.user.id
      ) {
        throw new Error('Unauthorized');
      }

      return consultation;
    }),

  // Get my consultations
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user.role === 'clinician' || ctx.user.role === 'admin' ? 'clinician' : 'patient';
    
    if (role === 'patient') {
      return await getConsultationsByPatient(ctx.user.id);
    } else {
      return await getConsultationsByClinician(ctx.user.id);
    }
  }),

  // Get upcoming consultations
  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user.role === 'clinician' || ctx.user.role === 'admin' ? 'clinician' : 'patient';
    return await getUpcomingConsultations(ctx.user.id, role);
  }),

  // Update status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["scheduled", "waiting", "in_progress", "completed", "cancelled", "no_show"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Only clinician or admin can update status
      if (ctx.user.role !== 'admin' && consultation.clinicianId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      await updateConsultationStatus(input.id, input.status);
      return { success: true };
    }),

  // Start consultation
  start: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Check authorization
      if (
        ctx.user.role !== 'admin' &&
        consultation.patientId !== ctx.user.id &&
        consultation.clinicianId !== ctx.user.id
      ) {
        throw new Error('Unauthorized');
      }

      await startConsultation(input.id);
      
      // Notify the patient that doctor has joined
      if (ctx.user.id === consultation.clinicianId) {
        try {
          emitNotificationToUser(consultation.patientId, 'consultation-update', {
            consultationId: consultation.id,
            status: 'in_progress',
            message: 'Doctor has joined the consultation',
          });
        } catch (error) {
          console.error('[Consultation] Failed to emit notification:', error);
        }
      }
      
      return { success: true };
    }),

  // End consultation
  end: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
      diagnosis: z.string().optional(),
      prescriptionGenerated: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Only clinician can end consultation
      if (ctx.user.role !== 'admin' && consultation.clinicianId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      await endConsultation(input.id, {
        notes: input.notes,
        diagnosis: input.diagnosis,
        prescriptionGenerated: input.prescriptionGenerated,
      });
      
      return { success: true };
    }),

  // Save notes (clinician only)
  saveNotes: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Only clinician can save notes
      if (ctx.user.role !== 'admin' && consultation.clinicianId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      const db = await getDb();
      await db!
        .update(consultations)
        .set({ notes: input.notes })
        .where(eq(consultations.id, input.id));
      
      return { success: true };
    }),

  // Save chat transcript
  saveChatTranscript: protectedProcedure
    .input(z.object({
      id: z.number(),
      messages: z.array(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Check authorization
      if (
        ctx.user.role !== 'admin' &&
        consultation.patientId !== ctx.user.id &&
        consultation.clinicianId !== ctx.user.id
      ) {
        throw new Error('Unauthorized');
      }

      await saveChatTranscript(input.id, input.messages);
      return { success: true };
    }),

  // Rate consultation
  rate: protectedProcedure
    .input(z.object({
      id: z.number(),
      rating: z.number().min(1).max(5),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const consultation = await getConsultationById(input.id);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Only patient can rate
      if (consultation.patientId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      await rateConsultation(input.id, input.rating, input.feedback);
      return { success: true };
    }),
});
