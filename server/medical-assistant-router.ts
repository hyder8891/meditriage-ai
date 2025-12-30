/**
 * AI Medical Assistant Router
 * Context-aware medical chatbot with integrated knowledge base
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDrugInfo } from "./pubchem";
import { getDrugSafetyInfo } from "./openfda";
import { searchClinicalTrials } from "./clinicaltrials";
import { searchPubMed } from "./ncbi";

// Medical assistant conversation context
interface ConversationContext {
  userId?: number;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  recentSymptoms?: string[];
}

/**
 * Build enhanced system prompt with patient context
 */
function buildMedicalAssistantPrompt(context?: ConversationContext): string {
  let prompt = `You are MediTriage AI Pro, an advanced medical AI assistant designed to provide evidence-based medical information and guidance.

Your capabilities include:
- Answering medical questions with citations from medical literature
- Explaining medical conditions, symptoms, and treatments
- Providing drug information and interaction warnings
- Suggesting relevant clinical trials
- Offering health and wellness advice
- Interpreting medical terminology

Important guidelines:
1. Always provide evidence-based information with citations when possible
2. Clearly state when you're uncertain or when professional medical consultation is needed
3. Never provide definitive diagnoses - only educational information
4. Emphasize the importance of consulting healthcare providers for medical decisions
5. Be empathetic and supportive while maintaining professional boundaries
6. Consider regional context (MENA region, Iraq) when relevant
7. Provide information in clear, accessible language`;

  if (context) {
    prompt += `\n\nPatient Context:`;
    
    if (context.patientAge) {
      prompt += `\n- Age: ${context.patientAge} years`;
    }
    
    if (context.patientGender) {
      prompt += `\n- Gender: ${context.patientGender}`;
    }
    
    if (context.medicalHistory && context.medicalHistory.length > 0) {
      prompt += `\n- Medical History: ${context.medicalHistory.join(', ')}`;
    }
    
    if (context.currentMedications && context.currentMedications.length > 0) {
      prompt += `\n- Current Medications: ${context.currentMedications.join(', ')}`;
    }
    
    if (context.allergies && context.allergies.length > 0) {
      prompt += `\n- Allergies: ${context.allergies.join(', ')}`;
    }
    
    if (context.recentSymptoms && context.recentSymptoms.length > 0) {
      prompt += `\n- Recent Symptoms: ${context.recentSymptoms.join(', ')}`;
    }
    
    prompt += `\n\nConsider this patient context when providing information, but always maintain that this is educational information and not a diagnosis.`;
  }
  
  return prompt;
}

/**
 * Enhance response with relevant medical data
 */
async function enhanceWithMedicalData(query: string, response: string) {
  const enhancements: any = {
    citations: [],
    relatedDrugs: [],
    relatedTrials: [],
    additionalResources: []
  };
  
  // Extract potential drug names (simple heuristic)
  const drugPattern = /\b[A-Z][a-z]+(?:ine|ol|pam|cin|mycin|cillin)\b/g;
  const drugMatches = query.match(drugPattern) || [];
  const potentialDrugs = Array.from(new Set(drugMatches));
  
  if (potentialDrugs.length > 0) {
    for (const drug of potentialDrugs.slice(0, 2)) {
      try {
        const drugInfo = await getDrugInfo(drug);
        if (drugInfo) {
          enhancements.relatedDrugs.push({
            name: drug,
            cid: drugInfo.cid,
            description: drugInfo.description?.Description || 'No description available'
          });
        }
      } catch (error) {
        // Silently fail - drug might not exist
      }
    }
  }
  
  // Extract potential medical conditions
  const conditionPattern = /\b(?:diabetes|hypertension|cancer|asthma|arthritis|depression|anxiety)\b/gi;
  const conditionMatches = query.match(conditionPattern) || [];
  const conditions = Array.from(new Set(conditionMatches));
  
  if (conditions.length > 0) {
    for (const condition of conditions.slice(0, 1)) {
      try {
        const trials = await searchClinicalTrials({
          condition,
          pageSize: 3
        });
        
        if (trials.studies && trials.studies.length > 0) {
          enhancements.relatedTrials = trials.studies.map((study: any) => ({
            nctId: study.protocolSection?.identificationModule?.nctId,
            title: study.protocolSection?.identificationModule?.briefTitle,
            status: study.protocolSection?.statusModule?.overallStatus
          }));
        }
      } catch (error) {
        // Silently fail
      }
    }
  }
  
  return enhancements;
}

export const medicalAssistantRouter = router({
  /**
   * Chat with medical assistant
   */
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })).optional(),
      includeContext: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      // Build patient context from user profile
      const context: ConversationContext = {
        userId: ctx.user.id
      };
      
      if (input.includeContext) {
        // Get user medical profile
        const { getDb } = await import('./db');
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        const [userProfile] = await db!
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        if (userProfile) {
          if (userProfile.dateOfBirth) {
            const age = new Date().getFullYear() - new Date(userProfile.dateOfBirth).getFullYear();
            context.patientAge = age;
          }
          
          context.patientGender = userProfile.gender || undefined;
          
          if (userProfile.chronicConditions) {
            try {
              context.medicalHistory = JSON.parse(userProfile.chronicConditions);
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          if (userProfile.currentMedications) {
            try {
              context.currentMedications = JSON.parse(userProfile.currentMedications);
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          if (userProfile.allergies) {
            try {
              context.allergies = JSON.parse(userProfile.allergies);
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
      
      // Build conversation messages
      const messages: any[] = [
        { role: "system", content: buildMedicalAssistantPrompt(context) }
      ];
      
      // Add conversation history
      if (input.conversationHistory) {
        messages.push(...input.conversationHistory.map(msg => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        })));
      }
      
      // Add current message
      messages.push({ role: "user", content: input.message });
      
      // Get LLM response
      const llmResponse = await invokeLLM({ messages });
      
      const assistantMessage = llmResponse.choices[0].message.content;
      const contentStr = typeof assistantMessage === 'string' ? assistantMessage : JSON.stringify(assistantMessage);
      
      // Enhance with medical data
      const enhancements = await enhanceWithMedicalData(input.message, contentStr);
      
      return {
        message: contentStr,
        enhancements,
        timestamp: new Date().toISOString()
      };
    }),

  /**
   * Ask about a specific medical condition
   */
  askAboutCondition: publicProcedure
    .input(z.object({
      condition: z.string().min(1),
      specificQuestion: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const query = input.specificQuestion 
        ? `Tell me about ${input.condition}. Specifically: ${input.specificQuestion}`
        : `Provide comprehensive information about ${input.condition}, including causes, symptoms, diagnosis, treatment options, and prognosis.`;
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: buildMedicalAssistantPrompt() },
          { role: "user", content: query }
        ]
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      // Get related clinical trials
      let trials = null;
      try {
        const trialsData = await searchClinicalTrials({
          condition: input.condition,
          pageSize: 5
        });
        
        trials = trialsData.studies?.slice(0, 5).map((study: any) => ({
          nctId: study.protocolSection?.identificationModule?.nctId,
          title: study.protocolSection?.identificationModule?.briefTitle,
          status: study.protocolSection?.statusModule?.overallStatus
        }));
      } catch (error) {
        // Silently fail
      }
      
      return {
        condition: input.condition,
        information: responseStr,
        relatedTrials: trials,
        timestamp: new Date().toISOString()
      };
    }),

  /**
   * Ask about a medication
   */
  askAboutMedication: publicProcedure
    .input(z.object({
      medication: z.string().min(1),
      specificQuestion: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Get drug information from PubChem
      const drugInfo = await getDrugInfo(input.medication);
      
      // Get safety information from OpenFDA
      let safetyInfo = null;
      try {
        safetyInfo = await getDrugSafetyInfo(input.medication);
      } catch (error) {
        // Silently fail
      }
      
      // Build comprehensive query
      const query = input.specificQuestion
        ? `Tell me about the medication ${input.medication}. Specifically: ${input.specificQuestion}`
        : `Provide comprehensive information about ${input.medication}, including what it's used for, how it works, dosage, side effects, interactions, and precautions.`;
      
      const contextInfo = drugInfo ? `\n\nDrug Information from PubChem:\n${JSON.stringify(drugInfo.description, null, 2)}` : '';
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: buildMedicalAssistantPrompt() + contextInfo },
          { role: "user", content: query }
        ]
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      return {
        medication: input.medication,
        information: responseStr,
        drugData: drugInfo ? {
          cid: drugInfo.cid,
          synonyms: drugInfo.synonyms.slice(0, 5),
          description: drugInfo.description
        } : null,
        safetyData: safetyInfo ? {
          adverseEventsCount: safetyInfo.adverseEvents?.meta?.results?.total || 0,
          recallsCount: safetyInfo.enforcement?.meta?.results?.total || 0
        } : null,
        timestamp: new Date().toISOString()
      };
    }),

  /**
   * Explain medical terminology
   */
  explainTerm: publicProcedure
    .input(z.object({
      term: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a medical educator explaining medical terminology in simple, accessible language." },
          { role: "user", content: `Explain the medical term "${input.term}" in simple language that a patient can understand. Include: definition, common usage, related terms, and when someone might encounter this term.` }
        ]
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      return {
        term: input.term,
        explanation: responseStr,
        timestamp: new Date().toISOString()
      };
    }),

  /**
   * Get health tips and recommendations
   */
  getHealthTips: publicProcedure
    .input(z.object({
      topic: z.string().min(1),
      personalizeFor: z.object({
        age: z.number().optional(),
        gender: z.string().optional(),
        conditions: z.array(z.string()).optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      const context: ConversationContext = input.personalizeFor ? {
        patientAge: input.personalizeFor.age,
        patientGender: input.personalizeFor.gender,
        medicalHistory: input.personalizeFor.conditions
      } : {};
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: buildMedicalAssistantPrompt(context) },
          { role: "user", content: `Provide evidence-based health tips and recommendations about ${input.topic}. Include practical, actionable advice that can be implemented in daily life.` }
        ]
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      return {
        topic: input.topic,
        tips: responseStr,
        personalized: !!input.personalizeFor,
        timestamp: new Date().toISOString()
      };
    }),

  /**
   * Interpret lab results (educational purposes only)
   */
  interpretLabResults: protectedProcedure
    .input(z.object({
      testName: z.string(),
      value: z.number(),
      unit: z.string(),
      referenceRange: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const query = `Explain the lab test "${input.testName}" with a value of ${input.value} ${input.unit}${input.referenceRange ? ` (reference range: ${input.referenceRange})` : ''}. 

Provide:
1. What this test measures
2. Whether this value is within normal range
3. What it might indicate if abnormal
4. Factors that can affect this value
5. Recommended follow-up actions

Remember to emphasize that this is educational information and the patient should discuss results with their healthcare provider.`;
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a medical educator helping patients understand their lab results. Always emphasize the importance of discussing results with their healthcare provider." },
          { role: "user", content: query }
        ]
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      return {
        testName: input.testName,
        value: input.value,
        unit: input.unit,
        interpretation: responseStr,
        disclaimer: "This is educational information only. Please discuss your lab results with your healthcare provider for medical advice.",
        timestamp: new Date().toISOString()
      };
    })
});

export type MedicalAssistantRouter = typeof medicalAssistantRouter;
