/**
 * Tests for Resource Auction Algorithm
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSkillMatch,
  calculateDistance,
  calculateProximityScore,
  calculatePriceScore,
  estimateConsultationCost,
  calculateNetworkQualityScore,
  calculatePerformanceScore,
  type DoctorPerformanceMetrics,
  type NetworkQualityMetrics,
} from './resource-auction';

describe('Resource Auction Algorithm', () => {
  describe('calculateSkillMatch', () => {
    it('should give 50 points for exact specialty match', () => {
      const score = calculateSkillMatch('cardiology', 'cardiology', []);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('should give 30 points for related specialty', () => {
      const score = calculateSkillMatch('internal medicine', 'cardiology', []);
      expect(score).toBeGreaterThanOrEqual(30);
      expect(score).toBeLessThan(50);
    });

    it('should add points for symptom-specialty alignment', () => {
      const symptoms = ['chest pain', 'palpitations', 'shortness of breath'];
      const score = calculateSkillMatch('cardiology', 'cardiology', symptoms);
      expect(score).toBeGreaterThan(50); // Base 50 + symptom bonus
    });

    it('should handle case-insensitive matching', () => {
      const score1 = calculateSkillMatch('CARDIOLOGY', 'cardiology', []);
      const score2 = calculateSkillMatch('cardiology', 'CARDIOLOGY', []);
      expect(score1).toBe(score2);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between Baghdad and Basra (~500km)', () => {
      const baghdad = { lat: 33.3152, lng: 44.3661 };
      const basra = { lat: 30.5085, lng: 47.7835 };
      const distance = calculateDistance(baghdad.lat, baghdad.lng, basra.lat, basra.lng);
      expect(distance).toBeGreaterThan(400);
      expect(distance).toBeLessThan(600);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(33.3152, 44.3661, 33.3152, 44.3661);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateProximityScore', () => {
    it('should give 100 points for ideal distance in EMERGENCY', () => {
      const score = calculateProximityScore(3, 'EMERGENCY');
      expect(score).toBe(100);
    });

    it('should give lower score for far distance in EMERGENCY', () => {
      const score = calculateProximityScore(50, 'EMERGENCY');
      expect(score).toBeLessThan(50);
    });

    it('should be more lenient for LOW urgency', () => {
      const emergencyScore = calculateProximityScore(30, 'EMERGENCY');
      const lowScore = calculateProximityScore(30, 'LOW');
      expect(lowScore).toBeGreaterThan(emergencyScore);
    });

    it('should return 0 if beyond maxDistance', () => {
      const score = calculateProximityScore(100, 'MEDIUM', 50);
      expect(score).toBe(0);
    });
  });

  describe('calculatePriceScore', () => {
    it('should give 100 points for cost well below budget', () => {
      const score = calculatePriceScore(25000, 100000, 50000);
      expect(score).toBe(100);
    });

    it('should give 0 points for cost over budget', () => {
      const score = calculatePriceScore(150000, 100000, 50000);
      expect(score).toBe(0);
    });

    it('should score based on market comparison when no budget', () => {
      const belowMarket = calculatePriceScore(40000, undefined, 50000);
      const aboveMarket = calculatePriceScore(60000, undefined, 50000);
      expect(belowMarket).toBeGreaterThan(aboveMarket);
    });

    it('should give higher score for better budget utilization', () => {
      const score50 = calculatePriceScore(50000, 100000, 50000); // 50% utilization
      const score90 = calculatePriceScore(90000, 100000, 50000); // 90% utilization
      expect(score50).toBeGreaterThan(score90);
    });
  });

  describe('estimateConsultationCost', () => {
    it('should charge more for specialized fields', () => {
      const generalCost = estimateConsultationCost('general practice', 'MEDIUM', false);
      const cardiologyCost = estimateConsultationCost('cardiology', 'MEDIUM', false);
      expect(cardiologyCost).toBeGreaterThan(generalCost);
    });

    it('should apply urgency multiplier', () => {
      const lowCost = estimateConsultationCost('cardiology', 'LOW', false);
      const emergencyCost = estimateConsultationCost('cardiology', 'EMERGENCY', false);
      expect(emergencyCost).toBeGreaterThan(lowCost * 1.5);
    });

    it('should apply telemedicine discount', () => {
      const inPersonCost = estimateConsultationCost('cardiology', 'MEDIUM', false);
      const telemedicineCost = estimateConsultationCost('cardiology', 'MEDIUM', true);
      expect(telemedicineCost).toBeLessThan(inPersonCost);
      expect(telemedicineCost).toBeCloseTo(inPersonCost * 0.8, -2);
    });

    it('should return reasonable costs in IQD', () => {
      const cost = estimateConsultationCost('internal medicine', 'MEDIUM', false);
      expect(cost).toBeGreaterThan(20000); // At least 20k IQD
      expect(cost).toBeLessThan(200000); // Less than 200k IQD
    });
  });

  describe('calculateNetworkQualityScore', () => {
    it('should return 100 if telemedicine not required', () => {
      const score = calculateNetworkQualityScore(null, false);
      expect(score).toBe(100);
    });

    it('should return 50 if no metrics and telemedicine required', () => {
      const score = calculateNetworkQualityScore(null, true);
      expect(score).toBe(50);
    });

    it('should give high score for excellent metrics', () => {
      const excellentMetrics: NetworkQualityMetrics = {
        doctorId: 1,
        avgLatency: 30,
        avgBandwidth: '10.00',
        connectionDropRate: '0.0100',
        avgJitter: 5,
        excellentCount: 90,
        goodCount: 10,
        fairCount: 0,
        poorCount: 0,
        lastConnectionQuality: 'EXCELLENT',
        measurementCount: 100,
        lastMeasured: new Date(),
        lastUpdated: new Date(),
        id: 1,
      };
      const score = calculateNetworkQualityScore(excellentMetrics, true);
      expect(score).toBeGreaterThan(80);
    });

    it('should give low score for poor metrics', () => {
      const poorMetrics: NetworkQualityMetrics = {
        doctorId: 1,
        avgLatency: 500,
        avgBandwidth: '0.50',
        connectionDropRate: '0.3000',
        avgJitter: 100,
        excellentCount: 0,
        goodCount: 0,
        fairCount: 20,
        poorCount: 80,
        lastConnectionQuality: 'POOR',
        measurementCount: 100,
        lastMeasured: new Date(),
        lastUpdated: new Date(),
        id: 1,
      };
      const score = calculateNetworkQualityScore(poorMetrics, true);
      expect(score).toBeLessThan(30);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should return 50 for doctors with insufficient data', () => {
      const score = calculatePerformanceScore(null, 'cardiology');
      expect(score).toBe(50);
    });

    it('should give high score for excellent performance', () => {
      const excellentMetrics: DoctorPerformanceMetrics = {
        doctorId: 1,
        totalConsultations: 100,
        successfulConsultations: 95,
        avgResponseTime: 45,
        avgConsultationDuration: 25,
        patientSatisfactionAvg: '4.80',
        specialtySuccessRates: JSON.stringify({ cardiology: 0.96 }),
        lastUpdated: new Date(),
      };
      const score = calculatePerformanceScore(excellentMetrics, 'cardiology');
      expect(score).toBeGreaterThan(80);
    });

    it('should give low score for poor performance', () => {
      const poorMetrics: DoctorPerformanceMetrics = {
        doctorId: 1,
        totalConsultations: 50,
        successfulConsultations: 30,
        avgResponseTime: 900,
        avgConsultationDuration: 10,
        patientSatisfactionAvg: '2.50',
        specialtySuccessRates: JSON.stringify({ cardiology: 0.60 }),
        lastUpdated: new Date(),
      };
      const score = calculatePerformanceScore(poorMetrics, 'cardiology');
      expect(score).toBeLessThan(50);
    });

    it('should reward fast response times', () => {
      const fastDoctor: DoctorPerformanceMetrics = {
        doctorId: 1,
        totalConsultations: 50,
        successfulConsultations: 45,
        avgResponseTime: 30,
        avgConsultationDuration: 20,
        patientSatisfactionAvg: '4.50',
        specialtySuccessRates: JSON.stringify({ cardiology: 0.90 }),
        lastUpdated: new Date(),
      };
      const slowDoctor: DoctorPerformanceMetrics = {
        ...fastDoctor,
        avgResponseTime: 700,
      };
      const fastScore = calculatePerformanceScore(fastDoctor, 'cardiology');
      const slowScore = calculatePerformanceScore(slowDoctor, 'cardiology');
      expect(fastScore).toBeGreaterThan(slowScore);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle emergency cardiac case', () => {
      // Patient with chest pain in Baghdad needs cardiologist urgently
      const symptoms = ['chest pain', 'shortness of breath', 'palpitations'];
      const skillScore = calculateSkillMatch('cardiology', 'cardiology', symptoms);
      const proximityScore = calculateProximityScore(2, 'EMERGENCY');
      const cost = estimateConsultationCost('cardiology', 'EMERGENCY', false);
      const priceScore = calculatePriceScore(cost, 200000, 100000);

      expect(skillScore).toBeGreaterThan(70);
      expect(proximityScore).toBeGreaterThan(90);
      expect(cost).toBeGreaterThan(50000); // Emergency premium
      expect(priceScore).toBeGreaterThan(0); // Within budget
    });

    it('should handle routine telemedicine consultation', () => {
      // Patient needs general checkup, prefers telemedicine
      const symptoms = ['fatigue', 'mild headache'];
      const skillScore = calculateSkillMatch('family medicine', 'family medicine', symptoms);
      const proximityScore = calculateProximityScore(50, 'LOW'); // Distance less important
      const cost = estimateConsultationCost('family medicine', 'LOW', true);
      const priceScore = calculatePriceScore(cost, 50000, 30000);

      expect(skillScore).toBeGreaterThan(40);
      expect(proximityScore).toBeGreaterThan(50);
      expect(cost).toBeLessThan(30000); // Low urgency + telemedicine discount
      expect(priceScore).toBeGreaterThan(60);
    });

    it('should handle budget-constrained patient', () => {
      // Patient has limited budget but needs specialist
      const maxBudget = 40000;
      const cost1 = estimateConsultationCost('cardiology', 'MEDIUM', false);
      const cost2 = estimateConsultationCost('cardiology', 'MEDIUM', true);
      const score1 = calculatePriceScore(cost1, maxBudget, 50000);
      const score2 = calculatePriceScore(cost2, maxBudget, 50000);

      // Telemedicine option should score better due to lower cost
      if (cost2 < maxBudget) {
        expect(score2).toBeGreaterThan(score1);
      }
    });
  });
});
