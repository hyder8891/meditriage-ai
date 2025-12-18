import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { invokeDeepSeek, trainOnMedicalMaterial, deepMedicalReasoning } from "./_core/deepseek";
import { analyzeXRayBackend, analyzeDocumentBackend } from "./_core/gemini";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { 
  createTriageRecord, 
  getTriageRecordsByUserId, 
  getTriageRecordById,
  getAllTriageRecords,
  createMedicalDocument,
  getMedicalDocumentsByUserId,
  createVoiceRecording,
  getVoiceRecordingsByUserId
} from "./db";
import { SYSTEM_PROMPT_TRIAGE, SYSTEM_PROMPT_FINAL_ADVICE } from "@shared/localization";
import { 
  createTrainingMaterial,
  createTriageTrainingData,
  getAllTrainingMaterials,
  getAllTriageTrainingData,
  getUntrainedTriageData,
  updateTrainingMaterialStatus,
  createTrainingSession,
  updateTrainingSession,
  getAllTrainingSessions,
  getTrainingSessionById
} from "./training-db";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Traditional admin login with username/password
    adminLogin: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Simple admin credentials check
        if (input.username === 'admin' && input.password === 'admin') {
          // Create a simple admin session marker
          // In production, this should use proper session management
          return {
            success: true,
            user: {
              id: 0,
              username: 'admin',
              role: 'admin' as const,
            },
          };
        }
        
        return {
          success: false,
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  triage: router({
    // Start a new triage conversation with DeepSeek backend
    chatDeepSeek: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
        language: z.enum(['en', 'ar']).default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const { messages, language } = input;
        
        const systemMessage = {
          role: 'system' as const,
          content: SYSTEM_PROMPT_TRIAGE + (language === 'ar' ? '\n\nRespond in Arabic.' : ''),
        };
        
        const fullMessages = messages[0]?.role === 'system' 
          ? messages 
          : [systemMessage, ...messages];

        const response = await invokeDeepSeek({
          messages: fullMessages,
          temperature: 0.7,
        });

        return {
          content: response.choices[0]?.message?.content || '',
          usage: response.usage,
        };
      }),

    // Start a new triage conversation (original with built-in LLM)
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
        language: z.enum(['en', 'ar']).default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const { messages, language } = input;
        
        // Add system prompt if not present
        const systemMessage = {
          role: 'system' as const,
          content: SYSTEM_PROMPT_TRIAGE + (language === 'ar' ? '\n\nRespond in Arabic.' : ''),
        };
        
        const fullMessages = messages[0]?.role === 'system' 
          ? messages 
          : [systemMessage, ...messages];

        const response = await invokeLLM({
          messages: fullMessages,
        });

        return {
          content: response.choices[0]?.message?.content || '',
        };
      }),

    // Generate final medical advice
    generateAdvice: protectedProcedure
      .input(z.object({
        conversationHistory: z.string(), // JSON stringified
        language: z.enum(['en', 'ar']).default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const { conversationHistory, language } = input;

        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT_FINAL_ADVICE + (language === 'ar' ? '\n\nRespond in Arabic.' : ''),
            },
            {
              role: 'user',
              content: `Based on this conversation, generate a comprehensive medical report:\n\n${conversationHistory}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "medical_advice",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  urgencyLevel: {
                    type: "string",
                    enum: ["EMERGENCY", "URGENT", "SEMI-URGENT", "NON-URGENT", "ROUTINE"],
                  },
                  chiefComplaint: { type: "string" },
                  symptoms: {
                    type: "array",
                    items: { type: "string" },
                  },
                  assessment: { type: "string" },
                  recommendations: { type: "string" },
                  redFlags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  disclaimer: { type: "string" },
                },
                required: ["urgencyLevel", "chiefComplaint", "symptoms", "assessment", "recommendations", "redFlags", "disclaimer"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const advice = typeof content === 'string' ? JSON.parse(content) : content;
        return advice;
      }),

    // Save triage record
    save: protectedProcedure
      .input(z.object({
        language: z.string(),
        conversationHistory: z.string(),
        urgencyLevel: z.string(),
        chiefComplaint: z.string(),
        symptoms: z.array(z.string()),
        assessment: z.string(),
        recommendations: z.string(),
        redFlags: z.array(z.string()).optional(),
        duration: z.number().optional(),
        messageCount: z.number(),
        attachedFiles: z.array(z.string()).optional(),
        xrayImages: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createTriageRecord({
          userId: ctx.user.id,
          language: input.language,
          conversationHistory: input.conversationHistory,
          urgencyLevel: input.urgencyLevel,
          chiefComplaint: input.chiefComplaint,
          symptoms: JSON.stringify(input.symptoms),
          assessment: input.assessment,
          recommendations: input.recommendations,
          redFlags: JSON.stringify(input.redFlags || []),
          duration: input.duration,
          messageCount: input.messageCount,
        });

        // Store training data for model improvement
        const insertResult = result[0] as any;
        const triageId = insertResult?.insertId || 0;
        
        if (triageId) {
          await createTriageTrainingData({
            triageRecordId: triageId,
            conversationJson: input.conversationHistory,
            symptoms: JSON.stringify(input.symptoms),
            urgencyLevel: input.urgencyLevel,
            attachedFiles: JSON.stringify(input.attachedFiles || []),
            xrayImages: JSON.stringify(input.xrayImages || []),
          });
        }

        return { success: true, triageId };
      }),

    // Get user's triage history
    history: protectedProcedure.query(async ({ ctx }) => {
      const records = await getTriageRecordsByUserId(ctx.user.id);
      return records.map(record => ({
        ...record,
        symptoms: JSON.parse(record.symptoms),
        redFlags: record.redFlags ? JSON.parse(record.redFlags) : [],
      }));
    }),

    // Get specific triage record
    getRecord: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const record = await getTriageRecordById(input.id);
        if (!record || record.userId !== ctx.user.id) {
          throw new Error('Record not found');
        }
        return {
          ...record,
          symptoms: JSON.parse(record.symptoms),
          redFlags: record.redFlags ? JSON.parse(record.redFlags) : [],
          conversationHistory: JSON.parse(record.conversationHistory),
        };
      }),

    // Admin: Get all triage records
    adminGetAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const records = await getAllTriageRecords();
      return records.map(record => ({
        ...record,
        symptoms: JSON.parse(record.symptoms),
        redFlags: record.redFlags ? JSON.parse(record.redFlags) : [],
      }));
    }),
  }),

  voice: router({
    // Transcribe audio to text
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.enum(['en', 'ar']).default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
        });

        if ('error' in result) {
          throw new Error(result.error);
        }

        // Save voice recording metadata
        await createVoiceRecording({
          userId: ctx.user.id,
          audioKey: input.audioUrl.split('/').pop() || '',
          audioUrl: input.audioUrl,
          transcription: result.text,
          language: input.language,
        });

        return {
          text: result.text,
          language: result.language,
        };
      }),

    // Upload audio file
    upload: protectedProcedure
      .input(z.object({
        audioData: z.string(), // base64 encoded
        mimeType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.audioData, 'base64');
        const fileKey = `voice/${ctx.user.id}/${nanoid()}.webm`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { url };
      }),

    // Get user's voice recordings
    history: protectedProcedure.query(async ({ ctx }) => {
      return await getVoiceRecordingsByUserId(ctx.user.id);
    }),
  }),

  training: router({
    // Batch process multiple files (directory upload)
    batchProcess: protectedProcedure
      .input(z.object({
        files: z.array(z.object({
          filename: z.string(),
          content: z.string(),
          category: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const results = [];
        const totalFiles = input.files.length;

        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          
          try {
            // Store to S3
            const contentBuffer = Buffer.from(file.content, 'utf-8');
            const storageKey = `training/${nanoid()}-${file.filename}`;
            const { url } = await storagePut(storageKey, contentBuffer, 'text/plain');

            // Process with DeepSeek AI (fluid compute)
            const analysis = await trainOnMedicalMaterial({
              title: file.filename,
              content: file.content,
              category: file.category,
              source: 'batch_upload',
            });

            await createTrainingMaterial({
              title: file.filename,
              category: file.category,
              source: 'batch_upload',
              content: file.content.substring(0, 5000),
              storageKey,
              storageUrl: url,
              summary: analysis.summary,
              keyFindings: JSON.stringify(analysis.keyFindings),
              clinicalRelevance: analysis.clinicalRelevance,
              trainingStatus: 'processed',
            });

            results.push({
              filename: file.filename,
              success: true,
              progress: Math.round(((i + 1) / totalFiles) * 100),
            });
          } catch (error) {
            console.error(`Error processing ${file.filename}:`, error);
            results.push({
              filename: file.filename,
              success: false,
              error: 'Processing failed',
              progress: Math.round(((i + 1) / totalFiles) * 100),
            });
          }
        }

        return {
          totalProcessed: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results,
        };
      }),

    // Train model on all existing materials
    trainAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const allMaterials = await getAllTrainingMaterials();
        const startTime = Date.now();
        
        // Create training session
        const sessionId = await createTrainingSession({
          totalMaterials: allMaterials.length,
          triggeredBy: ctx.user.id,
        });
        
        const results = [];
        let processed = 0;

        try {
          for (const material of allMaterials) {
            try {
              // Retrain with DeepSeek
              const analysis = await trainOnMedicalMaterial({
                title: material.title,
                content: material.content,
                category: material.category,
                source: material.source,
              });

              // Update with new analysis
              await updateTrainingMaterialStatus(
                material.id,
                'trained',
                {
                  summary: analysis.summary,
                  keyFindings: JSON.stringify(analysis.keyFindings),
                  clinicalRelevance: analysis.clinicalRelevance,
                }
              );

              processed++;
              results.push({
                id: material.id,
                title: material.title,
                success: true,
                progress: Math.round((processed / allMaterials.length) * 100),
              });
            } catch (error) {
              console.error(`Failed to train on ${material.title}:`, error);
              results.push({
                id: material.id,
                title: material.title,
                success: false,
                error: 'Training failed',
                progress: Math.round((processed / allMaterials.length) * 100),
              });
            }
          }

          const duration = Math.floor((Date.now() - startTime) / 1000);
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;

          // Update session as completed
          await updateTrainingSession(sessionId, {
            processedMaterials: processed,
            successfulMaterials: successful,
            failedMaterials: failed,
            status: 'completed',
            completedAt: new Date(),
            duration,
            results: JSON.stringify(results),
          });

          return {
            sessionId,
            totalMaterials: allMaterials.length,
            processed,
            successful,
            failed,
            duration,
            results,
          };
        } catch (error) {
          // Update session as failed
          await updateTrainingSession(sessionId, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          });
          throw error;
        }
      }),

    // Add medical training material
    addMaterial: protectedProcedure
      .input(z.object({
        title: z.string(),
        category: z.string(),
        source: z.string(),
        sourceUrl: z.string().optional(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        // Store content to S3
        const contentBuffer = Buffer.from(input.content, 'utf-8');
        const storageKey = `training/${nanoid()}.txt`;
        const { url } = await storagePut(storageKey, contentBuffer, 'text/plain');

        // Process with DeepSeek
        const analysis = await trainOnMedicalMaterial({
          title: input.title,
          content: input.content,
          category: input.category,
          source: input.source,
        });

        await createTrainingMaterial({
          title: input.title,
          category: input.category,
          source: input.source,
          sourceUrl: input.sourceUrl,
          content: input.content.substring(0, 5000), // Store excerpt in DB
          storageKey,
          storageUrl: url,
          summary: analysis.summary,
          keyFindings: JSON.stringify(analysis.keyFindings),
          clinicalRelevance: analysis.clinicalRelevance,
          trainingStatus: 'processed',
        });

        return { success: true, analysis };
      }),

    // Get all training materials (admin only)
    getAllMaterials: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return await getAllTrainingMaterials();
    }),

    // Get all triage training data
    getAllTriageData: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await getAllTriageTrainingData();
      }),

    // Get all training sessions
    getTrainingSessions: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await getAllTrainingSessions();
      }),

    // Get training session by ID
    getTrainingSessionById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await getTrainingSessionById(input.id);
      }),

    // Get untrained data for export
    getUntrainedData: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return await getUntrainedTriageData();
    }),
  }),

  imaging: router({
    // Analyze X-ray using Gemini (secure backend)
    analyzeXRay: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string(),
        clinicalContext: z.string().optional(),
        language: z.enum(['en', 'ar']).default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const analysis = await analyzeXRayBackend({
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          clinicalContext: input.clinicalContext,
          language: input.language,
        });

        return analysis;
      }),

    // Analyze medical document using Gemini (secure backend)
    analyzeDocument: protectedProcedure
      .input(z.object({
        documentBase64: z.string(),
        mimeType: z.string(),
        documentType: z.enum(['lab_report', 'prescription', 'medical_record']),
        language: z.enum(['en', 'ar']).default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const analysis = await analyzeDocumentBackend({
          documentBase64: input.documentBase64,
          mimeType: input.mimeType,
          documentType: input.documentType,
          language: input.language,
        });

        return analysis;
      }),
  }),

  documents: router({
    // Upload medical document
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        documentType: z.string(),
        description: z.string().optional(),
        triageRecordId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `documents/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        await createMedicalDocument({
          userId: ctx.user.id,
          triageRecordId: input.triageRecordId,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize: buffer.length,
          mimeType: input.mimeType,
          documentType: input.documentType,
          description: input.description,
        });

        return { url, fileKey };
      }),

    // Get user's documents
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getMedicalDocumentsByUserId(ctx.user.id);
    }),
   }),
});
export type AppRouter = typeof appRouter;
