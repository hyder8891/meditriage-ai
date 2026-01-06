/**
 * Clinic Finder Router Tests
 * Tests for Iraq clinic finder API endpoints
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { getDb } from './db';
import { iraqClinics, iraqGovernorates } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Clinic Finder', () => {
  describe('Database Tables', () => {
    it('should have iraq_clinics table with data', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const clinics = await db.select().from(iraqClinics).limit(5);
      expect(clinics.length).toBeGreaterThan(0);
      expect(clinics[0]).toHaveProperty('name');
      expect(clinics[0]).toHaveProperty('governorate');
      expect(clinics[0]).toHaveProperty('facilityType');
    });

    it('should have iraq_governorates table with 18 governorates', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const governorates = await db.select().from(iraqGovernorates);
      expect(governorates.length).toBe(18);
      
      // Check for key governorates
      const names = governorates.map(g => g.name);
      expect(names).toContain('Baghdad');
      expect(names).toContain('Basra');
      expect(names).toContain('Erbil');
      expect(names).toContain('Nineveh');
    });

    it('should have clinics for Baghdad governorate', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const baghdadClinics = await db.select()
        .from(iraqClinics)
        .where(eq(iraqClinics.governorate, 'Baghdad'));
      
      expect(baghdadClinics.length).toBeGreaterThan(5);
    });
  });

  describe('Clinic Data Structure', () => {
    it('should have proper clinic data fields', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const [clinic] = await db.select().from(iraqClinics).limit(1);
      
      expect(clinic).toHaveProperty('id');
      expect(clinic).toHaveProperty('name');
      expect(clinic).toHaveProperty('nameArabic');
      expect(clinic).toHaveProperty('governorate');
      expect(clinic).toHaveProperty('city');
      expect(clinic).toHaveProperty('facilityType');
      expect(clinic).toHaveProperty('hasEmergency');
      expect(clinic).toHaveProperty('has24Hours');
      expect(clinic).toHaveProperty('isActive');
    });

    it('should have valid facility types', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const clinics = await db.select({ facilityType: iraqClinics.facilityType })
        .from(iraqClinics)
        .limit(50);
      
      const validTypes = [
        'teaching_hospital',
        'general_hospital',
        'private_hospital',
        'military_hospital',
        'maternity_hospital',
        'children_hospital',
        'specialized_hospital',
        'medical_city',
        'clinic',
        'health_center',
        'emergency_center'
      ];
      
      clinics.forEach(c => {
        expect(validTypes).toContain(c.facilityType);
      });
    });
  });

  describe('Governorate Data Structure', () => {
    it('should have proper governorate data fields', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const [gov] = await db.select().from(iraqGovernorates).limit(1);
      
      expect(gov).toHaveProperty('id');
      expect(gov).toHaveProperty('name');
      expect(gov).toHaveProperty('nameArabic');
      expect(gov).toHaveProperty('capital');
      expect(gov).toHaveProperty('latitude');
      expect(gov).toHaveProperty('longitude');
      expect(gov).toHaveProperty('region');
    });

    it('should have valid coordinates for all governorates', async () => {
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }
      
      const governorates = await db.select().from(iraqGovernorates);
      
      governorates.forEach(gov => {
        const lat = Number(gov.latitude);
        const lon = Number(gov.longitude);
        
        // Iraq coordinates range approximately
        expect(lat).toBeGreaterThan(29);
        expect(lat).toBeLessThan(38);
        expect(lon).toBeGreaterThan(38);
        expect(lon).toBeLessThan(49);
      });
    });
  });
});
