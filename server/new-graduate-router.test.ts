import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { hospitalAffiliations, doctorShifts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("New Graduate Router - Database Operations", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");
  });

  describe("Hospital Affiliations", () => {
    it("should accept correct field names for hospital affiliations", async () => {
      const testData = {
        doctorId: 999999,
        facilityId: 1,
        affiliationType: "staff" as const,
        department: "Emergency",
        position: "Resident",
        startDate: new Date("2026-01-01"),
        status: "pending" as const,
        verificationStatus: "pending" as const,
      };

      // Test that the insert accepts the correct camelCase field names
      const result = await db!.insert(hospitalAffiliations).values(testData);
      expect(result).toBeDefined();

      // Clean up
      await db!.delete(hospitalAffiliations).where(eq(hospitalAffiliations.doctorId, 999999));
    });

    it("should handle date conversion correctly", async () => {
      const dateString = "2026-02-01";
      const testData = {
        doctorId: 999998,
        facilityId: 1,
        affiliationType: "visiting" as const,
        startDate: new Date(dateString),
        endDate: new Date("2026-12-31"),
        status: "pending" as const,
        verificationStatus: "pending" as const,
      };

      const result = await db!.insert(hospitalAffiliations).values(testData);
      expect(result).toBeDefined();

      // Verify the data was inserted correctly
      const inserted = await db!
        .select()
        .from(hospitalAffiliations)
        .where(eq(hospitalAffiliations.doctorId, 999998))
        .limit(1);

      expect(inserted[0]).toBeDefined();
      expect(inserted[0].startDate).toBeInstanceOf(Date);

      // Clean up
      await db!.delete(hospitalAffiliations).where(eq(hospitalAffiliations.doctorId, 999998));
    });
  });

  describe("Doctor Shifts", () => {
    it("should accept correct field names for doctor shifts", async () => {
      const testData = {
        doctorId: 999997,
        facilityId: 1,
        shiftDate: new Date("2026-01-15"),
        startTime: "08:00:00",
        endTime: "16:00:00",
        shiftType: "day" as const,
        status: "scheduled" as const,
      };

      // Test that the insert accepts the correct camelCase field names
      const result = await db!.insert(doctorShifts).values(testData);
      expect(result).toBeDefined();

      // Clean up
      await db!.delete(doctorShifts).where(eq(doctorShifts.doctorId, 999997));
    });

    it("should handle shift date conversion correctly", async () => {
      const dateString = "2026-01-20";
      const testData = {
        doctorId: 999996,
        facilityId: 1,
        shiftDate: new Date(dateString),
        startTime: "18:00:00",
        endTime: "02:00:00",
        shiftType: "night" as const,
        status: "scheduled" as const,
      };

      const result = await db!.insert(doctorShifts).values(testData);
      expect(result).toBeDefined();

      // Verify the data was inserted correctly
      const inserted = await db!
        .select()
        .from(doctorShifts)
        .where(eq(doctorShifts.doctorId, 999996))
        .limit(1);

      expect(inserted[0]).toBeDefined();
      expect(inserted[0].shiftDate).toBeInstanceOf(Date);
      expect(inserted[0].shiftType).toBe("night");

      // Clean up
      await db!.delete(doctorShifts).where(eq(doctorShifts.doctorId, 999996));
    });

    it("should support all shift types", async () => {
      const shiftTypes = ["day", "evening", "night", "on_call", "emergency"] as const;
      
      for (let i = 0; i < shiftTypes.length; i++) {
        const testData = {
          doctorId: 999990 + i,
          facilityId: 1,
          shiftDate: new Date("2026-01-25"),
          startTime: "08:00:00",
          endTime: "16:00:00",
          shiftType: shiftTypes[i],
          status: "scheduled" as const,
        };

        const result = await db!.insert(doctorShifts).values(testData);
        expect(result).toBeDefined();

        // Clean up
        await db!.delete(doctorShifts).where(eq(doctorShifts.doctorId, 999990 + i));
      }
    });
  });
});
