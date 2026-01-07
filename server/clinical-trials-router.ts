/**
 * Clinical Trials Router
 * Search and match patients with relevant clinical trials
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  searchClinicalTrials,
  getClinicalTrialDetails,
  searchTrialsByCondition,
  checkTrialEligibility,
  getTrialsNearLocation,
  getRecruitingTrials,
  parseEligibilityCriteria
} from "./clinicaltrials";
import { invokeGemini } from "./_core/gemini";

export const clinicalTrialsRouter = router({
  /**
   * Search clinical trials by condition
   */
  searchByCondition: publicProcedure
    .input(z.object({
      condition: z.string().min(1),
      recruiting: z.boolean().default(true),
      country: z.string().optional(),
      phase: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(20)
    }))
    .mutation(async ({ input }) => {
      const results = await searchTrialsByCondition(input.condition, {
        recruiting: input.recruiting,
        country: input.country,
        phase: input.phase,
        limit: input.limit
      });
      
      return {
        totalResults: results.totalCount || 0,
        studies: results.studies?.map((study: any) => ({
          nctId: study.protocolSection?.identificationModule?.nctId,
          title: study.protocolSection?.identificationModule?.briefTitle,
          status: study.protocolSection?.statusModule?.overallStatus,
          phase: study.protocolSection?.designModule?.phases,
          conditions: study.protocolSection?.conditionsModule?.conditions,
          sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name,
          locations: study.protocolSection?.contactsLocationsModule?.locations?.slice(0, 3)
        })) || []
      };
    }),

  /**
   * Get detailed trial information
   */
  getTrialDetails: publicProcedure
    .input(z.object({
      nctId: z.string().regex(/^NCT\d{8}$/, "Invalid NCT ID format")
    }))
    .mutation(async ({ input }) => {
      const trial = await getClinicalTrialDetails(input.nctId);
      
      if (!trial?.protocolSection) {
        return {
          found: false,
          message: "Trial not found"
        };
      }
      
      const protocol = trial.protocolSection;
      
      // Parse eligibility criteria
      const eligibilityCriteria = protocol.eligibilityModule?.eligibilityCriteria;
      const parsedCriteria = eligibilityCriteria 
        ? parseEligibilityCriteria(eligibilityCriteria)
        : null;
      
      return {
        found: true,
        trial: {
          nctId: protocol.identificationModule.nctId,
          briefTitle: protocol.identificationModule.briefTitle,
          officialTitle: protocol.identificationModule.officialTitle,
          status: protocol.statusModule.overallStatus,
          phase: protocol.designModule?.phases,
          studyType: protocol.designModule?.studyType,
          enrollment: protocol.designModule?.enrollmentInfo,
          startDate: protocol.statusModule.startDateStruct?.date,
          completionDate: protocol.statusModule.completionDateStruct?.date,
          sponsor: protocol.sponsorCollaboratorsModule.leadSponsor,
          conditions: protocol.conditionsModule?.conditions,
          interventions: protocol.armsInterventionsModule?.interventions,
          briefSummary: protocol.descriptionModule?.briefSummary,
          detailedDescription: protocol.descriptionModule?.detailedDescription,
          eligibility: {
            criteria: parsedCriteria,
            sex: protocol.eligibilityModule?.sex,
            minimumAge: protocol.eligibilityModule?.minimumAge,
            maximumAge: protocol.eligibilityModule?.maximumAge,
            healthyVolunteers: protocol.eligibilityModule?.healthyVolunteers
          },
          contacts: protocol.contactsLocationsModule?.centralContacts,
          locations: protocol.contactsLocationsModule?.locations
        }
      };
    }),

  /**
   * Check patient eligibility for a trial
   */
  checkEligibility: protectedProcedure
    .input(z.object({
      nctId: z.string().regex(/^NCT\d{8}$/),
      patientData: z.object({
        age: z.number().min(0).max(150),
        gender: z.enum(["male", "female", "other"]),
        conditions: z.array(z.string()),
        medications: z.array(z.string()).optional()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const eligibility = await checkTrialEligibility(input.nctId, input.patientData);
      
      // Use LLM for more detailed analysis
      const trial = await getClinicalTrialDetails(input.nctId);
      const criteriaText = trial?.protocolSection?.eligibilityModule?.eligibilityCriteria;
      
      if (criteriaText) {
        const analysisPrompt = `Analyze patient eligibility for this clinical trial.

Trial: ${trial.protocolSection.identificationModule.briefTitle}
NCT ID: ${input.nctId}

Patient Information:
- Age: ${input.patientData.age}
- Gender: ${input.patientData.gender}
- Conditions: ${input.patientData.conditions.join(', ')}
${input.patientData.medications ? `- Medications: ${input.patientData.medications.join(', ')}` : ''}

Eligibility Criteria:
${criteriaText}

Provide:
1. Detailed eligibility assessment (likely eligible, possibly eligible, likely not eligible)
2. Specific criteria that match
3. Specific criteria that may disqualify
4. Additional information needed
5. Recommendations for next steps`;

        const llmResponse = await invokeGemini({
          messages: [
            { role: "system", content: "You are a clinical research coordinator evaluating patient eligibility for clinical trials." },
            { role: "user", content: analysisPrompt }
          ]
        });
        
        return {
          ...eligibility,
          detailedAnalysis: llmResponse.choices[0].message.content
        };
      }
      
      return eligibility;
    }),

  /**
   * Find trials near a location
   */
  findNearbyTrials: publicProcedure
    .input(z.object({
      location: z.string().min(1),
      condition: z.string().optional(),
      radiusMiles: z.number().min(1).max(500).default(50)
    }))
    .mutation(async ({ input }) => {
      const results = await getTrialsNearLocation(
        input.location,
        input.condition,
        input.radiusMiles
      );
      
      return {
        location: input.location,
        radius: input.radiusMiles,
        totalResults: results.totalCount || 0,
        studies: results.studies?.map((study: any) => ({
          nctId: study.protocolSection?.identificationModule?.nctId,
          title: study.protocolSection?.identificationModule?.briefTitle,
          status: study.protocolSection?.statusModule?.overallStatus,
          conditions: study.protocolSection?.conditionsModule?.conditions,
          locations: study.protocolSection?.contactsLocationsModule?.locations
            ?.filter((loc: any) => loc.country === input.location || loc.city === input.location || loc.state === input.location)
        })) || []
      };
    }),

  /**
   * Get recruiting trials for a condition
   */
  getRecruitingTrials: publicProcedure
    .input(z.object({
      condition: z.string().min(1),
      limit: z.number().min(1).max(100).default(20)
    }))
    .mutation(async ({ input }) => {
      const results = await getRecruitingTrials(input.condition, input.limit);
      
      return {
        condition: input.condition,
        totalResults: results.totalCount || 0,
        studies: results.studies?.map((study: any) => ({
          nctId: study.protocolSection?.identificationModule?.nctId,
          title: study.protocolSection?.identificationModule?.briefTitle,
          status: study.protocolSection?.statusModule?.overallStatus,
          phase: study.protocolSection?.designModule?.phases,
          conditions: study.protocolSection?.conditionsModule?.conditions,
          sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name,
          enrollment: study.protocolSection?.designModule?.enrollmentInfo,
          locations: study.protocolSection?.contactsLocationsModule?.locations?.length || 0
        })) || []
      };
    }),

  /**
   * Match patient with suitable trials
   */
  matchPatientToTrials: protectedProcedure
    .input(z.object({
      patientData: z.object({
        age: z.number(),
        gender: z.enum(["male", "female", "other"]),
        conditions: z.array(z.string()),
        location: z.string().optional(),
        willingToTravel: z.boolean().default(false)
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const matches: any[] = [];
      
      // Search for trials for each condition
      for (const condition of input.patientData.conditions) {
        const trials = await getRecruitingTrials(condition, 10);
        
        if (trials.studies && trials.studies.length > 0) {
          for (const study of trials.studies) {
            const nctId = study.protocolSection?.identificationModule?.nctId;
            
            if (nctId) {
              try {
                const eligibility = await checkTrialEligibility(nctId, {
                  age: input.patientData.age,
                  gender: input.patientData.gender,
                  conditions: input.patientData.conditions
                });
                
                if (eligibility.eligible) {
                  matches.push({
                    nctId,
                    title: study.protocolSection?.identificationModule?.briefTitle,
                    condition,
                    eligibility,
                    phase: study.protocolSection?.designModule?.phases,
                    locations: study.protocolSection?.contactsLocationsModule?.locations?.slice(0, 3)
                  });
                }
              } catch (error) {
                console.error(`Error checking eligibility for ${nctId}:`, error);
              }
            }
          }
        }
      }
      
      return {
        totalMatches: matches.length,
        matches: matches.slice(0, 20), // Limit to top 20 matches
        searchedConditions: input.patientData.conditions
      };
    }),

  /**
   * Get trial statistics
   */
  getTrialStatistics: publicProcedure
    .input(z.object({
      condition: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const allTrials = await searchTrialsByCondition(input.condition, {
        limit: 100
      });
      
      const stats = {
        total: allTrials.totalCount || 0,
        byStatus: {} as Record<string, number>,
        byPhase: {} as Record<string, number>,
        byCountry: {} as Record<string, number>
      };
      
      allTrials.studies?.forEach((study: any) => {
        const status = study.protocolSection?.statusModule?.overallStatus;
        if (status) {
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        }
        
        const phases = study.protocolSection?.designModule?.phases || [];
        phases.forEach((phase: string) => {
          stats.byPhase[phase] = (stats.byPhase[phase] || 0) + 1;
        });
        
        const locations = study.protocolSection?.contactsLocationsModule?.locations || [];
        locations.forEach((loc: any) => {
          const country = loc.country;
          if (country) {
            stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
          }
        });
      });
      
      return stats;
    })
});

export type ClinicalTrialsRouter = typeof clinicalTrialsRouter;
