/**
 * Calendar System Tests
 * Tests for doctor availability, slot generation, and booking workflow
 */

import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import {
  doctorWorkingHours,
  calendarSlots,
  appointmentBookingRequests,
  slotGenerationHistory,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Test context with authenticated doctor and patient
const createDoctorContext = (userId: number) => ({
  user: {
    id: userId,
    email: `doctor${userId}@test.com`,
    role: "clinician" as const,
    name: `Test Doctor ${userId}`,
  },
});

const createPatientContext = (userId: number) => ({
  user: {
    id: userId,
    email: `patient${userId}@test.com`,
    role: "user" as const,
    name: `Test Patient ${userId}`,
  },
});

describe("Calendar System", () => {
  const doctorId = 999001;
  const patientId = 999002;
  let testSlotId: number;

  beforeAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(appointmentBookingRequests).where(
      eq(appointmentBookingRequests.doctorId, doctorId)
    );
    await db.delete(calendarSlots).where(eq(calendarSlots.doctorId, doctorId));
    await db.delete(slotGenerationHistory).where(
      eq(slotGenerationHistory.doctorId, doctorId)
    );
    await db.delete(doctorWorkingHours).where(
      eq(doctorWorkingHours.doctorId, doctorId)
    );
  });

  describe("Doctor Working Hours Management", () => {
    it("should allow doctor to set working hours", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const result = await caller.calendar.setWorkingHours({
        dayOfWeek: 1, // Monday
        startTime: "09:00:00",
        endTime: "17:00:00",
        slotDuration: 30,
        bufferTime: 5,
      });

      expect(result.success).toBe(true);
    });

    it("should retrieve doctor's working hours", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const workingHours = await caller.calendar.getWorkingHours({});

      expect(workingHours).toBeDefined();
      expect(workingHours.length).toBeGreaterThan(0);
      expect(workingHours[0].dayOfWeek).toBe(1);
      expect(workingHours[0].startTime).toBe("09:00:00");
      expect(workingHours[0].slotDuration).toBe(30);
    });

    it("should allow setting multiple days of working hours", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      // Set Tuesday
      await caller.calendar.setWorkingHours({
        dayOfWeek: 2,
        startTime: "10:00:00",
        endTime: "16:00:00",
        slotDuration: 45,
      });

      const workingHours = await caller.calendar.getWorkingHours({});
      expect(workingHours.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Slot Generation", () => {
    it("should generate slots based on working hours", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const result = await caller.calendar.generateSlots({
        days: 7,
      });

      expect(result.success).toBe(true);
      expect(result.slotsGenerated).toBeGreaterThan(0);
    });

    it("should create available slots in database", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const slots = await caller.calendar.getDoctorSlots({
        startDate: today.toISOString().split("T")[0],
        endDate: nextWeek.toISOString().split("T")[0],
      });

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].status).toBe("available");
      testSlotId = slots[0].id;
    });

    it("should record slot generation history", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const history = await caller.calendar.getGenerationHistory({
        limit: 10,
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].status).toBe("success");
      expect(history[0].slotsGenerated).toBeGreaterThan(0);
    });
  });

  describe("Slot Availability", () => {
    it("should show available slots to patients", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const availableSlots = await caller.calendar.getAvailableSlots({
        doctorId,
        startDate: today.toISOString().split("T")[0],
        endDate: nextWeek.toISOString().split("T")[0],
      });

      expect(availableSlots.length).toBeGreaterThan(0);
      expect(availableSlots.every((slot) => slot.status === "available")).toBe(
        true
      );
    });

    it("should find next available slot", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      const nextSlot = await caller.calendar.getNextAvailableSlot({
        doctorId,
      });

      expect(nextSlot).toBeDefined();
      if (nextSlot) {
        expect(nextSlot.status).toBe("available");
      }
    });
  });

  describe("Booking Request Workflow", () => {
    let bookingRequestId: number;

    it("should allow patient to create booking request", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      const result = await caller.calendar.createBookingRequest({
        slotId: testSlotId,
        chiefComplaint: "Test headache",
        symptoms: "Severe headache for 2 days",
      });

      expect(result.success).toBe(true);
    });

    it("should automatically block slot when booked", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [slot] = await db
        .select()
        .from(calendarSlots)
        .where(eq(calendarSlots.id, testSlotId));

      expect(slot.status).toBe("booked");
      expect(slot.patientId).toBe(patientId);
    });

    it("should show pending requests to doctor", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const pendingRequests = await caller.calendar.getPendingRequests();

      expect(pendingRequests.length).toBeGreaterThan(0);
      expect(pendingRequests[0].status).toBe("pending");
      expect(pendingRequests[0].chiefComplaint).toBe("Test headache");
      bookingRequestId = pendingRequests[0].id;
    });

    it("should show booking request to patient", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      const myRequests = await caller.calendar.getMyBookingRequests();

      expect(myRequests.length).toBeGreaterThan(0);
      expect(myRequests[0].status).toBe("pending");
    });

    it("should allow doctor to confirm booking request", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const result = await caller.calendar.confirmBookingRequest({
        requestId: bookingRequestId,
      });

      expect(result.success).toBe(true);
      expect(result.appointmentId).toBeDefined();
    });

    it("should update booking request status to confirmed", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [request] = await db
        .select()
        .from(appointmentBookingRequests)
        .where(eq(appointmentBookingRequests.id, bookingRequestId));

      expect(request.status).toBe("confirmed");
      expect(request.appointmentId).toBeDefined();
    });
  });

  describe("Slot Management", () => {
    it("should allow doctor to block a slot", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      // Get an available slot
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const slots = await caller.calendar.getDoctorSlots({
        startDate: today.toISOString().split("T")[0],
        endDate: nextWeek.toISOString().split("T")[0],
        statusFilter: ["available"],
      });

      if (slots.length > 0) {
        const slotToBlock = slots[0].id;

        const result = await caller.calendar.blockSlot({
          slotId: slotToBlock,
          reason: "Personal appointment",
        });

        expect(result.success).toBe(true);

        // Verify slot is blocked
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [blockedSlot] = await db
          .select()
          .from(calendarSlots)
          .where(eq(calendarSlots.id, slotToBlock));

        expect(blockedSlot.status).toBe("blocked");
      }
    });

    it("should not show blocked slots to patients", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const availableSlots = await caller.calendar.getAvailableSlots({
        doctorId,
        startDate: today.toISOString().split("T")[0],
        endDate: nextWeek.toISOString().split("T")[0],
      });

      // All returned slots should be available
      expect(
        availableSlots.every((slot) => slot.status === "available")
      ).toBe(true);
    });
  });

  describe("Booking Rejection", () => {
    let rejectionTestSlotId: number;
    let rejectionRequestId: number;

    it("should create another booking request for rejection test", async () => {
      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      // Get an available slot
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const slots = await caller.calendar.getDoctorSlots({
        startDate: today.toISOString().split("T")[0],
        endDate: nextWeek.toISOString().split("T")[0],
        statusFilter: ["available"],
      });

      if (slots.length > 0) {
        rejectionTestSlotId = slots[0].id;

        const patientCaller = appRouter.createCaller(
          createPatientContext(patientId)
        );

        await patientCaller.calendar.createBookingRequest({
          slotId: rejectionTestSlotId,
          chiefComplaint: "Test rejection",
        });

        const pendingRequests = await caller.calendar.getPendingRequests();
        const testRequest = pendingRequests.find(
          (r) => r.slotId === rejectionTestSlotId
        );
        expect(testRequest).toBeDefined();
        if (testRequest) {
          rejectionRequestId = testRequest.id;
        }
      }
    });

    it("should allow doctor to reject booking request", async () => {
      if (!rejectionRequestId) {
        console.log("Skipping rejection test - no request created");
        return;
      }

      const caller = appRouter.createCaller(createDoctorContext(doctorId));

      const result = await caller.calendar.rejectBookingRequest({
        requestId: rejectionRequestId,
        reason: "Time slot no longer available",
      });

      expect(result.success).toBe(true);
    });

    it("should release slot when booking is rejected", async () => {
      if (!rejectionTestSlotId) {
        console.log("Skipping slot release test - no slot created");
        return;
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [slot] = await db
        .select()
        .from(calendarSlots)
        .where(eq(calendarSlots.id, rejectionTestSlotId));

      expect(slot.status).toBe("available");
      expect(slot.patientId).toBeNull();
    });
  });

  describe("Authorization", () => {
    it("should prevent non-doctors from setting working hours", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      await expect(
        caller.calendar.setWorkingHours({
          dayOfWeek: 1,
          startTime: "09:00:00",
          endTime: "17:00:00",
          slotDuration: 30,
        })
      ).rejects.toThrow();
    });

    it("should prevent non-doctors from generating slots", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      await expect(
        caller.calendar.generateSlots({ days: 7 })
      ).rejects.toThrow();
    });

    it("should prevent non-doctors from confirming bookings", async () => {
      const caller = appRouter.createCaller(createPatientContext(patientId));

      await expect(
        caller.calendar.confirmBookingRequest({ requestId: 1 })
      ).rejects.toThrow();
    });
  });
});
