/**
 * Database helpers for weather and barometric pressure tracking
 * Part of Avicenna-x Feature #6: Environmental Health Correlations
 */

import { getDb } from "./db";
import {
  weatherConditions,
  pressureSensitiveConditions,
  patientPressureSensitivity,
  pressureSymptomEvents,
  type WeatherCondition,
  type PressureSensitiveCondition,
  type PatientPressureSensitivity,
  type PressureSymptomEvent,
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

/**
 * Store weather observation in database
 */
export async function insertWeatherCondition(data: {
  latitude: number;
  longitude: number;
  cityName?: string;
  countryCode?: string;
  pressure: number;
  temperature?: number;
  humidity?: number;
  weatherCondition?: string;
  windSpeed?: number;
  pressureChange1h?: number;
  pressureChange3h?: number;
  pressureChange24h?: number;
  observedAt: Date;
  source?: string;
  externalId?: string;
}): Promise<WeatherCondition> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [inserted] = await db.insert(weatherConditions).values({
    latitude: data.latitude.toString(),
    longitude: data.longitude.toString(),
    cityName: data.cityName,
    countryCode: data.countryCode,
    pressure: data.pressure.toString(),
    temperature: data.temperature?.toString(),
    humidity: data.humidity,
    weatherCondition: data.weatherCondition,
    windSpeed: data.windSpeed?.toString(),
    pressureChange1h: data.pressureChange1h?.toString(),
    pressureChange3h: data.pressureChange3h?.toString(),
    pressureChange24h: data.pressureChange24h?.toString(),
    observedAt: data.observedAt,
    source: data.source || "openweather",
    externalId: data.externalId,
  });

  return inserted as any as WeatherCondition;
}

/**
 * Get weather history for a location
 */
export async function getWeatherHistory(
  latitude: number,
  longitude: number,
  hoursBack: number = 24
): Promise<Array<{ pressure: number; timestamp: Date }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  // Find weather records within ~0.1 degree radius
  const latMin = latitude - 0.1;
  const latMax = latitude + 0.1;
  const lonMin = longitude - 0.1;
  const lonMax = longitude + 0.1;

  const records = await db
    .select({
      pressure: weatherConditions.pressure,
      observedAt: weatherConditions.observedAt,
    })
    .from(weatherConditions)
    .where(
      and(
        gte(weatherConditions.observedAt, cutoffTime),
        sql`CAST(${weatherConditions.latitude} AS DECIMAL(10,7)) >= ${latMin}`,
        sql`CAST(${weatherConditions.latitude} AS DECIMAL(10,7)) <= ${latMax}`,
        sql`CAST(${weatherConditions.longitude} AS DECIMAL(10,7)) >= ${lonMin}`,
        sql`CAST(${weatherConditions.longitude} AS DECIMAL(10,7)) <= ${lonMax}`
      )
    )
    .orderBy(desc(weatherConditions.observedAt))
    .limit(100);

  return records.map((r: any) => ({
    pressure: parseFloat(r.pressure as string),
    timestamp: r.observedAt,
  }));
}

/**
 * Get most recent weather for a location
 */
export async function getLatestWeather(
  latitude: number,
  longitude: number
): Promise<WeatherCondition | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const latMin = latitude - 0.1;
  const latMax = latitude + 0.1;
  const lonMin = longitude - 0.1;
  const lonMax = longitude + 0.1;

  const [latest] = await db
    .select()
    .from(weatherConditions)
    .where(
      and(
        sql`CAST(${weatherConditions.latitude} AS DECIMAL(10,7)) >= ${latMin}`,
        sql`CAST(${weatherConditions.latitude} AS DECIMAL(10,7)) <= ${latMax}`,
        sql`CAST(${weatherConditions.longitude} AS DECIMAL(10,7)) >= ${lonMin}`,
        sql`CAST(${weatherConditions.longitude} AS DECIMAL(10,7)) <= ${lonMax}`
      )
    )
    .orderBy(desc(weatherConditions.observedAt))
    .limit(1);

  return latest || null;
}

/**
 * Get all pressure-sensitive conditions
 */
export async function getAllPressureSensitiveConditions(): Promise<
  PressureSensitiveCondition[]
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(pressureSensitiveConditions);
}

/**
 * Get pressure-sensitive condition by ID
 */
export async function getPressureSensitiveConditionById(
  id: number
): Promise<PressureSensitiveCondition | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [condition] = await db
    .select()
    .from(pressureSensitiveConditions)
    .where(eq(pressureSensitiveConditions.id, id))
    .limit(1);

  return condition || null;
}

/**
 * Get patient's pressure sensitivities
 */
export async function getPatientPressureSensitivities(
  userId: number
): Promise<PatientPressureSensitivity[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(patientPressureSensitivity)
    .where(eq(patientPressureSensitivity.userId, userId));
}

/**
 * Add or update patient pressure sensitivity
 */
export async function upsertPatientPressureSensitivity(data: {
  userId: number;
  conditionId: number;
  confirmed?: boolean;
  sensitivity?: "low" | "moderate" | "high" | "severe";
  typicalDropTrigger?: number;
  typicalRiseTrigger?: number;
  typicalOnsetDelay?: number;
  notes?: string;
}): Promise<PatientPressureSensitivity> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if exists
  const [existing] = await db
    .select()
    .from(patientPressureSensitivity)
    .where(
      and(
        eq(patientPressureSensitivity.userId, data.userId),
        eq(patientPressureSensitivity.conditionId, data.conditionId)
      )
    )
    .limit(1);

  if (existing) {
    // Update
    const [updated] = await db
      .update(patientPressureSensitivity)
      .set({
        confirmed: data.confirmed ?? existing.confirmed,
        sensitivity: data.sensitivity ?? existing.sensitivity,
        typicalDropTrigger: data.typicalDropTrigger?.toString() ?? existing.typicalDropTrigger,
        typicalRiseTrigger: data.typicalRiseTrigger?.toString() ?? existing.typicalRiseTrigger,
        typicalOnsetDelay: data.typicalOnsetDelay ?? existing.typicalOnsetDelay,
        notes: data.notes ?? existing.notes,
        lastUpdated: new Date(),
      })
      .where(eq(patientPressureSensitivity.id, existing.id));

    return updated as any as PatientPressureSensitivity;
  } else {
    // Insert
    const [inserted] = await db.insert(patientPressureSensitivity).values({
      userId: data.userId,
      conditionId: data.conditionId,
      confirmed: data.confirmed ?? false,
      sensitivity: data.sensitivity ?? "moderate",
      typicalDropTrigger: data.typicalDropTrigger?.toString(),
      typicalRiseTrigger: data.typicalRiseTrigger?.toString(),
      typicalOnsetDelay: data.typicalOnsetDelay,
      notes: data.notes,
    });

    return inserted as any as PatientPressureSensitivity;
  }
}

/**
 * Record a pressure symptom event
 */
export async function insertPressureSymptomEvent(data: {
  userId: number;
  sensitivityId: number;
  weatherId?: number;
  symptomOnset: Date;
  symptomResolution?: Date;
  severity: number;
  pressureAtOnset?: number;
  pressureChange1h?: number;
  pressureChange3h?: number;
  temperatureAtOnset?: number;
  humidityAtOnset?: number;
  symptoms?: string[];
  interventionTaken?: string;
  interventionEffectiveness?: number;
  notes?: string;
}): Promise<PressureSymptomEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [inserted] = await db.insert(pressureSymptomEvents).values({
    userId: data.userId,
    sensitivityId: data.sensitivityId,
    weatherId: data.weatherId,
    symptomOnset: data.symptomOnset,
    symptomResolution: data.symptomResolution,
    severity: data.severity,
    pressureAtOnset: data.pressureAtOnset?.toString(),
    pressureChange1h: data.pressureChange1h?.toString(),
    pressureChange3h: data.pressureChange3h?.toString(),
    temperatureAtOnset: data.temperatureAtOnset?.toString(),
    humidityAtOnset: data.humidityAtOnset,
    symptoms: data.symptoms ? JSON.stringify(data.symptoms) : null,
    interventionTaken: data.interventionTaken,
    interventionEffectiveness: data.interventionEffectiveness,
    notes: data.notes,
  });

  return inserted as any as PressureSymptomEvent;
}

/**
 * Get patient's pressure symptom history
 */
export async function getPatientPressureSymptomHistory(
  userId: number,
  daysBack: number = 30
): Promise<PressureSymptomEvent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(pressureSymptomEvents)
    .where(
      and(
        eq(pressureSymptomEvents.userId, userId),
        gte(pressureSymptomEvents.symptomOnset, cutoffDate)
      )
    )
    .orderBy(desc(pressureSymptomEvents.symptomOnset));
}

/**
 * Update symptom frequency statistics for a patient sensitivity
 */
export async function updateSymptomFrequency(
  sensitivityId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get events from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const events = await db
    .select()
    .from(pressureSymptomEvents)
    .where(
      and(
        eq(pressureSymptomEvents.sensitivityId, sensitivityId),
        gte(pressureSymptomEvents.symptomOnset, thirtyDaysAgo)
      )
    );

  if (events.length === 0) return;

  // Calculate average severity
  const avgSeverity = Math.round(
    events.reduce((sum: number, e: any) => sum + e.severity, 0) / events.length
  );

  // Get most recent event date
  const lastSymptomDate = events[0]?.symptomOnset;

  // Update the sensitivity record
  await db
    .update(patientPressureSensitivity)
    .set({
      symptomFrequency: events.length,
      averageSeverity: avgSeverity,
      lastSymptomDate: lastSymptomDate,
      lastUpdated: new Date(),
    })
    .where(eq(patientPressureSensitivity.id, sensitivityId));
}
