/**
 * AI Training Router
 * tRPC procedures for managing AI model training, data collection, and model versioning
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  startTrainingJob,
  getTrainingJobStatus,
  listTrainingJobs,
  listModelVersions,
  deployModelVersion,
  cancelTrainingJob,
  type TrainingConfig,
} from "./services/trainingOrchestrator";
import {
  searchPubMed,
  fetchPubMedArticles,
  parsePubMedArticle,
  collectMedicalDataset,
  downloadMassiveMedicalData,
  MENA_MEDICAL_TOPICS,
} from "./services/dataCollection";
import { getDb } from "./db";
import { trainingDatasets, medicalArticles, regionalMedicalData, trainingJobs as trainingJobsTable } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const aiTrainingRouter = router({
  /**
   * Start a new training job
   */
  startTraining: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
        jobType: z.enum(["full_training", "incremental", "fine_tuning", "evaluation"]),
        baseModel: z.string().default("gpt-4"),
        datasetIds: z.array(z.number()).default([]),
        totalEpochs: z.number().default(3),
        batchSize: z.number().default(32),
        learningRate: z.number().default(0.001),
        includeRegionalData: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const config: TrainingConfig = {
        jobName: input.jobName,
        jobType: input.jobType,
        baseModel: input.baseModel,
        datasetIds: input.datasetIds,
        totalEpochs: input.totalEpochs,
        batchSize: input.batchSize,
        learningRate: input.learningRate,
        includeRegionalData: input.includeRegionalData,
      };

      const result = await startTrainingJob(config, ctx.user.id);
      return result;
    }),

  /**
   * Get training job status and progress
   */
  getTrainingStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      return await getTrainingJobStatus(input.jobId);
    }),

  /**
   * List all training jobs
   */
  listTrainingJobs: protectedProcedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const userId = input?.userId || ctx.user.id;
      return await listTrainingJobs(userId);
    }),

  /**
   * List all model versions
   */
  listModelVersions: protectedProcedure.query(async () => {
    return await listModelVersions();
  }),

  /**
   * Deploy a model version
   */
  deployModel: protectedProcedure
    .input(z.object({ modelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deployModelVersion(input.modelId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Cancel a training job
   */
  cancelTraining: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      await cancelTrainingJob(input.jobId);
      return { success: true };
    }),

  /**
   * Search PubMed for articles
   */
  searchPubMed: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        maxResults: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const pmids = await searchPubMed(input.query, input.maxResults);
      return { pmids, count: pmids.length };
    }),

  /**
   * Fetch and parse PubMed articles
   */
  fetchArticles: protectedProcedure
    .input(
      z.object({
        pmids: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      const articles = await fetchPubMedArticles(input.pmids);
      const parsed = articles.map(parsePubMedArticle);
      return { articles: parsed };
    }),

  /**
   * Collect medical dataset for specific topics
   */
  collectDataset: protectedProcedure
    .input(
      z.object({
        topics: z.array(z.string()),
        maxArticlesPerTopic: z.number().default(1000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await collectMedicalDataset(
        input.topics,
        input.maxArticlesPerTopic
      );
      return result;
    }),

  /**
   * Download massive medical data
   */
  downloadMassiveData: protectedProcedure
    .input(
      z.object({
        includePubMedBaseline: z.boolean().default(false),
        includeRegionalTopics: z.boolean().default(true),
        maxArticlesPerTopic: z.number().default(10000),
      })
    )
    .mutation(async ({ input }) => {
      const outputDir = "/tmp/medical_data";
      const result = await downloadMassiveMedicalData(outputDir, {
        includePubMedBaseline: input.includePubMedBaseline,
        includeRegionalTopics: input.includeRegionalTopics,
        maxArticlesPerTopic: input.maxArticlesPerTopic,
      });
      return result;
    }),

  /**
   * Get MENA-specific medical topics
   */
  getMenaTopics: publicProcedure.query(() => {
    return { topics: MENA_MEDICAL_TOPICS };
  }),

  /**
   * Get training dataset statistics
   */
  getDatasetStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const datasets = await db.select().from(trainingDatasets).limit(100);

    const totalDatasets = datasets.length;
    const readyDatasets = datasets.filter((d) => d.status === "ready").length;
    const totalRecords = datasets.reduce((sum, d) => sum + (d.totalRecords || 0), 0);
    const processedRecords = datasets.reduce((sum, d) => sum + (d.processedRecords || 0), 0);

    return {
      totalDatasets,
      readyDatasets,
      totalRecords,
      processedRecords,
      datasets,
    };
  }),

  /**
   * Get medical articles count and statistics
   */
  getArticleStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const articles = await db
      .select()
      .from(medicalArticles)
      .limit(10000);

    const totalArticles = articles.length;
    const processedArticles = articles.filter(
      (a) => a.processingStatus === "processed"
    ).length;
    const regionalArticles = articles.filter(
      (a) => a.isRegionallyRelevant
    ).length;

    return {
      totalArticles,
      processedArticles,
      regionalArticles,
      articles: articles.slice(0, 100), // Return first 100 for display
    };
  }),

  /**
   * Get regional medical data statistics
   */
  getRegionalDataStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const regionalData = await db
      .select()
      .from(regionalMedicalData)
      .limit(1000);

    const totalRecords = regionalData.length;
    const verifiedRecords = regionalData.filter((d) => d.isVerified).length;
    const byRegion = regionalData.reduce((acc, d) => {
      acc[d.region] = (acc[d.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRecords,
      verifiedRecords,
      byRegion,
      data: regionalData.slice(0, 50),
    };
  }),

  /**
   * Get training dashboard overview
   */
  getDashboardOverview: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get training jobs summary
    const jobs = await db
      .select()
      .from(trainingJobsTable)
      .orderBy(desc(trainingJobsTable.createdAt))
      .limit(10);

    const totalJobs = jobs.length;
    const runningJobs = jobs.filter((j) => j.status === "running").length;
    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const failedJobs = jobs.filter((j) => j.status === "failed").length;

    // Get datasets summary
    const datasets = await db.select().from(trainingDatasets).limit(100);
    const totalDatasets = datasets.length;
    const readyDatasets = datasets.filter((d) => d.status === "ready").length;

    // Get articles summary
    const articles = await db.select().from(medicalArticles).limit(10000);
    const totalArticles = articles.length;
    const processedArticles = articles.filter(
      (a) => a.processingStatus === "processed"
    ).length;

    // Get regional data summary
    const regionalData = await db.select().from(regionalMedicalData).limit(1000);
    const totalRegionalData = regionalData.length;
    const verifiedRegionalData = regionalData.filter((d) => d.isVerified).length;

    return {
      trainingJobs: {
        total: totalJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
        recentJobs: jobs,
      },
      datasets: {
        total: totalDatasets,
        ready: readyDatasets,
      },
      articles: {
        total: totalArticles,
        processed: processedArticles,
      },
      regionalData: {
        total: totalRegionalData,
        verified: verifiedRegionalData,
      },
    };
  }),

  /**
   * Create a new training dataset
   */
  createDataset: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        dataSource: z.string(),
        region: z.string().optional(),
        isRegionalData: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [dataset] = await db.insert(trainingDatasets).values({
        name: input.name,
        description: input.description,
        dataSource: input.dataSource,
        region: input.region,
        isRegionalData: input.isRegionalData,
        status: "pending",
        totalRecords: 0,
        processedRecords: 0,
        validRecords: 0,
        qualityScore: 0,
        completeness: 0,
      });

      return { datasetId: dataset.insertId };
    }),
});
