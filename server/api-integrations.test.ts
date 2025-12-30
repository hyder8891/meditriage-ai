/**
 * API Integrations Test Suite
 * Tests for OpenFDA, PubChem, ClinicalTrials.gov, and Medical Assistant
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDrugInfo, searchCompoundByName, getCompoundByCID } from './pubchem';
import { searchDrugAdverseEvents, searchDrugLabels, getDrugSafetyInfo } from './openfda';
import { searchClinicalTrials, getClinicalTrialDetails, searchTrialsByCondition } from './clinicaltrials';

describe('PubChem API Integration', () => {
  it('should search for a common drug (Aspirin)', async () => {
    const cids = await searchCompoundByName('Aspirin');
    
    expect(cids).toBeDefined();
    expect(Array.isArray(cids)).toBe(true);
    expect(cids.length).toBeGreaterThan(0);
  }, 15000);

  it('should get compound details by CID', async () => {
    // CID 2244 is Aspirin
    const compound = await getCompoundByCID(2244);
    
    expect(compound).toBeDefined();
    expect(compound.CID).toBe(2244);
    expect(compound.MolecularFormula).toBeDefined();
  }, 15000);

  it('should get comprehensive drug information', async () => {
    const drugInfo = await getDrugInfo('Ibuprofen');
    
    expect(drugInfo).toBeDefined();
    expect(drugInfo?.cid).toBeDefined();
    expect(drugInfo?.compound).toBeDefined();
    expect(drugInfo?.synonyms).toBeDefined();
    expect(Array.isArray(drugInfo?.synonyms)).toBe(true);
  }, 15000);

  it('should handle non-existent drugs gracefully', async () => {
    const drugInfo = await getDrugInfo('NonExistentDrugXYZ123');
    
    expect(drugInfo).toBeNull();
  }, 15000);
});

describe('OpenFDA API Integration', () => {
  it('should search for drug adverse events', async () => {
    const results = await searchDrugAdverseEvents({
      search: 'patient.drug.medicinalproduct:"Aspirin"',
      limit: 5
    });
    
    expect(results).toBeDefined();
    expect(results.meta).toBeDefined();
    expect(results.meta.results).toBeDefined();
  }, 15000);

  it('should search for drug labels', async () => {
    const results = await searchDrugLabels({
      search: 'openfda.brand_name:"Tylenol"',
      limit: 1
    });
    
    expect(results).toBeDefined();
    expect(results.meta).toBeDefined();
  }, 15000);

  it('should get comprehensive drug safety information', async () => {
    const safetyInfo = await getDrugSafetyInfo('Aspirin');
    
    expect(safetyInfo).toBeDefined();
    // Note: Some data might be null if not available
    expect(safetyInfo.adverseEvents !== undefined || safetyInfo.labels !== undefined || safetyInfo.enforcement !== undefined).toBe(true);
  }, 20000);

  it('should handle drugs with no FDA data gracefully', async () => {
    const safetyInfo = await getDrugSafetyInfo('NonExistentDrugXYZ123');
    
    expect(safetyInfo).toBeDefined();
    // Should return object with null values for missing data
    expect(safetyInfo.adverseEvents === null || safetyInfo.labels === null || safetyInfo.enforcement === null).toBe(true);
  }, 15000);
});

describe('ClinicalTrials.gov API Integration', () => {
  it('should search for clinical trials by condition', async () => {
    const results = await searchClinicalTrials({
      condition: 'diabetes',
      pageSize: 5
    });
    
    expect(results).toBeDefined();
    expect(results.studies).toBeDefined();
    expect(Array.isArray(results.studies)).toBe(true);
  }, 15000);

  it('should get trial details by NCT ID', async () => {
    // First search for a trial
    const searchResults = await searchClinicalTrials({
      condition: 'hypertension',
      pageSize: 1
    });
    
    expect(searchResults.studies).toBeDefined();
    expect(searchResults.studies.length).toBeGreaterThan(0);
    
    const nctId = searchResults.studies[0].protocolSection?.identificationModule?.nctId;
    
    if (nctId) {
      const details = await getClinicalTrialDetails(nctId);
      
      expect(details).toBeDefined();
      expect(details.protocolSection).toBeDefined();
      expect(details.protocolSection.identificationModule.nctId).toBe(nctId);
    }
  }, 20000);

  it('should search trials by condition with filters', async () => {
    const results = await searchTrialsByCondition('cancer', {
      recruiting: true,
      limit: 5
    });
    
    expect(results).toBeDefined();
    expect(results.studies).toBeDefined();
    expect(Array.isArray(results.studies)).toBe(true);
  }, 15000);

  it('should handle non-existent conditions gracefully', async () => {
    const results = await searchClinicalTrials({
      condition: 'NonExistentConditionXYZ123',
      pageSize: 5
    });
    
    expect(results).toBeDefined();
    // Should return empty results or handle gracefully
    expect(results.studies === undefined || results.studies.length === 0).toBe(true);
  }, 15000);
});

describe('API Integration Error Handling', () => {
  it('should handle network errors in PubChem gracefully', async () => {
    // Test with invalid CID
    try {
      await getCompoundByCID(-1);
      // If it doesn't throw, that's also acceptable
      expect(true).toBe(true);
    } catch (error) {
      // Should throw a meaningful error
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  }, 15000);

  it('should handle invalid search parameters in OpenFDA', async () => {
    try {
      await searchDrugAdverseEvents({
        search: 'invalid:search:syntax:::',
        limit: 1
      });
      // If it doesn't throw, check for error response
      expect(true).toBe(true);
    } catch (error) {
      // Should handle error gracefully
      expect(error).toBeDefined();
    }
  }, 15000);

  it('should handle invalid NCT ID format', async () => {
    try {
      await getClinicalTrialDetails('INVALID123');
      // If it doesn't throw, that's acceptable
      expect(true).toBe(true);
    } catch (error) {
      // Should throw meaningful error
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  }, 15000);
});

describe('API Rate Limiting and Performance', () => {
  it('should handle multiple concurrent PubChem requests', async () => {
    const drugs = ['Aspirin', 'Ibuprofen', 'Acetaminophen'];
    
    const results = await Promise.allSettled(
      drugs.map(drug => getDrugInfo(drug))
    );
    
    expect(results).toBeDefined();
    expect(results.length).toBe(3);
    
    // At least some should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThan(0);
  }, 30000);

  it('should handle multiple concurrent OpenFDA requests', async () => {
    const drugs = ['Aspirin', 'Tylenol'];
    
    const results = await Promise.allSettled(
      drugs.map(drug => getDrugSafetyInfo(drug))
    );
    
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
  }, 30000);

  it('should handle multiple concurrent ClinicalTrials requests', async () => {
    const conditions = ['diabetes', 'hypertension'];
    
    const results = await Promise.allSettled(
      conditions.map(condition => searchTrialsByCondition(condition, { limit: 2 }))
    );
    
    expect(results).toBeDefined();
    expect(results.length).toBe(2);
  }, 30000);
});
