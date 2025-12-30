/**
 * NCBI E-utilities Integration
 * 
 * Provides access to NCBI databases including:
 * - PubMed (biomedical literature)
 * - PMC (full-text articles)
 * - Gene, Protein, Nuccore
 * - ClinVar (genetic variants)
 * - MedGen, MeSH (medical terminology)
 * 
 * API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 * Rate Limit: 10 requests/second with API key
 */

import { ENV } from "./_core/env.js";

const NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = ENV.ncbiApiKey;

interface ESearchResult {
  count: string;
  retmax: string;
  retstart: string;
  idlist: string[];
  translationset?: any[];
  querytranslation?: string;
}

interface ESearchResponse {
  header: any;
  esearchresult: ESearchResult;
}

interface PubMedArticle {
  uid: string;
  pubdate: string;
  epubdate: string;
  source: string;
  authors: Array<{ name: string; authtype: string }>;
  title: string;
  volume: string;
  issue: string;
  pages: string;
  articleids: Array<{ idtype: string; value: string }>;
  fulljournalname: string;
  sortfirstauthor: string;
  pmcrefcount?: string;
}

interface ESummaryResponse {
  header: any;
  result: {
    uids: string[];
    [uid: string]: PubMedArticle | any;
  };
}

/**
 * Search PubMed for articles
 * @param query - Search query (e.g., "diabetes treatment")
 * @param retmax - Maximum number of results to return (default: 20)
 * @param retstart - Starting position (for pagination, default: 0)
 * @returns Search results with article IDs
 */
export async function searchPubMed(
  query: string,
  retmax: number = 20,
  retstart: number = 0
): Promise<ESearchResult> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: retmax.toString(),
    retstart: retstart.toString(),
    retmode: "json",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/esearch.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  const data: ESearchResponse = await response.json();
  return data.esearchresult;
}

/**
 * Get article summaries from PubMed IDs
 * @param ids - Array of PubMed IDs
 * @returns Article summaries with metadata
 */
export async function getPubMedSummaries(ids: string[]): Promise<PubMedArticle[]> {
  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "json",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/esummary.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  const data: ESummaryResponse = await response.json();
  
  // Extract articles from result object
  const articles: PubMedArticle[] = [];
  for (const uid of data.result.uids) {
    const article = data.result[uid];
    if (article && typeof article === "object") {
      articles.push(article as PubMedArticle);
    }
  }

  return articles;
}

/**
 * Get full article abstract from PubMed
 * @param pmid - PubMed ID
 * @returns Article details in XML format
 */
export async function getPubMedAbstract(pmid: string): Promise<string> {
  const params = new URLSearchParams({
    db: "pubmed",
    id: pmid,
    retmode: "xml",
    rettype: "abstract",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/efetch.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Search PMC (PubMed Central) for full-text articles
 * @param query - Search query
 * @param retmax - Maximum number of results
 * @param retstart - Starting position
 * @returns Search results with PMC IDs
 */
export async function searchPMC(
  query: string,
  retmax: number = 20,
  retstart: number = 0
): Promise<ESearchResult> {
  const params = new URLSearchParams({
    db: "pmc",
    term: query,
    retmax: retmax.toString(),
    retstart: retstart.toString(),
    retmode: "json",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/esearch.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  const data: ESearchResponse = await response.json();
  return data.esearchresult;
}

/**
 * Search MeSH (Medical Subject Headings) for medical terms
 * @param query - Medical term to search
 * @param retmax - Maximum number of results
 * @returns Search results with MeSH term IDs
 */
export async function searchMeSH(
  query: string,
  retmax: number = 20
): Promise<ESearchResult> {
  const params = new URLSearchParams({
    db: "mesh",
    term: query,
    retmax: retmax.toString(),
    retmode: "json",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/esearch.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  const data: ESearchResponse = await response.json();
  return data.esearchresult;
}

/**
 * Search Gene database for genetic information
 * @param query - Gene name or symbol
 * @param retmax - Maximum number of results
 * @returns Search results with Gene IDs
 */
export async function searchGene(
  query: string,
  retmax: number = 20
): Promise<ESearchResult> {
  const params = new URLSearchParams({
    db: "gene",
    term: query,
    retmax: retmax.toString(),
    retmode: "json",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/esearch.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  const data: ESearchResponse = await response.json();
  return data.esearchresult;
}

/**
 * Search ClinVar for genetic variants and clinical significance
 * @param query - Variant or condition query
 * @param retmax - Maximum number of results
 * @returns Search results with ClinVar IDs
 */
export async function searchClinVar(
  query: string,
  retmax: number = 20
): Promise<ESearchResult> {
  const params = new URLSearchParams({
    db: "clinvar",
    term: query,
    retmax: retmax.toString(),
    retmode: "json",
    api_key: API_KEY,
  });

  const response = await fetch(`${NCBI_BASE_URL}/esearch.fcgi?${params}`);
  
  if (!response.ok) {
    throw new Error(`NCBI API error: ${response.statusText}`);
  }

  const data: ESearchResponse = await response.json();
  return data.esearchresult;
}

/**
 * Validate NCBI API key by making a simple test request
 * @returns true if API key is valid
 */
export async function validateNCBIApiKey(): Promise<boolean> {
  try {
    const result = await searchPubMed("test", 1);
    return result.count !== undefined;
  } catch (error) {
    return false;
  }
}
