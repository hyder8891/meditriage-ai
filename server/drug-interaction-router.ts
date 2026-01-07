/**
 * Drug Interaction Router
 * Comprehensive drug interaction checking using PubChem and OpenFDA
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  getDrugInfo, 
  checkDrugDrugInteraction,
  getSimilarCompounds,
  getCompoundImageURL
} from "./pubchem";
import { getDrugSafetyInfo } from "./openfda";
import { invokeGemini } from "./_core/gemini";

export const drugInteractionRouter = router({
  /**
   * Search for drug information
   */
  searchDrug: publicProcedure
    .input(z.object({
      drugName: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const drugInfo = await getDrugInfo(input.drugName);
      
      if (!drugInfo) {
        return {
          found: false,
          message: "Drug not found in database"
        };
      }
      
      return {
        found: true,
        data: {
          cid: drugInfo.cid,
          name: input.drugName,
          compound: drugInfo.compound,
          description: drugInfo.description,
          synonyms: drugInfo.synonyms.slice(0, 10), // Limit to 10 synonyms
          imageUrl: getCompoundImageURL(drugInfo.cid, 'medium')
        }
      };
    }),

  /**
   * Get comprehensive drug safety information
   */
  getDrugSafety: publicProcedure
    .input(z.object({
      drugName: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const [pubchemInfo, fdaInfo] = await Promise.allSettled([
        getDrugInfo(input.drugName),
        getDrugSafetyInfo(input.drugName)
      ]);
      
      return {
        pubchem: pubchemInfo.status === 'fulfilled' ? pubchemInfo.value : null,
        fda: fdaInfo.status === 'fulfilled' ? fdaInfo.value : null
      };
    }),

  /**
   * Check drug-drug interactions
   */
  checkInteractions: protectedProcedure
    .input(z.object({
      drugs: z.array(z.string()).min(2),
      patientConditions: z.array(z.string()).optional(),
      patientAllergies: z.array(z.string()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const interactions: any[] = [];
      
      // Check all pairwise combinations
      for (let i = 0; i < input.drugs.length; i++) {
        for (let j = i + 1; j < input.drugs.length; j++) {
          const drug1 = input.drugs[i];
          const drug2 = input.drugs[j];
          
          try {
            const interaction = await checkDrugDrugInteraction(drug1, drug2);
            
            if (interaction) {
              // Use LLM to analyze interaction based on drug classifications
              const analysisPrompt = `Analyze the potential drug interaction between ${drug1} and ${drug2}.
              
Drug 1 Classification: ${JSON.stringify(interaction.drug1.classification)}
Drug 2 Classification: ${JSON.stringify(interaction.drug2.classification)}
${input.patientConditions ? `Patient Conditions: ${input.patientConditions.join(', ')}` : ''}
${input.patientAllergies ? `Patient Allergies: ${input.patientAllergies.join(', ')}` : ''}

Provide:
1. Interaction severity (major, moderate, minor, or none)
2. Mechanism of interaction
3. Clinical effects
4. Management recommendations
5. Whether this combination should be avoided

Format as JSON with keys: severity, mechanism, effects, recommendations, shouldAvoid`;

              const llmResponse = await invokeGemini({
                messages: [
                  { role: "system", content: "You are a clinical pharmacologist expert in drug interactions." },
                  { role: "user", content: analysisPrompt }
                ]
              });
              
              let analysis;
              try {
                const content = llmResponse.choices[0].message.content;
                // Try to extract JSON from the response
                const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
                const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
                  severity: "unknown",
                  mechanism: content,
                  effects: "Analysis pending",
                  recommendations: "Consult with pharmacist",
                  shouldAvoid: false
                };
              } catch (e) {
                analysis = {
                  severity: "unknown",
                  mechanism: "Unable to parse analysis",
                  effects: llmResponse.choices[0].message.content,
                  recommendations: "Consult with pharmacist",
                  shouldAvoid: false
                };
              }
              
              interactions.push({
                drug1,
                drug2,
                drug1Info: interaction.drug1,
                drug2Info: interaction.drug2,
                analysis
              });
            }
          } catch (error) {
            console.error(`Error checking interaction between ${drug1} and ${drug2}:`, error);
            interactions.push({
              drug1,
              drug2,
              error: "Unable to check interaction",
              analysis: {
                severity: "unknown",
                recommendations: "Consult with healthcare provider"
              }
            });
          }
        }
      }
      
      return {
        totalChecked: input.drugs.length,
        interactionPairs: interactions.length,
        interactions,
        summary: {
          major: interactions.filter(i => i.analysis?.severity === 'major').length,
          moderate: interactions.filter(i => i.analysis?.severity === 'moderate').length,
          minor: interactions.filter(i => i.analysis?.severity === 'minor').length,
          none: interactions.filter(i => i.analysis?.severity === 'none').length
        }
      };
    }),

  /**
   * Get drug alternatives
   */
  getDrugAlternatives: protectedProcedure
    .input(z.object({
      drugName: z.string().min(1),
      similarityThreshold: z.number().min(80).max(100).default(95)
    }))
    .mutation(async ({ input }) => {
      const drugInfo = await getDrugInfo(input.drugName);
      
      if (!drugInfo) {
        return {
          found: false,
          message: "Drug not found"
        };
      }
      
      const similarCIDs = await getSimilarCompounds(drugInfo.cid, input.similarityThreshold);
      
      // Get info for similar compounds (limit to 5)
      const alternatives = await Promise.allSettled(
        similarCIDs.slice(0, 5).map(async (cid: number) => {
          const info = await getDrugInfo(cid.toString());
          return {
            cid,
            name: info?.synonyms?.[0] || `Compound ${cid}`,
            compound: info?.compound,
            imageUrl: getCompoundImageURL(cid, 'small')
          };
        })
      );
      
      return {
        found: true,
        original: {
          name: input.drugName,
          cid: drugInfo.cid,
          imageUrl: getCompoundImageURL(drugInfo.cid, 'medium')
        },
        alternatives: alternatives
          .filter(a => a.status === 'fulfilled')
          .map(a => (a as PromiseFulfilledResult<any>).value)
      };
    }),

  /**
   * Get adverse events for a drug
   */
  getAdverseEvents: publicProcedure
    .input(z.object({
      drugName: z.string().min(1),
      limit: z.number().min(1).max(100).default(10)
    }))
    .mutation(async ({ input }) => {
      const safetyInfo = await getDrugSafetyInfo(input.drugName);
      
      if (!safetyInfo?.adverseEvents?.results) {
        return {
          found: false,
          message: "No adverse event data available"
        };
      }
      
      const events = safetyInfo.adverseEvents.results.slice(0, input.limit);
      
      // Extract common reactions
      const reactions = new Map<string, number>();
      
      events.forEach((event: any) => {
        if (event.patient?.reaction) {
          event.patient.reaction.forEach((r: any) => {
            const term = r.reactionmeddrapt;
            reactions.set(term, (reactions.get(term) || 0) + 1);
          });
        }
      });
      
      const topReactions = Array.from(reactions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([reaction, count]) => ({ reaction, count }));
      
      return {
        found: true,
        totalEvents: safetyInfo.adverseEvents.meta.results.total,
        topReactions,
        events: events.map((e: any) => ({
          receiveDate: e.receivedate,
          serious: e.serious,
          seriousnessHospitalization: e.seriousnesshospitalization,
          seriousnessDeath: e.seriousnessdeath,
          reactions: e.patient?.reaction?.map((r: any) => r.reactionmeddrapt) || []
        }))
      };
    }),

  /**
   * Get drug recalls
   */
  getDrugRecalls: publicProcedure
    .input(z.object({
      drugName: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const safetyInfo = await getDrugSafetyInfo(input.drugName);
      
      if (!safetyInfo?.enforcement?.results) {
        return {
          found: false,
          message: "No recall data available"
        };
      }
      
      const recalls = safetyInfo.enforcement.results.map((r: any) => ({
        recallNumber: r.recall_number,
        recallDate: r.recall_initiation_date,
        classification: r.classification,
        status: r.status,
        reason: r.reason_for_recall,
        productDescription: r.product_description,
        distribution: r.distribution_pattern
      }));
      
      return {
        found: true,
        totalRecalls: recalls.length,
        recalls
      };
    }),

  /**
   * Comprehensive medication review
   */
  comprehensiveMedicationReview: protectedProcedure
    .input(z.object({
      medications: z.array(z.string()).min(1),
      conditions: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      age: z.number().optional(),
      gender: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Get all drug information
      const drugInfos = await Promise.allSettled(
        input.medications.map(drug => getDrugInfo(drug))
      );
      
      // Check interactions
      let interactions = null;
      if (input.medications.length >= 2) {
        const interactionCheck = await checkDrugDrugInteraction(
          input.medications[0],
          input.medications[1]
        );
        interactions = interactionCheck;
      }
      
      // Get safety information
      const safetyInfos = await Promise.allSettled(
        input.medications.map(drug => getDrugSafetyInfo(drug))
      );
      
      // Use LLM for comprehensive analysis
      const analysisPrompt = `Perform a comprehensive medication review for a patient.

Medications: ${input.medications.join(', ')}
${input.conditions ? `Medical Conditions: ${input.conditions.join(', ')}` : ''}
${input.allergies ? `Allergies: ${input.allergies.join(', ')}` : ''}
${input.age ? `Age: ${input.age}` : ''}
${input.gender ? `Gender: ${input.gender}` : ''}

Provide a comprehensive analysis including:
1. Overall medication safety assessment
2. Potential drug-drug interactions
3. Drug-disease interactions
4. Age-appropriate dosing considerations
5. Monitoring recommendations
6. Patient education points
7. Red flags or urgent concerns

Be specific and evidence-based.`;

      const llmResponse = await invokeGemini({
        messages: [
          { role: "system", content: "You are a clinical pharmacist conducting a comprehensive medication review." },
          { role: "user", content: analysisPrompt }
        ]
      });
      
      return {
        medications: drugInfos
          .filter(r => r.status === 'fulfilled' && r.value)
          .map((r: any) => ({
            name: r.value.compound?.Title || 'Unknown',
            cid: r.value.cid,
            synonyms: r.value.synonyms.slice(0, 3)
          })),
        interactions,
        safetyData: safetyInfos
          .filter(r => r.status === 'fulfilled')
          .map((r: any) => r.value),
        analysis: llmResponse.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    })
});

export type DrugInteractionRouter = typeof drugInteractionRouter;
