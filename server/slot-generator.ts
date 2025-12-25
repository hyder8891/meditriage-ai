/**
 * Slot Generation Service
 * Automatically generates calendar slots from doctor working hours
 */

import {
  getDoctorWorkingHours,
  getDoctorExceptions,
  bulkCreateSlots,
  checkSlotConflicts,
  recordSlotGeneration,
} from "./calendar-db";

interface GenerateSlotOptions {
  doctorId: number;
  startDate: Date;
  endDate: Date;
  triggeredBy?: number;
}

interface TimeSlot {
  doctorId: number;
  slotDate: Date;
  startTime: string;
  endTime: string;
  slotStart: Date;
  slotEnd: Date;
  status: "available";
  slotType: "regular";
  generatedFrom: number;
  isManual: boolean;
}

/**
 * Generate calendar slots for a doctor based on their working hours
 */
export async function generateSlotsForDoctor(
  options: GenerateSlotOptions
): Promise<{ success: boolean; slotsGenerated: number; error?: string }> {
  const { doctorId, startDate, endDate, triggeredBy } = options;

  try {
    // Get doctor's working hours
    const workingHours = await getDoctorWorkingHours(doctorId);
    if (workingHours.length === 0) {
      return {
        success: false,
        slotsGenerated: 0,
        error: "No working hours configured for this doctor",
      };
    }

    // Get availability exceptions
    const exceptions = await getDoctorExceptions(doctorId, startDate, endDate);
    const exceptionMap = new Map(
      exceptions.map((ex) => [ex.exceptionDate.toISOString().split("T")[0], ex])
    );

    // Generate slots
    const slots: TimeSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();

      // Check for exceptions
      const exception = exceptionMap.get(dateStr);
      if (exception) {
        if (exception.exceptionType === "unavailable") {
          // Skip this day
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        // Handle custom hours if needed
        if (exception.exceptionType === "custom_hours" && exception.customStartTime && exception.customEndTime) {
          // Generate slots for custom hours
          const customSlots = generateSlotsForDay(
            doctorId,
            currentDate,
            exception.customStartTime,
            exception.customEndTime,
            30, // default slot duration
            0, // no buffer
            -1 // no working hours ID for exceptions
          );
          slots.push(...customSlots);
        }
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Find working hours for this day of week
      const dayWorkingHours = workingHours.filter(
        (wh) => wh.dayOfWeek === dayOfWeek && wh.isActive
      );

      for (const wh of dayWorkingHours) {
        const daySlots = generateSlotsForDay(
          doctorId,
          currentDate,
          wh.startTime,
          wh.endTime,
          wh.slotDuration,
          wh.bufferTime || 0,
          wh.id
        );
        slots.push(...daySlots);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check for conflicts and filter out overlapping slots
    const validSlots: TimeSlot[] = [];
    for (const slot of slots) {
      const conflicts = await checkSlotConflicts(
        doctorId,
        slot.slotStart,
        slot.slotEnd
      );
      if (conflicts.length === 0) {
        validSlots.push(slot);
      }
    }

    // Bulk insert slots
    if (validSlots.length > 0) {
      await bulkCreateSlots(validSlots);
    }

    // Record generation history
    await recordSlotGeneration({
      doctorId,
      startDate,
      endDate,
      slotsGenerated: validSlots.length,
      workingHoursUsed: JSON.stringify(workingHours.map((wh) => wh.id)),
      generationType: "automatic" as const,
      triggeredBy,
      status: "success" as const,
    });

    return {
      success: true,
      slotsGenerated: validSlots.length,
    };
  } catch (error) {
    console.error("Error generating slots:", error);

    // Record failure
    await recordSlotGeneration({
      doctorId,
      startDate,
      endDate,
      slotsGenerated: 0,
      generationType: "automatic" as const,
      triggeredBy,
      status: "failed" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      slotsGenerated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate slots for a single day
 */
function generateSlotsForDay(
  doctorId: number,
  date: Date,
  startTime: string,
  endTime: string,
  slotDuration: number,
  bufferTime: number,
  workingHoursId: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dateStr = date.toISOString().split("T")[0];

  // Parse start and end times
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  // Create start datetime
  const currentSlot = new Date(date);
  currentSlot.setHours(startHour, startMinute, 0, 0);

  // Create end datetime
  const endDateTime = new Date(date);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  // Generate slots
  while (currentSlot < endDateTime) {
    const slotEnd = new Date(currentSlot);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    // Don't create slot if it extends beyond working hours
    if (slotEnd > endDateTime) {
      break;
    }

    // Don't create slots in the past
    if (currentSlot > new Date()) {
      const slotStartTime = `${String(currentSlot.getHours()).padStart(2, "0")}:${String(currentSlot.getMinutes()).padStart(2, "0")}:00`;
      const slotEndTime = `${String(slotEnd.getHours()).padStart(2, "0")}:${String(slotEnd.getMinutes()).padStart(2, "0")}:00`;

      slots.push({
        doctorId,
        slotDate: new Date(dateStr),
        startTime: slotStartTime,
        endTime: slotEndTime,
        slotStart: new Date(currentSlot),
        slotEnd: new Date(slotEnd),
        status: "available",
        slotType: "regular",
        generatedFrom: workingHoursId,
        isManual: false,
      });
    }

    // Move to next slot (duration + buffer)
    currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration + bufferTime);
  }

  return slots;
}

/**
 * Generate slots for next N days
 */
export async function generateSlotsForNextDays(
  doctorId: number,
  days: number,
  triggeredBy?: number
): Promise<{ success: boolean; slotsGenerated: number; error?: string }> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return generateSlotsForDoctor({
    doctorId,
    startDate,
    endDate,
    triggeredBy,
  });
}

/**
 * Generate slots for a specific date range
 */
export async function generateSlotsForDateRange(
  doctorId: number,
  startDate: string,
  endDate: string,
  triggeredBy?: number
): Promise<{ success: boolean; slotsGenerated: number; error?: string }> {
  return generateSlotsForDoctor({
    doctorId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    triggeredBy,
  });
}
