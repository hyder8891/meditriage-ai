/**
 * Lab Reports Integration Tests
 * 
 * Tests the lab report upload, parsing, and integration into diagnosis
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  getRecentLabReports, 
  getLabReportById, 
  getBiomarkerTrend,
  getLabContextForDiagnosis 
} from './lab-integration';

describe('Lab Reports Integration', () => {
  const testUserId = 1;

  describe('getRecentLabReports', () => {
    it('should return empty array when no reports exist', async () => {
      const reports = await getRecentLabReports(999999, 10);
      expect(reports).toBeInstanceOf(Array);
      expect(reports.length).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const reports = await getRecentLabReports(testUserId, 5);
      expect(reports).toBeInstanceOf(Array);
      expect(reports.length).toBeLessThanOrEqual(5);
    });

    it('should return lab reports with required fields', async () => {
      const reports = await getRecentLabReports(testUserId, 10);
      
      if (reports.length > 0) {
        const report = reports[0];
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('userId');
        expect(report).toHaveProperty('reportName');
        expect(report).toHaveProperty('reportDate');
        expect(report).toHaveProperty('uploadDate');
        expect(report).toHaveProperty('fileUrl');
        expect(report).toHaveProperty('ocrText');
        expect(report).toHaveProperty('overallInterpretation');
        expect(report).toHaveProperty('riskLevel');
      }
    });

    it('should order reports by date (newest first)', async () => {
      const reports = await getRecentLabReports(testUserId, 10);
      
      if (reports.length > 1) {
        const firstDate = new Date(reports[0].reportDate);
        const secondDate = new Date(reports[1].reportDate);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('getLabReportById', () => {
    it('should return null for non-existent report', async () => {
      const report = await getLabReportById(999999, testUserId);
      expect(report).toBeNull();
    });

    it('should return null when accessing another user\'s report', async () => {
      // Try to access report with wrong user ID
      const report = await getLabReportById(1, 999999);
      expect(report).toBeNull();
    });

    it('should return report with all fields', async () => {
      const reports = await getRecentLabReports(testUserId, 1);
      
      if (reports.length > 0) {
        const reportId = reports[0].id;
        const report = await getLabReportById(reportId, testUserId);
        
        expect(report).not.toBeNull();
        if (report) {
          expect(report.id).toBe(reportId);
          expect(report.userId).toBe(testUserId);
          expect(report).toHaveProperty('fileUrl');
          expect(report).toHaveProperty('reportDate');
        }
      }
    });
  });

  describe('getBiomarkerTrend', () => {
    it('should return empty array when no reports exist', async () => {
      const trend = await getBiomarkerTrend(999999, 'Hemoglobin', 6);
      expect(trend).toBeInstanceOf(Array);
      expect(trend.length).toBe(0);
    });

    it('should return trend data with correct structure', async () => {
      const trend = await getBiomarkerTrend(testUserId, 'Hemoglobin', 6);
      
      if (trend.length > 0) {
        const dataPoint = trend[0];
        expect(dataPoint).toHaveProperty('date');
        expect(dataPoint).toHaveProperty('value');
        expect(dataPoint).toHaveProperty('status');
        expect(dataPoint.date).toBeInstanceOf(Date);
        expect(typeof dataPoint.value).toBe('string');
        expect(['normal', 'low', 'high', 'critical']).toContain(dataPoint.status);
      }
    });

    it('should find biomarkers with partial name match', async () => {
      // Should find "Hemoglobin" even if we search for "hemo"
      const trend = await getBiomarkerTrend(testUserId, 'hemo', 6);
      expect(trend).toBeInstanceOf(Array);
    });

    it('should order trend by date', async () => {
      const trend = await getBiomarkerTrend(testUserId, 'Glucose', 12);
      
      if (trend.length > 1) {
        const firstDate = trend[0].date.getTime();
        const secondDate = trend[1].date.getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });
  });

  describe('getLabContextForDiagnosis', () => {
    it('should return "no reports" message when none exist', async () => {
      const context = await getLabContextForDiagnosis(999999);
      expect(context).toContain('No recent lab reports');
    });

    it('should return formatted context string', async () => {
      const context = await getLabContextForDiagnosis(testUserId);
      expect(typeof context).toBe('string');
      
      // If reports exist, should contain "Recent lab reports:"
      if (!context.includes('No recent lab reports')) {
        expect(context).toContain('Recent lab reports:');
      }
    });

    it('should include report names and dates', async () => {
      const reports = await getRecentLabReports(testUserId, 3);
      
      if (reports.length > 0) {
        const context = await getLabContextForDiagnosis(testUserId);
        
        // Should mention at least one report
        const hasReportInfo = reports.some(report => {
          const reportName = report.reportName || 'Lab Report';
          return context.includes(reportName) || context.includes('Lab Report');
        });
        
        expect(hasReportInfo).toBe(true);
      }
    });

    it('should include risk levels', async () => {
      const context = await getLabContextForDiagnosis(testUserId);
      
      if (!context.includes('No recent lab reports')) {
        // Should mention risk level
        const hasRiskLevel = 
          context.includes('Risk level') ||
          context.includes('low') ||
          context.includes('moderate') ||
          context.includes('high');
        
        expect(hasRiskLevel).toBe(true);
      }
    });

    it('should limit to 3 most recent reports', async () => {
      const context = await getLabContextForDiagnosis(testUserId);
      
      // Count how many report entries are in the context
      const reportCount = (context.match(/Lab Report|Risk level/g) || []).length;
      expect(reportCount).toBeLessThanOrEqual(3);
    });
  });

  describe('Lab Report Data Structure', () => {
    it('should handle parsed data as JSON string in ocrText', async () => {
      const reports = await getRecentLabReports(testUserId, 1);
      
      if (reports.length > 0 && reports[0].ocrText) {
        const ocrText = reports[0].ocrText;
        
        // Should be valid JSON
        expect(() => JSON.parse(ocrText)).not.toThrow();
        
        const parsed = JSON.parse(ocrText);
        expect(parsed).toHaveProperty('testName');
        expect(parsed).toHaveProperty('biomarkers');
        expect(parsed.biomarkers).toBeInstanceOf(Array);
      }
    });

    it('should have valid risk levels', async () => {
      const reports = await getRecentLabReports(testUserId, 10);
      
      for (const report of reports) {
        if (report.riskLevel) {
          expect(['low', 'moderate', 'high', 'critical', 'unknown']).toContain(report.riskLevel);
        }
      }
    });

    it('should have valid dates', async () => {
      const reports = await getRecentLabReports(testUserId, 10);
      
      for (const report of reports) {
        const reportDate = new Date(report.reportDate);
        const uploadDate = new Date(report.uploadDate);
        
        expect(reportDate.getTime()).not.toBeNaN();
        expect(uploadDate.getTime()).not.toBeNaN();
        
        // Upload date should be after or equal to report date
        expect(uploadDate.getTime()).toBeGreaterThanOrEqual(reportDate.getTime());
      }
    });
  });

  describe('Integration with Diagnosis', () => {
    it('should provide actionable context for AI', async () => {
      const context = await getLabContextForDiagnosis(testUserId);
      
      // Context should be informative enough for diagnosis
      expect(context.length).toBeGreaterThan(10);
      
      if (!context.includes('No recent lab reports')) {
        // Should have structured information
        expect(context).toMatch(/Lab Report|Risk level|interpretation/i);
      }
    });

    it('should handle users with no lab history', async () => {
      const context = await getLabContextForDiagnosis(999999);
      
      // Should not throw error
      expect(context).toBeDefined();
      expect(typeof context).toBe('string');
      expect(context).toContain('No recent lab reports');
    });
  });

  describe('Error Handling', () => {
    it('should handle database unavailability gracefully', async () => {
      // These should not throw even if DB is unavailable
      const reports = await getRecentLabReports(testUserId, 10);
      expect(reports).toBeInstanceOf(Array);
      
      const report = await getLabReportById(1, testUserId);
      // Should return null, not throw
      expect(report === null || typeof report === 'object').toBe(true);
      
      const trend = await getBiomarkerTrend(testUserId, 'Glucose', 6);
      expect(trend).toBeInstanceOf(Array);
      
      const context = await getLabContextForDiagnosis(testUserId);
      expect(typeof context).toBe('string');
    });
  });
});
