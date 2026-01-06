/**
 * Clinic Finder Database Helpers
 * Query functions for Iraq clinics/hospitals
 */

import { getDb } from "./db";
import { iraqClinics } from "../drizzle/schema";
import { eq, and, or, sql, desc, asc } from "drizzle-orm";

export interface ClinicSearchParams {
  governorate?: string;
  city?: string;
  facilityType?: string;
  specialty?: string;
  hasEmergency?: boolean;
  has24Hours?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get clinics by governorate
 */
export async function getClinicsByGovernorate(governorate: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.governorate, governorate),
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(limit);
}

/**
 * Get clinics by city
 */
export async function getClinicsByCity(city: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.city, city),
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(limit);
}

/**
 * Search clinics with multiple filters
 */
export async function searchClinics(params: ClinicSearchParams) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(iraqClinics.isActive, true)];
  
  if (params.governorate) {
    conditions.push(eq(iraqClinics.governorate, params.governorate));
  }
  
  if (params.city) {
    conditions.push(eq(iraqClinics.city, params.city));
  }
  
  if (params.facilityType) {
    conditions.push(eq(iraqClinics.facilityType, params.facilityType as any));
  }
  
  if (params.hasEmergency) {
    conditions.push(eq(iraqClinics.hasEmergency, true));
  }
  
  if (params.has24Hours) {
    conditions.push(eq(iraqClinics.has24Hours, true));
  }
  
  return db.select()
    .from(iraqClinics)
    .where(and(...conditions))
    .orderBy(desc(iraqClinics.bedCount))
    .limit(params.limit || 10)
    .offset(params.offset || 0);
}

/**
 * Get clinic by ID
 */
export async function getClinicById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(iraqClinics)
    .where(eq(iraqClinics.id, id))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get all clinics (with pagination)
 */
export async function getAllClinics(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(iraqClinics)
    .where(eq(iraqClinics.isActive, true))
    .orderBy(asc(iraqClinics.governorate), desc(iraqClinics.bedCount))
    .limit(limit)
    .offset(offset);
}

/**
 * Get clinic count by governorate
 */
export async function getClinicCountByGovernorate() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    governorate: iraqClinics.governorate,
    governorateArabic: iraqClinics.governorateArabic,
    count: sql<number>`count(*)`.as('count'),
  })
    .from(iraqClinics)
    .where(eq(iraqClinics.isActive, true))
    .groupBy(iraqClinics.governorate, iraqClinics.governorateArabic)
    .orderBy(desc(sql`count(*)`));
  
  return result;
}

/**
 * Get clinics with emergency services in a governorate
 */
export async function getEmergencyClinics(governorate: string, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.governorate, governorate),
        eq(iraqClinics.hasEmergency, true),
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(limit);
}

/**
 * Get hospitals by specialty
 */
export async function getClinicsBySpecialty(governorate: string, specialty: string, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(iraqClinics)
    .where(
      and(
        eq(iraqClinics.governorate, governorate),
        sql`JSON_CONTAINS(${iraqClinics.specialties}, ${JSON.stringify(specialty)})`,
        eq(iraqClinics.isActive, true)
      )
    )
    .orderBy(desc(iraqClinics.bedCount))
    .limit(limit);
}

/**
 * Get recommended clinics based on triage result
 */
export async function getRecommendedClinics(
  governorate: string, 
  urgencyLevel: 'critical' | 'urgent' | 'standard' | 'non-urgent',
  specialty?: string,
  limit = 3
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [
    eq(iraqClinics.governorate, governorate),
    eq(iraqClinics.isActive, true),
  ];
  
  if (urgencyLevel === 'critical' || urgencyLevel === 'urgent') {
    conditions.push(eq(iraqClinics.hasEmergency, true));
    conditions.push(eq(iraqClinics.has24Hours, true));
  }
  
  if (urgencyLevel === 'critical') {
    conditions.push(
      or(
        eq(iraqClinics.facilityType, 'teaching_hospital'),
        eq(iraqClinics.facilityType, 'medical_city'),
        eq(iraqClinics.facilityType, 'emergency_center')
      )
    );
  }
  
  const clinics = await db.select()
    .from(iraqClinics)
    .where(and(...conditions))
    .orderBy(desc(iraqClinics.bedCount))
    .limit(limit);
  
  if (clinics.length === 0) {
    return db.select()
      .from(iraqClinics)
      .where(
        and(
          eq(iraqClinics.governorate, governorate),
          eq(iraqClinics.isActive, true)
        )
      )
      .orderBy(desc(iraqClinics.bedCount))
      .limit(limit);
  }
  
  return clinics;
}

/**
 * Get total clinic count
 */
export async function getTotalClinicCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({
    count: sql<number>`count(*)`.as('count'),
  })
    .from(iraqClinics)
    .where(eq(iraqClinics.isActive, true));
  
  return result[0]?.count || 0;
}
