/**
 * BRAIN tRPC Router
 * API endpoints for BRAIN clinical reasoning system
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../../_core/trpc';
import { brain } from '../index';
import { medicalKnowledge } from '../knowledge/medical-knowledge';

export const brainRouter = router({
  /**
   * Main clinical reasoning endpoint
   * Analyzes patient symptoms and returns evidence-based diagnosis
   */
  analyze: publicProcedure
    .input(z.object({
      symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
      patientInfo: z.object({
        age: z.number().min(0).max(150),
        gender: z.enum(['male', 'female', 'other']),
        medicalHistory: z.array(z.string()).optional(),
        location: z.string().optional()
      }),
      vitalSigns: z.record(z.string(), z.number()).optional(),
      language: z.enum(['en', 'ar']).default('en')
    }))
    .mutation(async ({ input }: { input: any }) => {
      try {
        return await brain.reason(input);
      } catch (error) {
        console.error('[BRAIN API] Error in analyze:', error);
        throw new Error('Failed to analyze symptoms. Please try again.');
      }
    }),

  /**
   * Submit clinician feedback for learning
   */
  submitFeedback: protectedProcedure
    .input(z.object({
      caseId: z.string(),
      brainDiagnosis: z.any(),
      actualDiagnosis: z.object({
        diagnosis: z.string(),
        notes: z.string().optional()
      }),
      clinicianCorrection: z.string().optional(),
      outcome: z.string()
    }))
    .mutation(async ({ input }: { input: any }) => {
      try {
        return await brain.learn({
          caseId: input.caseId,
          brainDiagnosis: input.brainDiagnosis,
          actualDiagnosis: input.actualDiagnosis,
          clinicianCorrection: input.clinicianCorrection,
          outcome: input.outcome
        });
      } catch (error) {
        console.error('[BRAIN API] Error in submitFeedback:', error);
        throw new Error('Failed to submit feedback. Please try again.');
      }
    }),

  /**
   * Get BRAIN performance metrics
   */
  getMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string()
    }))
    .query(async ({ input }: { input: any }) => {
      try {
        return await brain.getMetrics(input.startDate, input.endDate);
      } catch (error) {
        console.error('[BRAIN API] Error in getMetrics:', error);
        throw new Error('Failed to fetch metrics. Please try again.');
      }
    }),

  /**
   * Search medical knowledge base
   */
  searchKnowledge: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(10)
    }))
    .query(async ({ input }: { input: any }) => {
      try {
        return await medicalKnowledge.findConcept(input.query);
      } catch (error) {
        console.error('[BRAIN API] Error in searchKnowledge:', error);
        throw new Error('Failed to search knowledge base. Please try again.');
      }
    }),

  /**
   * Get case history by ID
   */
  getCaseHistory: protectedProcedure
    .input(z.object({
      caseId: z.string()
    }))
    .query(async ({ input }: { input: any }) => {
      try {
        return await brain.getCaseHistory(input.caseId);
      } catch (error) {
        console.error('[BRAIN API] Error in getCaseHistory:', error);
        throw new Error('Failed to fetch case history. Please try again.');
      }
    }),

  /**
   * Get knowledge base statistics
   */
  getKnowledgeStats: publicProcedure
    .query(async () => {
      try {
        return await medicalKnowledge.getStatistics();
      } catch (error) {
        console.error('[BRAIN API] Error in getKnowledgeStats:', error);
        throw new Error('Failed to fetch knowledge statistics. Please try again.');
      }
    }),

  /**
   * Add medical concept to knowledge base (admin only)
   */
  addConcept: protectedProcedure
    .input(z.object({
      conceptId: z.string(),
      conceptName: z.string(),
      semanticType: z.string(),
      definition: z.string().optional(),
      source: z.string()
    }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      try {
        await medicalKnowledge.addConcept(input);
        return { success: true };
      } catch (error) {
        console.error('[BRAIN API] Error in addConcept:', error);
        throw new Error('Failed to add concept. Please try again.');
      }
    }),

  /**
   * Add relationship between concepts (admin only)
   */
  addRelationship: protectedProcedure
    .input(z.object({
      conceptId1: z.string(),
      relationshipType: z.string(),
      conceptId2: z.string(),
      confidence: z.number().min(0).max(1),
      source: z.string()
    }))
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      try {
        await medicalKnowledge.addRelationship(input);
        return { success: true };
      } catch (error) {
        console.error('[BRAIN API] Error in addRelationship:', error);
        throw new Error('Failed to add relationship. Please try again.');
      }
    })
});
