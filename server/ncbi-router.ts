/**
 * NCBI E-utilities Router
 * Provides tRPC procedures for accessing NCBI medical databases
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc.js";
import { z } from "zod";
import {
  searchPubMed,
  getPubMedSummaries,
  getPubMedAbstract,
  searchPMC,
  searchMeSH,
  searchGene,
  searchClinVar,
} from "./ncbi.js";

export const ncbiRouter = router({
  // Search PubMed for medical literature
  searchPubMed: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        retmax: z.number().min(1).max(100).default(20),
        retstart: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const result = await searchPubMed(input.query, input.retmax, input.retstart);
      
      // Get summaries for the articles
      const summaries = await getPubMedSummaries(result.idlist);
      
      return {
        totalCount: parseInt(result.count),
        articles: summaries,
        hasMore: parseInt(result.retstart) + summaries.length < parseInt(result.count),
      };
    }),

  // Get detailed article information
  getArticleDetails: publicProcedure
    .input(z.object({ pmid: z.string() }))
    .query(async ({ input }) => {
      const [summary] = await getPubMedSummaries([input.pmid]);
      const abstract = await getPubMedAbstract(input.pmid);
      
      return {
        summary,
        abstract,
      };
    }),

  // Search PubMed Central for full-text articles
  searchPMC: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        retmax: z.number().min(1).max(100).default(20),
        retstart: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const result = await searchPMC(input.query, input.retmax, input.retstart);
      
      return {
        totalCount: parseInt(result.count),
        pmcIds: result.idlist,
        hasMore: parseInt(result.retstart) + result.idlist.length < parseInt(result.count),
      };
    }),

  // Search MeSH medical terminology
  searchMeSH: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        retmax: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const result = await searchMeSH(input.query, input.retmax);
      
      return {
        totalCount: parseInt(result.count),
        meshIds: result.idlist,
      };
    }),

  // Search Gene database
  searchGene: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        retmax: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const result = await searchGene(input.query, input.retmax);
      
      return {
        totalCount: parseInt(result.count),
        geneIds: result.idlist,
      };
    }),

  // Search ClinVar for genetic variants
  searchClinVar: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        retmax: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const result = await searchClinVar(input.query, input.retmax);
      
      return {
        totalCount: parseInt(result.count),
        clinvarIds: result.idlist,
      };
    }),
});
