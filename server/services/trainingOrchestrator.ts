/**
 * Training Orchestration Service
 * Manages AI model training jobs, progress tracking, and model versioning
 */

import { invokeGemini } from "../_core/gemini";
import { getDb } from "../db";
import { trainingJobs, trainingProgress, modelVersions, trainingDatasets, medicalArticles, regionalMedicalData } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../storage";

// Helper to get database instance
async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export interface TrainingConfig {
  jobName: string;
  jobType: "full_training" | "incremental" | "fine_tuning" | "evaluation";
  baseModel: string;
  datasetIds: number[];
  totalEpochs: number;
  batchSize: number;
  learningRate: number;
  includeRegionalData: boolean;
}

export interface TrainingProgressUpdate {
  jobId: number;
  epoch: number;
  step: number;
  totalSteps: number;
  loss?: number;
  accuracy?: number;
  validationLoss?: number;
  validationAccuracy?: number;
}

/**
 * Start a new training job
 */
export async function startTrainingJob(
  config: TrainingConfig,
  userId: number,
  onProgress?: (update: TrainingProgressUpdate) => void
): Promise<{ jobId: number; status: string }> {
  // Create training job record
  const db = await requireDb();
  const [job] = await db.insert(trainingJobs).values({
    jobName: config.jobName,
    jobType: config.jobType,
    baseModel: config.baseModel,
    datasetIds: JSON.stringify(config.datasetIds),
    totalDataPoints: 0, // Will be calculated
    status: "queued",
    progress: 0,
    currentEpoch: 0,
    totalEpochs: config.totalEpochs,
    trainingConfig: JSON.stringify({
      batchSize: config.batchSize,
      learningRate: config.learningRate,
      includeRegionalData: config.includeRegionalData,
    }),
    triggeredBy: userId,
  });
  
  const jobId = job.insertId;
  
  // Start training asynchronously
  executeTraining(jobId, config, userId, onProgress).catch(async (error) => {
    console.error(`Training job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(trainingJobs)
        .set({
          status: "failed",
          errorMessage: error.message,
          completedAt: new Date(),
        })
        .where(eq(trainingJobs.id, jobId)).execute();
    }
  });
  
  return { jobId, status: "queued" };
}

/**
 * Execute training job
 */
async function executeTraining(
  jobId: number,
  config: TrainingConfig,
  userId: number,
  onProgress?: (update: TrainingProgressUpdate) => void
): Promise<void> {
  const startTime = Date.now();
  
  const db = await requireDb();
  
  // Update job status to running
  await db.update(trainingJobs)
    .set({
      status: "running",
      startedAt: new Date(),
      progress: 0,
    })
    .where(eq(trainingJobs.id, jobId));
  
  try {
    // Step 1: Collect training data
    const trainingData = await collectTrainingData(config.datasetIds, config.includeRegionalData);
    
    // Update total data points
    await db.update(trainingJobs)
      .set({
        totalDataPoints: trainingData.length,
        progress: 10,
      })
      .where(eq(trainingJobs.id, jobId));
    
    // Step 2: Prepare training dataset
    const formattedData = await formatTrainingData(trainingData);
    
    await db.update(trainingJobs)
      .set({ progress: 20 })
      .where(eq(trainingJobs.id, jobId));
    
    // Step 3: Train model (simulated for now - in production, this would call actual training API)
    const modelMetrics = await trainModel(
      config.baseModel,
      formattedData,
      config.totalEpochs,
      config.batchSize,
      config.learningRate,
      async (epoch, step, totalSteps, metrics) => {
        // Calculate progress (20% to 90%)
        const progressPercent = 20 + (70 * (epoch * totalSteps + step) / (config.totalEpochs * totalSteps));
        
        // Update job progress
        await db.update(trainingJobs)
          .set({
            progress: Math.floor(progressPercent),
            currentEpoch: epoch,
          })
          .where(eq(trainingJobs.id, jobId)).execute();
        
        // Record progress metrics
        await db.insert(trainingProgress).values({
          jobId,
          epoch,
          step,
          totalSteps,
          loss: metrics.loss,
          accuracy: metrics.accuracy,
          validationLoss: metrics.validationLoss,
          validationAccuracy: metrics.validationAccuracy,
          perplexity: metrics.perplexity,
          learningRate: config.learningRate,
          batchSize: config.batchSize,
          stepDuration: metrics.stepDuration,
        });
        
        // Call progress callback
        if (onProgress) {
          onProgress({
            jobId,
            epoch,
            step,
            totalSteps,
            loss: metrics.loss,
            accuracy: metrics.accuracy,
            validationLoss: metrics.validationLoss,
            validationAccuracy: metrics.validationAccuracy,
          });
        }
      }
    );
    
    // Step 4: Save model version
    const modelVersion = await saveModelVersion(
      jobId,
      config.jobName,
      config.baseModel,
      modelMetrics,
      config.datasetIds,
      trainingData.length,
      userId);
    
    // Step 5: Complete training
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    await db.update(trainingJobs)
      .set({
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        duration,
        outputModelId: modelVersion.id,
        trainingMetrics: JSON.stringify(modelMetrics),
      })
      .where(eq(trainingJobs.id, jobId));
    
  } catch (error: any) {
    // Handle training failure
    await db.update(trainingJobs)
      .set({
        status: "failed",
        errorMessage: error.message,
        completedAt: new Date(),
      })
      .where(eq(trainingJobs.id, jobId));
    
    throw error;
  }
}

/**
 * Collect training data from datasets
 */
async function collectTrainingData(
  datasetIds: number[],
  includeRegionalData: boolean
): Promise<any[]> {
  const db = await requireDb();
  const trainingData: any[] = [];
  
  // Collect from medical articles
  const articles = await db.select()
    .from(medicalArticles)
    .where(eq(medicalArticles.processingStatus, "processed"))
    .limit(10000); // Limit for now
  
  for (const article of articles) {
    trainingData.push({
      type: "medical_article",
      content: {
        title: article.title,
        abstract: article.abstract,
        fullText: article.fullText,
        meshTerms: JSON.parse(article.meshTerms || "[]"),
        keywords: JSON.parse(article.keywords || "[]"),
      },
      metadata: {
        pmid: article.pmid,
        journal: article.journal,
        publicationYear: article.publicationYear,
      },
    });
  }
  
  // Include regional data if requested
  if (includeRegionalData) {
    const regionalData = await db.select()
      .from(regionalMedicalData)
      .where(eq(regionalMedicalData.isVerified, true))
      .limit(5000);
    
    for (const data of regionalData) {
      trainingData.push({
        type: "regional_data",
        content: {
          title: data.title,
          titleAr: data.titleAr,
          content: data.content,
          contentAr: data.contentAr,
          region: data.region,
          dataType: data.dataType,
        },
        metadata: {
          prevalenceRate: data.prevalenceRate,
          incidenceRate: data.incidenceRate,
          dataYear: data.dataYear,
        },
      });
    }
  }
  
  return trainingData;
}

/**
 * Format training data for model training
 */
async function formatTrainingData(rawData: any[]): Promise<any[]> {
  const formattedData: any[] = [];
  
  for (const item of rawData) {
    if (item.type === "medical_article") {
      // Format as Q&A pairs for medical knowledge
      formattedData.push({
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant trained on peer-reviewed medical literature. Provide accurate, evidence-based medical information.",
          },
          {
            role: "user",
            content: `What is known about: ${item.content.title}?`,
          },
          {
            role: "assistant",
            content: item.content.abstract || item.content.fullText?.substring(0, 1000),
          },
        ],
        metadata: item.metadata,
      });
      
      // Add MeSH term queries
      for (const meshTerm of item.content.meshTerms.slice(0, 3)) {
        formattedData.push({
          messages: [
            {
              role: "system",
              content: "You are a medical AI assistant. Explain medical terms clearly.",
            },
            {
              role: "user",
              content: `Explain ${meshTerm} in medical context.`,
            },
            {
              role: "assistant",
              content: `Based on research: ${item.content.abstract?.substring(0, 500)}`,
            },
          ],
        });
      }
    } else if (item.type === "regional_data") {
      // Format regional medical data
      formattedData.push({
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant with expertise in MENA region healthcare. Provide region-specific medical information.",
          },
          {
            role: "user",
            content: `What are the health statistics for ${item.content.title} in ${item.content.region}?`,
          },
          {
            role: "assistant",
            content: `${item.content.content}\n\nArabic: ${item.content.contentAr}`,
          },
        ],
        metadata: item.metadata,
      });
    }
  }
  
  return formattedData;
}

/**
 * Train model (simulated - in production, this would call actual training API)
 */
async function trainModel(
  baseModel: string,
  trainingData: any[],
  totalEpochs: number,
  batchSize: number,
  learningRate: number,
  onStepComplete: (epoch: number, step: number, totalSteps: number, metrics: any) => void
): Promise<any> {
  // Simulate training process
  const totalSteps = Math.ceil(trainingData.length / batchSize);
  const metrics = {
    finalLoss: 0,
    finalAccuracy: 0,
    finalF1Score: 0,
    finalPrecision: 0,
    finalRecall: 0,
  };
  
  for (let epoch = 1; epoch <= totalEpochs; epoch++) {
    for (let step = 1; step <= totalSteps; step++) {
      // Simulate training step
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate computation time
      
      // Calculate simulated metrics (decreasing loss, increasing accuracy)
      const progress = (epoch - 1) / totalEpochs + (step / totalSteps) / totalEpochs;
      const loss = 2.5 * (1 - progress) + 0.1; // Loss decreases from 2.5 to 0.1
      const accuracy = 0.5 + 0.45 * progress; // Accuracy increases from 50% to 95%
      const validationLoss = loss * 1.1;
      const validationAccuracy = accuracy * 0.95;
      const perplexity = Math.exp(loss);
      
      onStepComplete(epoch, step, totalSteps, {
        loss,
        accuracy,
        validationLoss,
        validationAccuracy,
        perplexity,
        stepDuration: 100,
      });
      
      // Update final metrics
      if (epoch === totalEpochs && step === totalSteps) {
        metrics.finalLoss = loss;
        metrics.finalAccuracy = accuracy;
        metrics.finalF1Score = accuracy * 0.98;
        metrics.finalPrecision = accuracy * 0.99;
        metrics.finalRecall = accuracy * 0.97;
      }
    }
  }
  
  return metrics;
}

/**
 * Save trained model version
 */
async function saveModelVersion(
  trainingJobId: number,
  modelName: string,
  baseModel: string,
  metrics: any,
  datasetIds: number[],
  totalTrainingData: number,
  userId: number
): Promise<any> {
  const db = await requireDb();
  const versionNumber = `v${Date.now()}`;
  
  const [modelVersion] = await db.insert(modelVersions).values({
    versionName: modelName,
    versionNumber,
    baseModel,
    modelType: "triage",
    trainingJobId,
    trainedOnDatasets: JSON.stringify(datasetIds),
    totalTrainingData,
    accuracy: metrics.finalAccuracy,
    f1Score: metrics.finalF1Score,
    precision: metrics.finalPrecision,
    recall: metrics.finalRecall,
    regionalAccuracy: JSON.stringify({
      iraq: metrics.finalAccuracy * 0.96,
      mena: metrics.finalAccuracy * 0.94,
      global: metrics.finalAccuracy * 0.92,
    }),
    isDeployed: false,
    isActive: false,
    description: `Model trained on ${totalTrainingData} medical articles and regional data`,
    createdBy: userId,
  });
  
  return { id: modelVersion.insertId, versionNumber };
}

/**
 * Get training job status
 */
export async function getTrainingJobStatus(jobId: number): Promise<any> {
  const db = await requireDb();
  const [job] = await db.select()
    .from(trainingJobs)
    .where(eq(trainingJobs.id, jobId));
  
  if (!job) {
    throw new Error("Training job not found");
  }
  
  // Get recent progress updates
  const recentProgress = await db.select()
    .from(trainingProgress)
    .where(eq(trainingProgress.jobId, jobId))
    .orderBy(desc(trainingProgress.createdAt))
    .limit(10);
  
  return {
    job,
    recentProgress,
  };
}

/**
 * List all training jobs
 */
export async function listTrainingJobs(userId?: number): Promise<any[]> {
  const db = await requireDb();
  let query = db.select().from(trainingJobs);
  
  if (userId) {
    query = query.where(eq(trainingJobs.triggeredBy, userId)) as any;
  }
  
  const jobs = await query.orderBy(desc(trainingJobs.createdAt)).limit(50);
  
  return jobs;
}

/**
 * Get model versions
 */
export async function listModelVersions(): Promise<any[]> {
  const db = await requireDb();
  const versions = await db.select()
    .from(modelVersions)
    .orderBy(desc(modelVersions.createdAt))
    .limit(20);
  
  return versions;
}

/**
 * Deploy model version
 */
export async function deployModelVersion(modelId: number, userId: number): Promise<void> {
  const db = await requireDb();
  // Deactivate all other models
  await db.update(modelVersions)
    .set({ isActive: false });
  
  // Activate selected model
  await db.update(modelVersions)
    .set({
      isActive: true,
      isDeployed: true,
      deployedAt: new Date(),
    })
    .where(eq(modelVersions.id, modelId));
}

/**
 * Cancel training job
 */
export async function cancelTrainingJob(jobId: number): Promise<void> {
  const db = await requireDb();
  await db.update(trainingJobs)
    .set({
      status: "cancelled",
      completedAt: new Date(),
    })
    .where(eq(trainingJobs.id, jobId));
}
