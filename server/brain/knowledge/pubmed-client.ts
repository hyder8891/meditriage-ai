/**
 * PubMed E-utilities API Client for BRAIN
 * Provides access to 30+ million medical literature articles from PubMed
 */

import { getDb } from "../../db";
import { brainMedicalLiterature } from "../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// PubMed E-utilities base URL
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// API key should be registered with NCBI (free)
// For now, we'll work without it (3 req/sec limit)
// TODO: Register API key at https://www.ncbi.nlm.nih.gov/account/
const API_KEY = process.env.PUBMED_API_KEY || "";

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  abstract: string;
  doi?: string;
  url: string;
}

interface PubMedSearchResult {
  articles: PubMedArticle[];
  totalCount: number;
}

/**
 * Search PubMed for articles related to a medical condition or topic
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 5
): Promise<PubMedSearchResult> {
  try {
    // Step 1: Search for article IDs using ESearch
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      query
    )}&retmax=${maxResults}&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const idList = searchData.esearchresult?.idlist || [];
    const totalCount = parseInt(searchData.esearchresult?.count || "0");

    if (idList.length === 0) {
      return { articles: [], totalCount: 0 };
    }

    // Step 2: Fetch article summaries using ESummary
    const summaryUrl = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${idList.join(
      ","
    )}&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;

    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();

    // Step 3: Parse and format articles
    const articles: PubMedArticle[] = [];
    for (const pmid of idList) {
      const article = summaryData.result?.[pmid];
      if (!article) continue;

      articles.push({
        pmid,
        title: article.title || "Untitled",
        authors: article.authors?.map((a: any) => a.name) || [],
        journal: article.fulljournalname || article.source || "Unknown Journal",
        pubDate: article.pubdate || "Unknown Date",
        abstract: "", // ESummary doesn't include abstracts
        doi: article.elocationid || undefined,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }

    return { articles, totalCount };
  } catch (error) {
    console.error("PubMed search error:", error);
    return { articles: [], totalCount: 0 };
  }
}

/**
 * Fetch full article details including abstract using EFetch
 */
export async function fetchArticleDetails(pmid: string): Promise<PubMedArticle | null> {
  try {
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${
      API_KEY ? `&api_key=${API_KEY}` : ""
    }`;

    const response = await fetch(fetchUrl);
    const xmlText = await response.text();

    // Parse XML to extract abstract
    // This is a simplified parser - in production, use a proper XML parser
    const titleMatch = xmlText.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
    const abstractMatch = xmlText.match(/<AbstractText.*?>([\s\S]*?)<\/AbstractText>/);
    const journalMatch = xmlText.match(/<Title>([\s\S]*?)<\/Title>/);
    const yearMatch = xmlText.match(/<Year>([\s\S]*?)<\/Year>/);
    const doiMatch = xmlText.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);

    // Extract authors
    const authorRegex = /<Author.*?><LastName>(.*?)<\/LastName><ForeName>(.*?)<\/ForeName>/g;
    const authors: string[] = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(xmlText)) !== null) {
      authors.push(`${authorMatch[2]} ${authorMatch[1]}`);
    }

    return {
      pmid,
      title: titleMatch ? titleMatch[1].trim() : "Untitled",
      authors,
      journal: journalMatch ? journalMatch[1].trim() : "Unknown Journal",
      pubDate: yearMatch ? yearMatch[1].trim() : "Unknown Date",
      abstract: abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, "").trim() : "",
      doi: doiMatch ? doiMatch[1] : undefined,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  } catch (error) {
    console.error("PubMed fetch error:", error);
    return null;
  }
}

/**
 * Search PubMed and cache results in database
 */
export async function searchAndCachePubMed(
  query: string,
  maxResults: number = 5
): Promise<PubMedArticle[]> {
  const db = await getDb();
  if (!db) return [];

  // Check cache first - use hash of query to avoid title length issues
  const queryHash = crypto.createHash('md5').update(`${query}:${maxResults}`).digest('hex');
  const cacheKey = `pubmed:${queryHash}`;
  
  const cached = await db.select({
    literatureData: brainMedicalLiterature.literatureData
  })
  .from(brainMedicalLiterature)
  .where(
    and(
      eq(brainMedicalLiterature.source, 'pubmed'),
      eq(brainMedicalLiterature.title, cacheKey)
    )
  )
  .orderBy(desc(brainMedicalLiterature.createdAt))
  .limit(1);

  if (cached && cached.length > 0 && cached[0].literatureData) {
    try {
      return JSON.parse(cached[0].literatureData);
    } catch {
      // Cache corrupted, continue to fetch
    }
  }

  // Fetch from PubMed
  const result = await searchPubMed(query, maxResults);

  // Cache in database using Drizzle ORM
  if (result.articles.length > 0) {
    await db.insert(brainMedicalLiterature).values({
      source: 'pubmed',
      title: cacheKey,
      authors: result.articles[0].authors.join(", "),
      publicationDate: result.articles[0].pubDate,
      abstract: result.articles[0].abstract,
      url: result.articles[0].url,
      literatureData: JSON.stringify(result.articles),
    });
  }

  return result.articles;
}

/**
 * Format article citation in standard format
 */
export function formatCitation(article: PubMedArticle): string {
  const authors =
    article.authors.length > 0
      ? article.authors.length > 3
        ? `${article.authors[0]} et al.`
        : article.authors.join(", ")
      : "Unknown Authors";

  return `${authors} (${article.pubDate}). ${article.title}. ${article.journal}. ${
    article.doi ? `DOI: ${article.doi}` : `PMID: ${article.pmid}`
  }`;
}

/**
 * Generate search query from medical condition and symptoms
 */
export function generatePubMedQuery(condition: string, symptoms?: string[]): string {
  const terms = [condition];

  if (symptoms && symptoms.length > 0) {
    // Add top 3 symptoms to query
    terms.push(...symptoms.slice(0, 3));
  }

  // Add common medical search terms
  terms.push("diagnosis", "treatment");

  return terms.join(" ");
}
