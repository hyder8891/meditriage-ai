import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

/**
 * Comprehensive API Test Suite
 * Tests all major tRPC procedures across the application
 */

// Mock context for authenticated user (patient)
const mockPatientContext: Context = {
  user: {
    id: 2,
    name: 'Sara Mohammed',
    email: 'sara.mohammed@example.iq',
    role: 'patient',
    emailVerified: true,
    verified: false,
    availabilityStatus: 'offline',
    currentPatientCount: 0,
    maxPatientsPerDay: 50,
    autoOfflineMinutes: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
};

// Mock context for authenticated user (doctor)
const mockDoctorContext: Context = {
  user: {
    id: 3,
    name: 'Dr. Ahmed Al-Husseini',
    email: 'ahmed.husseini@mydoctor.iq',
    role: 'doctor',
    specialty: 'Emergency Medicine',
    licenseNumber: 'IQ-MED-2018-4521',
    emailVerified: true,
    verified: true,
    availabilityStatus: 'available',
    currentPatientCount: 2,
    maxPatientsPerDay: 40,
    autoOfflineMinutes: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
};

// Mock context for unauthenticated user
const mockUnauthContext: Context = {
  user: null,
};

describe('Comprehensive API Tests', () => {
  
  describe('1. Authentication Endpoints', () => {
    
    it('should return current user info for authenticated user', async () => {
      const caller = appRouter.createCaller(mockPatientContext);
      const result = await caller.auth.me();
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(2);
      expect(result?.email).toBe('sara.mohammed@example.iq');
      expect(result?.role).toBe('patient');
    });

    it('should return null for unauthenticated user', async () => {
      const caller = appRouter.createCaller(mockUnauthContext);
      const result = await caller.auth.me();
      
      expect(result).toBeNull();
    });
  });

  describe('2. B2B2C Doctor Endpoints', () => {
    
    it('should allow doctor to get availability status', async () => {
      const caller = appRouter.createCaller(mockDoctorContext);
      const result = await caller.b2b2c.doctor.getAvailabilityStatus();
      
      expect(result).toBeDefined();
      expect(result?.availabilityStatus).toBe('available');
    });

    it('should allow doctor to set availability status', async () => {
      const caller = appRouter.createCaller(mockDoctorContext);
      
      await expect(
        caller.b2b2c.doctor.setAvailabilityStatus({ status: 'busy' })
      ).resolves.toBeDefined();
    });

    it('should allow doctor to get their patients list', async () => {
      const caller = appRouter.createCaller(mockDoctorContext);
      const result = await caller.b2b2c.doctor.getMyPatients({
        status: 'active',
        limit: 10,
        offset: 0,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should reject patient trying to access doctor endpoints', async () => {
      const caller = appRouter.createCaller(mockPatientContext);
      
      await expect(
        caller.b2b2c.doctor.setAvailabilityStatus({ status: 'available' })
      ).rejects.toThrow();
    });
  });

  describe('3. B2B2C Patient Endpoints', () => {
    
    it('should allow patient to search for doctors', async () => {
      const caller = appRouter.createCaller(mockPatientContext);
      const result = await caller.b2b2c.patient.searchDoctors({
        specialty: 'Emergency Medicine',
        availabilityStatus: 'available',
        limit: 10,
        offset: 0,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should allow patient to get their doctors', async () => {
      const caller = appRouter.createCaller(mockPatientContext);
      const result = await caller.b2b2c.patient.getMyDoctors({
        status: 'active',
        limit: 10,
        offset: 0,
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('4. System Endpoints', () => {
    
    it('should allow notification to owner', async () => {
      const caller = appRouter.createCaller(mockDoctorContext);
      
      await expect(
        caller.system.notifyOwner({
          title: 'Test Notification',
          content: 'This is a test notification from automated tests',
        })
      ).resolves.toBeDefined();
    });
  });

  describe('5. Error Handling', () => {
    
    it('should handle unauthorized access gracefully', async () => {
      const caller = appRouter.createCaller(mockUnauthContext);
      
      await expect(
        caller.b2b2c.doctor.getAvailabilityStatus()
      ).rejects.toThrow('UNAUTHORIZED');
    });

    it('should handle invalid input data', async () => {
      const caller = appRouter.createCaller(mockDoctorContext);
      
      await expect(
        // @ts-expect-error Testing invalid input
        caller.b2b2c.doctor.setAvailabilityStatus({ status: 'invalid_status' })
      ).rejects.toThrow();
    });
  });
});

describe('Database Connectivity Tests', () => {
  
  it('should successfully connect to database', async () => {
    const caller = appRouter.createCaller(mockPatientContext);
    
    // Any query that touches the database
    const result = await caller.auth.me();
    expect(result).toBeDefined();
  });
});

console.log('✅ Comprehensive API test suite created');
console.log('📋 Tests cover:');
console.log('   - Authentication endpoints');
console.log('   - B2B2C doctor endpoints');
console.log('   - B2B2C patient endpoints');
console.log('   - System endpoints');
console.log('   - Error handling');
console.log('   - Database connectivity');
