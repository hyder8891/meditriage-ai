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
   * Explain a medical condition in patient-friendly language
   */
  explainCondition: publicProcedure
    .input(z.object({
      conditionName: z.string().min(1),
      language: z.string().default("en")
    }))
    .mutation(async ({ input }) => {
      const isArabic = input.language === 'ar';
      
      const systemPrompt = isArabic
        ? `أنت مثقف صحي يشرح الحالات الطبية بلغة بسيطة وسهلة الفهم للمرضى. قدم معلومات دقيقة وموثوقة مع التأكيد على أهمية استشارة الطبيب.`
        : `You are a health educator explaining medical conditions in simple, easy-to-understand language for patients. Provide accurate, reliable information while emphasizing the importance of consulting a doctor.`;
      
      const query = isArabic
        ? `اشرح حالة "${input.conditionName}" بلغة بسيطة يفهمها المريض. قدم:
1. نظرة عامة عن الحالة
2. الأعراض الشائعة (كقائمة)
3. الأسباب المحتملة
4. خيارات العلاج
5. طرق الوقاية
6. متى يجب مراجعة الطبيب

أجب بصيغة JSON مع الحقول: overview, symptoms (array), causes, treatment, prevention, whenToSeeDoctor`
        : `Explain the condition "${input.conditionName}" in simple language that a patient can understand. Provide:
1. Overview of the condition
2. Common symptoms (as a list)
3. Possible causes
4. Treatment options
5. Prevention methods
6. When to see a doctor

Respond in JSON format with fields: overview, symptoms (array), causes, treatment, prevention, whenToSeeDoctor`;
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "condition_explanation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overview: { type: "string" },
                symptoms: { type: "array", items: { type: "string" } },
                causes: { type: "string" },
                treatment: { type: "string" },
                prevention: { type: "string" },
                whenToSeeDoctor: { type: "string" }
              },
              required: ["overview", "symptoms", "causes", "treatment", "prevention", "whenToSeeDoctor"],
              additionalProperties: false
            }
          }
        }
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      try {
        return JSON.parse(responseStr);
      } catch (e) {
        return {
          overview: responseStr,
          symptoms: [],
          causes: "",
          treatment: "",
          prevention: "",
          whenToSeeDoctor: ""
        };
      }
    }),

  /**
   * Explain a treatment in patient-friendly language
   */
  explainTreatment: publicProcedure
    .input(z.object({
      treatmentName: z.string().min(1),
      language: z.string().default("en")
    }))
    .mutation(async ({ input }) => {
      const isArabic = input.language === 'ar';
      
      const systemPrompt = isArabic
        ? `أنت مثقف صحي يشرح العلاجات الطبية بلغة بسيطة وسهلة الفهم للمرضى. قدم معلومات دقيقة وموثوقة مع التأكيد على أهمية استشارة الطبيب.`
        : `You are a health educator explaining medical treatments in simple, easy-to-understand language for patients. Provide accurate, reliable information while emphasizing the importance of consulting a doctor.`;
      
      const query = isArabic
        ? `اشرح علاج "${input.treatmentName}" بلغة بسيطة يفهمها المريض. قدم:
1. ماذا تتوقع من هذا العلاج
2. ما يجب فعله قبل العلاج
3. ما يحدث أثناء العلاج
4. ما يجب فعله بعد العلاج
5. الآثار الجانبية المحتملة (كقائمة)
6. أسئلة مهمة لطرحها على طبيبك (كقائمة)

أجب بصيغة JSON مع الحقول: whatToExpect, beforeTreatment, duringTreatment, afterTreatment, sideEffects (array), questionsToAsk (array)`
        : `Explain the treatment "${input.treatmentName}" in simple language that a patient can understand. Provide:
1. What to expect from this treatment
2. What to do before treatment
3. What happens during treatment
4. What to do after treatment
5. Possible side effects (as a list)
6. Important questions to ask your doctor (as a list)

Respond in JSON format with fields: whatToExpect, beforeTreatment, duringTreatment, afterTreatment, sideEffects (array), questionsToAsk (array)`;
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "treatment_explanation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                whatToExpect: { type: "string" },
                beforeTreatment: { type: "string" },
                duringTreatment: { type: "string" },
                afterTreatment: { type: "string" },
                sideEffects: { type: "array", items: { type: "string" } },
                questionsToAsk: { type: "array", items: { type: "string" } }
              },
              required: ["whatToExpect", "beforeTreatment", "duringTreatment", "afterTreatment", "sideEffects", "questionsToAsk"],
              additionalProperties: false
            }
          }
        }
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      try {
        return JSON.parse(responseStr);
      } catch (e) {
        return {
          whatToExpect: responseStr,
          beforeTreatment: "",
          duringTreatment: "",
          afterTreatment: "",
          sideEffects: [],
          questionsToAsk: []
        };
      }
    }),

  /**
   * Generate second opinion preparation questions
   */
  generateSecondOpinionQuestions: protectedProcedure
    .input(z.object({
      diagnosis: z.string().min(1),
      symptoms: z.string().optional(),
      currentTreatment: z.string().optional(),
      concerns: z.array(z.string()).optional(),
      additionalInfo: z.string().optional(),
      language: z.string().default("en")
    }))
    .mutation(async ({ input }) => {
      const isArabic = input.language === 'ar';
      
      const systemPrompt = isArabic
        ? `أنت مساعد طبي يساعد المرضى على تحضير أسئلة للحصول على رأي طبي ثانٍ. قدم أسئلة ذكية ومفيدة تساعد المريض على فهم حالته بشكل أفضل.`
        : `You are a medical assistant helping patients prepare questions for getting a second medical opinion. Provide smart, helpful questions that help the patient better understand their condition.`;
      
      let context = isArabic
        ? `التشخيص: ${input.diagnosis}`
        : `Diagnosis: ${input.diagnosis}`;
      
      if (input.symptoms) {
        context += isArabic ? `\nالأعراض: ${input.symptoms}` : `\nSymptoms: ${input.symptoms}`;
      }
      if (input.currentTreatment) {
        context += isArabic ? `\nالعلاج الحالي: ${input.currentTreatment}` : `\nCurrent Treatment: ${input.currentTreatment}`;
      }
      if (input.concerns && input.concerns.length > 0) {
        context += isArabic ? `\nالمخاوف: ${input.concerns.join(', ')}` : `\nConcerns: ${input.concerns.join(', ')}`;
      }
      if (input.additionalInfo) {
        context += isArabic ? `\nمعلومات إضافية: ${input.additionalInfo}` : `\nAdditional Info: ${input.additionalInfo}`;
      }
      
      const query = isArabic
        ? `بناءً على المعلومات التالية:\n${context}\n\nقم بإنشاء 8-10 أسئلة مهمة يمكن للمريض طرحها على طبيب آخر للحصول على رأي ثانٍ. يجب أن تكون الأسئلة:\n- محددة وواضحة\n- تغطي التشخيص والعلاج والتوقعات\n- تساعد المريض على اتخاذ قرار مستنير\n\nأجب بصيغة JSON مع حقل questions (array of strings)`
        : `Based on the following information:\n${context}\n\nGenerate 8-10 important questions the patient can ask another doctor for a second opinion. The questions should be:\n- Specific and clear\n- Cover diagnosis, treatment, and prognosis\n- Help the patient make an informed decision\n\nRespond in JSON format with a questions field (array of strings)`;
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "second_opinion_questions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: { type: "array", items: { type: "string" } }
              },
              required: ["questions"],
              additionalProperties: false
            }
          }
        }
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      try {
        return JSON.parse(responseStr);
      } catch (e) {
        return { questions: [] };
      }
    }),

  /**
   * Simplify a medical article abstract for patients
   */
  simplifyArticle: publicProcedure
    .input(z.object({
      title: z.string(),
      abstract: z.string(),
      language: z.string().default("en")
    }))
    .mutation(async ({ input }) => {
      const isArabic = input.language === 'ar';
      
      const systemPrompt = isArabic
        ? `أنت مثقف صحي يبسط الأبحاث الطبية للمرضى العاديين. حول الملخصات العلمية المعقدة إلى معلومات سهلة الفهم.`
        : `You are a health educator who simplifies medical research for regular patients. Convert complex scientific abstracts into easy-to-understand information.`;
      
      const query = isArabic
        ? `بسّط هذا البحث الطبي للمريض العادي:\n\nالعنوان: ${input.title}\n\nالملخص: ${input.abstract}\n\nقدم:\n1. ملخص بسيط (2-3 جمل) لما يدور حوله البحث\n2. النتائج الرئيسية بلغة بسيطة\n3. ماذا يعني هذا للمريض العادي\n4. أي تحذيرات أو قيود`
        : `Simplify this medical research for a regular patient:\n\nTitle: ${input.title}\n\nAbstract: ${input.abstract}\n\nProvide:\n1. A simple summary (2-3 sentences) of what the research is about\n2. Key findings in simple language\n3. What this means for the average patient\n4. Any caveats or limitations`;
      
      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ]
      });
      
      const response = llmResponse.choices[0].message.content;
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      
      return {
        simplifiedSummary: responseStr,
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
