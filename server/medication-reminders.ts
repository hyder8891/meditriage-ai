/**
 * Medication Reminder System
 * Handles automated reminders for patient medication schedules
 */

import { getDb } from './db';
import { prescriptions, medicationAdherence } from '../drizzle/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';

interface ReminderSchedule {
  prescriptionId: number;
  patientId: number;
  medicationName: string;
  dosage: string;
  scheduledTime: Date;
}

/**
 * Generate reminder schedules for a prescription based on frequency
 */
export function generateReminderSchedules(
  prescription: any,
  startDate: Date,
  endDate: Date
): Date[] {
  const schedules: Date[] = [];
  const frequency = prescription.frequency.toLowerCase();
  
  // Parse frequency to determine times per day
  let timesPerDay = 1;
  let hoursBetween = 24;
  
  if (frequency.includes('once') || frequency.includes('daily') || frequency.includes('يومياً')) {
    timesPerDay = 1;
    hoursBetween = 24;
  } else if (frequency.includes('twice') || frequency.includes('مرتين')) {
    timesPerDay = 2;
    hoursBetween = 12;
  } else if (frequency.includes('three times') || frequency.includes('ثلاث مرات')) {
    timesPerDay = 3;
    hoursBetween = 8;
  } else if (frequency.includes('four times') || frequency.includes('أربع مرات')) {
    timesPerDay = 4;
    hoursBetween = 6;
  } else if (frequency.includes('every') && frequency.includes('hours')) {
    const match = frequency.match(/(\d+)\s*hours/);
    if (match) {
      hoursBetween = parseInt(match[1]);
      timesPerDay = Math.floor(24 / hoursBetween);
    }
  }
  
  // Generate schedules for each day
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    // Default start time: 8 AM
    const baseHour = 8;
    
    for (let i = 0; i < timesPerDay; i++) {
      const scheduleTime = new Date(currentDate);
      scheduleTime.setHours(baseHour + (i * hoursBetween), 0, 0, 0);
      
      // Only add future schedules
      if (scheduleTime > new Date()) {
        schedules.push(new Date(scheduleTime));
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedules;
}

/**
 * Create adherence records with reminder schedules for a prescription
 */
export async function createMedicationReminders(prescriptionId: number) {
  // Get prescription details
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const prescription = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, prescriptionId))
    .limit(1);
  
  if (!prescription || prescription.length === 0) {
    throw new Error('Prescription not found');
  }
  
  const rx = prescription[0];
  
  // Calculate end date if not provided
  let endDate = rx.endDate;
  if (!endDate && rx.duration) {
    endDate = new Date(rx.startDate);
    endDate.setDate(endDate.getDate() + rx.duration);
  }
  
  if (!endDate) {
    // Default to 30 days if no end date specified
    endDate = new Date(rx.startDate);
    endDate.setDate(endDate.getDate() + 30);
  }
  
  // Generate reminder schedules
  const schedules = generateReminderSchedules(rx, rx.startDate, endDate);
  
  // Create adherence records
  const adherenceRecords = schedules.map(scheduledTime => ({
    prescriptionId: rx.id,
    patientId: rx.patientId,
    scheduledTime,
    taken: false,
    missed: false,
    reminderSent: false,
  }));
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < adherenceRecords.length; i += batchSize) {
    const batch = adherenceRecords.slice(i, i + batchSize);
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    await db.insert(medicationAdherence).values(batch);
  }
  
  return {
    success: true,
    schedulesCreated: adherenceRecords.length,
  };
}

/**
 * Get upcoming medication reminders for a patient
 */
export async function getUpcomingReminders(
  patientId: number,
  hoursAhead: number = 24
) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const reminders = await db
    .select({
      id: medicationAdherence.id,
      prescriptionId: medicationAdherence.prescriptionId,
      scheduledTime: medicationAdherence.scheduledTime,
      taken: medicationAdherence.taken,
      reminderSent: medicationAdherence.reminderSent,
      medicationName: prescriptions.medicationName,
      dosage: prescriptions.dosage,
      instructions: prescriptions.instructions,
    })
    .from(medicationAdherence)
    .innerJoin(
      prescriptions,
      eq(medicationAdherence.prescriptionId, prescriptions.id)
    )
    .where(
      and(
        eq(medicationAdherence.patientId, patientId),
        eq(medicationAdherence.taken, false),
        gte(medicationAdherence.scheduledTime, now),
        lte(medicationAdherence.scheduledTime, futureTime)
      )
    )
    .orderBy(medicationAdherence.scheduledTime);
  
  return reminders;
}

/**
 * Get reminders that need to be sent (15 minutes before scheduled time)
 */
export async function getRemindersToSend() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes ahead
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const reminders = await db
    .select({
      id: medicationAdherence.id,
      patientId: medicationAdherence.patientId,
      prescriptionId: medicationAdherence.prescriptionId,
      scheduledTime: medicationAdherence.scheduledTime,
      medicationName: prescriptions.medicationName,
      dosage: prescriptions.dosage,
      instructions: prescriptions.instructions,
    })
    .from(medicationAdherence)
    .innerJoin(
      prescriptions,
      eq(medicationAdherence.prescriptionId, prescriptions.id)
    )
    .where(
      and(
        eq(medicationAdherence.reminderSent, false),
        eq(medicationAdherence.taken, false),
        lte(medicationAdherence.scheduledTime, reminderWindow),
        gte(medicationAdherence.scheduledTime, now)
      )
    );
  
  return reminders;
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(adherenceId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(medicationAdherence)
    .set({
      reminderSent: true,
      reminderSentAt: new Date(),
    })
    .where(eq(medicationAdherence.id, adherenceId));
}

/**
 * Send medication reminder notification
 * This would integrate with SMS/email service or push notifications
 */
export async function sendMedicationReminder(reminder: any) {
  // TODO: Integrate with notification service (SMS, email, push)
  // For now, we'll just mark it as sent
  
  const message = `Medication Reminder: Time to take ${reminder.medicationName} (${reminder.dosage}). ${reminder.instructions || ''}`;
  
  console.log(`[Reminder] Patient ${reminder.patientId}: ${message}`);
  
  // Mark as sent
  await markReminderSent(reminder.id);
  
  return {
    success: true,
    message,
  };
}

/**
 * Process pending reminders (to be called by a scheduled job)
 */
export async function processPendingReminders() {
  const reminders = await getRemindersToSend();
  
  const results = [];
  for (const reminder of reminders) {
    try {
      const result = await sendMedicationReminder(reminder);
      results.push({ ...reminder, ...result });
    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error);
      results.push({ ...reminder, success: false, error });
    }
  }
  
  return {
    processed: results.length,
    results,
  };
}
