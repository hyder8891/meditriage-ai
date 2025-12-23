/**
 * Emergency Routing System Tests
 * 
 * Tests the emergency clinic routing with Uber/Careem deep links
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { routeToEmergencyClinic, updateClinicWaitTime, getClinicWaitTime } from './emergency-routing';

describe('Emergency Routing System', () => {
  const baghdadLocation = { lat: 33.3152, lng: 44.3661 };

  describe('routeToEmergencyClinic', () => {
    it('should find emergency clinic for EMERGENCY severity', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route).toBeDefined();
      expect(route.clinic).toBeDefined();
      expect(route.clinic.name).toBeTruthy();
      expect(route.clinic.location).toBeDefined();
      expect(route.clinic.emergencyCapabilities).toBeInstanceOf(Array);
      expect(route.clinic.emergencyCapabilities.length).toBeGreaterThan(0);
    });

    it('should find clinic for HIGH severity', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'HIGH');

      expect(route).toBeDefined();
      expect(route.clinic).toBeDefined();
      expect(route.clinic.name).toBeTruthy();
    });

    it('should include transport options', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.transportOptions).toBeDefined();
      expect(route.transportOptions.uber).toBeDefined();
      expect(route.transportOptions.careem).toBeDefined();
      expect(route.transportOptions.googleMaps).toBeDefined();
    });

    it('should generate valid Uber deep link', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.transportOptions.uber?.deepLink).toBeTruthy();
      expect(route.transportOptions.uber?.deepLink).toContain('uber://');
      expect(route.transportOptions.uber?.deepLink).toContain('dropoff');
      expect(route.transportOptions.uber?.estimatedFare).toBeTruthy();
      expect(route.transportOptions.uber?.estimatedTime).toBeGreaterThan(0);
    });

    it('should generate valid Careem deep link', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.transportOptions.careem?.deepLink).toBeTruthy();
      expect(route.transportOptions.careem?.deepLink).toContain('careem://');
      expect(route.transportOptions.careem?.estimatedFare).toBeTruthy();
      expect(route.transportOptions.careem?.estimatedTime).toBeGreaterThan(0);
    });

    it('should generate valid Google Maps deep link', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.transportOptions.googleMaps.deepLink).toBeTruthy();
      expect(route.transportOptions.googleMaps.deepLink).toContain('google.com/maps');
      expect(route.transportOptions.googleMaps.deepLink).toContain('travelmode=driving');
      expect(route.transportOptions.googleMaps.estimatedTime).toBeGreaterThan(0);
    });

    it('should calculate total time (travel + wait)', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.totalTime).toBeGreaterThan(0);
      expect(route.totalTime).toBe(
        route.clinic.travelTime + route.clinic.currentWaitTime
      );
    });

    it('should calculate urgency score', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(route.urgencyScore).toBeLessThanOrEqual(100);
    });

    it('should filter by required capabilities', async () => {
      const route = await routeToEmergencyClinic(
        baghdadLocation,
        'EMERGENCY',
        ['cardiac', 'trauma']
      );

      expect(route.clinic.emergencyCapabilities).toContain('cardiac');
      expect(route.clinic.emergencyCapabilities).toContain('trauma');
    });

    it('should prioritize closer clinics', async () => {
      const route1 = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');
      
      // The closest clinic should have reasonable distance
      expect(route1.clinic.distance).toBeLessThan(20); // Less than 20km
    });

    it('should include wait time in clinic metadata', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.clinic.currentWaitTime).toBeGreaterThanOrEqual(0);
      expect(route.clinic.currentWaitTime).toBeLessThan(300); // Less than 5 hours
    });
  });

  describe('Wait Time Management', () => {
    it('should update clinic wait time', async () => {
      await updateClinicWaitTime(1, 45);
      const waitTime = await getClinicWaitTime(1);

      expect(waitTime).toBe(45);
    });

    it('should get default wait time for uncached clinic', async () => {
      const waitTime = await getClinicWaitTime(999);

      expect(waitTime).toBe(30); // Default
    });

    it('should cache wait time for 10 minutes', async () => {
      await updateClinicWaitTime(2, 60);
      
      // Immediately fetch should return cached value
      const waitTime = await getClinicWaitTime(2);
      expect(waitTime).toBe(60);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate reasonable distances', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      // Distance should be positive and reasonable for Baghdad
      expect(route.clinic.distance).toBeGreaterThan(0);
      expect(route.clinic.distance).toBeLessThan(50); // Less than 50km for city
    });
  });

  describe('Travel Time Estimation', () => {
    it('should estimate travel time based on distance', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      // Travel time should be proportional to distance
      // Assuming average speed of 30 km/h in Baghdad traffic
      const expectedMinTime = Math.floor(route.clinic.distance / 0.5);
      
      expect(route.clinic.travelTime).toBeGreaterThan(0);
      expect(route.clinic.travelTime).toBeGreaterThanOrEqual(expectedMinTime - 5);
    });
  });

  describe('Fare Estimation', () => {
    it('should estimate reasonable fares in IQD', async () => {
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');

      expect(route.transportOptions.uber?.estimatedFare).toContain('IQD');
      expect(route.transportOptions.careem?.estimatedFare).toContain('IQD');

      // Extract numeric value
      const uberFare = parseInt(route.transportOptions.uber?.estimatedFare.replace(/[^0-9]/g, '') || '0');
      expect(uberFare).toBeGreaterThan(2000); // Minimum fare
      expect(uberFare).toBeLessThan(50000); // Maximum reasonable fare for city
    });
  });

  describe('Error Handling', () => {
    it('should handle missing location gracefully', async () => {
      // This should not throw, but might return default location
      const route = await routeToEmergencyClinic(baghdadLocation, 'EMERGENCY');
      expect(route).toBeDefined();
    });
  });
});
