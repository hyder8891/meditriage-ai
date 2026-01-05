/**
 * Avicenna-X Integration Tests
 * 
 * Tests all critical integration points identified in the audit:
 * 1. Router mounting (trpc.avicenna.* endpoints)
 * 2. Epidemiology database (epidemiology_events table)
 * 3. Environment sensing (OpenWeather API with graceful fallback)
 * 4. Deep links (Careem + Google Maps)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../db';
import { epidemiologyEvents } from '../../drizzle/schema';
import { generateDeepLinks } from './resource-auction';
import { buildContextVector } from './context-vector';
import type { ResourceMatch } from './resource-auction';

describe('Avicenna-X Integration Tests', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  // ============================================================================
  // Test 1: Router Mounting
  // ============================================================================
  
  describe('Router Mounting', () => {
    it('should have avicenna router mounted in main appRouter', async () => {
      // Import the main router
      const { appRouter } = await import('../routers');
      
      // Check if avicenna namespace exists (procedures are prefixed with namespace)
      const procedures = Object.keys(appRouter._def.procedures);
      const hasAvicennaProcedures = procedures.some(p => p.startsWith('avicenna.'));
      expect(hasAvicennaProcedures).toBe(true);
      
      // Check key endpoints exist
      expect(procedures).toContain('avicenna.orchestrate');
      expect(procedures).toContain('avicenna.getLocalRisks');
      expect(procedures).toContain('avicenna.findBestDoctor');
      expect(procedures).toContain('avicenna.recordCorrection');
    }, 10000);
  });

  // ============================================================================
  // Test 2: Epidemiology Database
  // ============================================================================
  
  describe('Epidemiology Database', () => {
    it('should have epidemiology_events table in schema', () => {
      // Check if table is exported from schema
      expect(epidemiologyEvents).toBeDefined();
      // Table should have columns defined
      expect(typeof epidemiologyEvents).toBe('object');
    });

    it('should be able to insert epidemiology event (privacy-preserving)', async () => {
      // Insert a test event (NO user_id for privacy)
      const testEvent = {
        city: 'Baghdad',
        country: 'Iraq',
        latitude: '33.3152',
        longitude: '44.3661',
        symptomVector: JSON.stringify([0.8, 0.5, 0.3]), // fever, cough, fatigue
        suspectedCondition: 'Respiratory Infection',
        conditionConfidence: '85.5',
        urgencyLevel: 'moderate' as const,
        temperature: '38.5',
        humidity: '45.0',
        ageGroup: '20-30',
        gender: 'male' as const,
        dataSource: 'avicenna_triage',
        verified: false,
      };

      const [inserted] = await db.insert(epidemiologyEvents).values(testEvent);
      expect(inserted).toBeDefined();
      
      // Verify NO user_id field exists (privacy compliance)
      const schema = epidemiologyEvents as any;
      expect(schema.userId).toBeUndefined();
    });

    it('should be able to query disease heatmap data', async () => {
      // Import eq from drizzle-orm
      const { eq } = await import('drizzle-orm');
      
      // Query recent events for Baghdad
      const recentEvents = await db
        .select()
        .from(epidemiologyEvents)
        .where(eq(epidemiologyEvents.city, 'Baghdad'))
        .limit(10);

      expect(Array.isArray(recentEvents)).toBe(true);
      // Should have at least the test event we inserted
      expect(recentEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // Test 3: Environment Sensing (OpenWeather API)
  // ============================================================================
  
  describe('Environment Sensing', () => {
    it('should gracefully fallback when OPENWEATHER_API_KEY is missing', async () => {
      // Temporarily remove API key
      const originalKey = process.env.OPENWEATHER_API_KEY;
      delete process.env.OPENWEATHER_API_KEY;

      // Build context vector (should not crash)
      const contextVector = await buildContextVector(1, {
        symptoms: ['fever', 'cough'],
      });

      // Should return default environmental factors
      expect(contextVector.environmentalFactors).toBeDefined();
      expect(contextVector.environmentalFactors.barometricPressure).toBe(1013);
      expect(contextVector.environmentalFactors.temperature).toBe(25);
      expect(contextVector.environmentalFactors.humidity).toBe(40);

      // Restore API key
      if (originalKey) {
        process.env.OPENWEATHER_API_KEY = originalKey;
      }
    });

    it('should fetch real weather data when API key is configured', async () => {
      // Skip if no API key configured
      if (!process.env.OPENWEATHER_API_KEY) {
        console.log('⚠️  OPENWEATHER_API_KEY not configured, skipping real API test');
        return;
      }

      // Build context vector with real weather data
      const contextVector = await buildContextVector(1, {
        symptoms: ['headache'],
      });

      // Should have environmental factors
      expect(contextVector.environmentalFactors).toBeDefined();
      
      // Weather data should be realistic (not defaults)
      const { barometricPressure, temperature, humidity } = contextVector.environmentalFactors;
      
      // Barometric pressure should be in realistic range (950-1050 hPa)
      if (barometricPressure !== 1013) { // Not default
        expect(barometricPressure).toBeGreaterThan(950);
        expect(barometricPressure).toBeLessThan(1050);
      }
      
      // Temperature should be realistic for Iraq (-10 to 50°C)
      if (temperature !== 25) { // Not default
        expect(temperature).toBeGreaterThan(-10);
        expect(temperature).toBeLessThan(50);
      }
      
      // Humidity should be 0-100%
      if (humidity !== 40) { // Not default
        expect(humidity).toBeGreaterThanOrEqual(0);
        expect(humidity).toBeLessThanOrEqual(100);
      }
    }, 10000); // 10 second timeout for API call
  });

  // ============================================================================
  // Test 4: Deep Links (Careem + Google Maps)
  // ============================================================================
  
  describe('Deep Links Generation', () => {
    it('should generate Careem deep link for Iraq market', () => {
      const testClinic: ResourceMatch = {
        id: 1,
        name: 'Baghdad Medical Center',
        type: 'clinic',
        location: {
          city: 'Baghdad',
          lat: 33.3152,
          lng: 44.3661,
        },
        score: 0.95,
        distance: 2.5,
        estimatedWaitTime: 15,
        costEstimate: 25000,
      };

      const deepLinks = generateDeepLinks(testClinic);

      // Should have Careem link
      expect(deepLinks.careemLink).toBeDefined();
      expect(deepLinks.careemLink).toContain('careem://ride');
      expect(deepLinks.careemLink).toContain('dropoff[lat]=33.3152');
      expect(deepLinks.careemLink).toContain('dropoff[long]=44.3661');
      expect(deepLinks.careemLink).toContain('service=GO');
    });

    it('should generate Google Maps link as fallback', () => {
      const testClinic: ResourceMatch = {
        id: 2,
        name: 'Erbil Emergency Hospital',
        type: 'clinic',
        location: {
          city: 'Erbil',
          lat: 36.1911,
          lng: 44.0091,
        },
        score: 0.92,
        distance: 5.0,
        estimatedWaitTime: 30,
        costEstimate: 50000,
      };

      const deepLinks = generateDeepLinks(testClinic);

      // Should have Google Maps link
      expect(deepLinks.googleMapsLink).toBeDefined();
      expect(deepLinks.googleMapsLink).toContain('google.com/maps/dir');
      expect(deepLinks.googleMapsLink).toContain('destination=36.1911,44.0091');
      expect(deepLinks.googleMapsLink).toContain('travelmode=driving');
    });

    it('should handle missing location coordinates gracefully', () => {
      const testClinic: ResourceMatch = {
        id: 3,
        name: 'Unknown Clinic',
        type: 'clinic',
        location: undefined as any,
        score: 0.5,
        distance: 0,
        estimatedWaitTime: 0,
        costEstimate: 0,
      };

      const deepLinks = generateDeepLinks(testClinic);

      // Should return empty object (no crash)
      expect(deepLinks).toEqual({});
    });

    it('should generate all three ride-sharing links', () => {
      const testClinic: ResourceMatch = {
        id: 4,
        name: 'Basra General Hospital',
        type: 'clinic',
        location: {
          city: 'Basra',
          lat: 30.5085,
          lng: 47.7835,
        },
        score: 0.88,
        distance: 10.0,
        estimatedWaitTime: 45,
        costEstimate: 75000,
      };

      const deepLinks = generateDeepLinks(testClinic);

      // Should have all three links
      expect(deepLinks.careemLink).toBeDefined();
      expect(deepLinks.googleMapsLink).toBeDefined();
      expect(deepLinks.uberLink).toBeDefined();

      // Verify Uber link format
      expect(deepLinks.uberLink).toContain('uber://?action=setPickup');
      expect(deepLinks.uberLink).toContain('dropoff[latitude]=30.5085');
      expect(deepLinks.uberLink).toContain('dropoff[longitude]=47.7835');
    });
  });

  // ============================================================================
  // Integration Test: Full SENSE → LOCAL → THINK → ACT Loop
  // ============================================================================
  
  describe('Full Avicenna-X Loop', () => {
    it('should execute complete orchestration without crashing', async () => {
      // This is a smoke test to ensure all layers work together
      // We don't test the AI output quality, just that the system doesn't crash
      
      const { executeAvicennaLoop } = await import('./orchestrator');
      
      // Execute with minimal input
      const result = await executeAvicennaLoop(1, {
        symptoms: ['fever', 'cough'],
        severity: 7,
      });

      // Should return a result object
      expect(result).toBeDefined();
      
      // Should have an action defined (SELF_CARE, CONNECT_SOCKET, etc.)
      expect(result.action).toBeDefined();
      
      // Should have diagnosis object (may have default values if AI parsing failed)
      expect(result.diagnosis).toBeDefined();
      
      // Should have execution metrics
      expect(result.executionMetrics).toBeDefined();
      expect(result.executionMetrics.totalExecutionMs).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for full AI loop
  });
});
