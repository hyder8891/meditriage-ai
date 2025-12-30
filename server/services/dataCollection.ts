/**
 * Massive Data Collection Service
 * Collects medical literature from multiple sources for AI training
 */

import { ENV } from "../_core/env";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { storagePut } from "../storage";

const NCBI_API_KEY = ENV.ncbiApiKey || "";
const NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// Rate limiting: NCBI allows 10 requests/second with API key
const RATE_LIMIT_DELAY = 100; // milliseconds
let lastRequestTime = 0;

async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Fetch data from NCBI E-utilities
 */
async function ncbiRequest(endpoint: string, params: Record<string, string>): Promise<string> {
  await rateLimitedDelay();
  
  const queryParams = new URLSearchParams({
    ...params,
    api_key: NCBI_API_KEY,
  });
  
  const url = `${NCBI_BASE_URL}/${endpoint}?${queryParams.toString()}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Search PubMed for articles
 */
export async function searchPubMed(query: string, maxResults: number = 10000): Promise<string[]> {
  const xml = await ncbiRequest("esearch.fcgi", {
    db: "pubmed",
    term: query,
    retmax: maxResults.toString(),
    retmode: "json",
  });
  
  const data = JSON.parse(xml);
  return data.esearchresult?.idlist || [];
}

/**
 * Fetch article details from PubMed
 */
export async function fetchPubMedArticles(pmids: string[]): Promise<any[]> {
  if (pmids.length === 0) return [];
  
  const xml = await ncbiRequest("efetch.fcgi", {
    db: "pubmed",
    id: pmids.join(","),
    retmode: "xml",
  });
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  
  const result = parser.parse(xml);
  const articles = result.PubmedArticleSet?.PubmedArticle || [];
  
  return Array.isArray(articles) ? articles : [articles];
}

/**
 * Fetch full-text article from PMC
 */
export async function fetchPMCFullText(pmcid: string): Promise<string> {
  const xml = await ncbiRequest("efetch.fcgi", {
    db: "pmc",
    id: pmcid,
    retmode: "xml",
  });
  
  return xml;
}

/**
 * Download PubMed baseline data (massive bulk download)
 */
export async function downloadPubMedBaseline(
  outputDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ filesDownloaded: number; totalSize: number }> {
  // PubMed baseline FTP server
  const FTP_HOST = "ftp.ncbi.nlm.nih.gov";
  const FTP_PATH = "/pubmed/baseline/";
  
  // For now, we'll download via HTTPS mirror
  const HTTPS_BASE = "https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/";
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get list of files (PubMed baseline has ~1200 XML files, ~300GB total)
  // For demonstration, we'll download a subset
  const filesToDownload = [
    "pubmed24n0001.xml.gz",
    "pubmed24n0002.xml.gz",
    "pubmed24n0003.xml.gz",
    // Add more files as needed
  ];
  
  let filesDownloaded = 0;
  let totalSize = 0;
  
  for (const filename of filesToDownload) {
    const url = HTTPS_BASE + filename;
    const outputPath = path.join(outputDir, filename);
    
    // Skip if already downloaded
    if (fs.existsSync(outputPath)) {
      filesDownloaded++;
      totalSize += fs.statSync(outputPath).size;
      if (onProgress) onProgress(filesDownloaded, filesToDownload.length);
      continue;
    }
    
    try {
      const fileSize = await downloadFile(url, outputPath);
      filesDownloaded++;
      totalSize += fileSize;
      
      if (onProgress) onProgress(filesDownloaded, filesToDownload.length);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return { filesDownloaded, totalSize };
}

/**
 * Download a file from URL
 */
async function downloadFile(url: string, outputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on("finish", () => {
        file.close();
        const stats = fs.statSync(outputPath);
        resolve(stats.size);
      });
    }).on("error", (err) => {
      fs.unlinkSync(outputPath);
      reject(err);
    });
  });
}

/**
 * Parse PubMed XML and extract article data
 */
export function parsePubMedArticle(article: any): {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  publicationYear: number;
  meshTerms: string[];
  keywords: string[];
  doi?: string;
} {
  const medlineCitation = article.MedlineCitation || {};
  const articleData = medlineCitation.Article || {};
  const pmid = medlineCitation.PMID?.["#text"] || medlineCitation.PMID || "";
  
  // Extract title
  const title = articleData.ArticleTitle || "";
  
  // Extract abstract
  let abstract = "";
  if (articleData.Abstract?.AbstractText) {
    const abstractText = articleData.Abstract.AbstractText;
    if (Array.isArray(abstractText)) {
      abstract = abstractText.map((a: any) => a["#text"] || a).join(" ");
    } else {
      abstract = abstractText["#text"] || abstractText;
    }
  }
  
  // Extract authors
  const authors: string[] = [];
  if (articleData.AuthorList?.Author) {
    const authorList = Array.isArray(articleData.AuthorList.Author)
      ? articleData.AuthorList.Author
      : [articleData.AuthorList.Author];
    
    for (const author of authorList) {
      const lastName = author.LastName || "";
      const foreName = author.ForeName || "";
      if (lastName || foreName) {
        authors.push(`${foreName} ${lastName}`.trim());
      }
    }
  }
  
  // Extract journal
  const journal = articleData.Journal?.Title || "";
  
  // Extract publication date
  let publicationDate = "";
  let publicationYear = 0;
  if (articleData.Journal?.JournalIssue?.PubDate) {
    const pubDate = articleData.Journal.JournalIssue.PubDate;
    publicationYear = parseInt(pubDate.Year || "0");
    const month = pubDate.Month || "01";
    const day = pubDate.Day || "01";
    publicationDate = `${publicationYear}-${month}-${day}`;
  }
  
  // Extract MeSH terms
  const meshTerms: string[] = [];
  if (medlineCitation.MeshHeadingList?.MeshHeading) {
    const meshList = Array.isArray(medlineCitation.MeshHeadingList.MeshHeading)
      ? medlineCitation.MeshHeadingList.MeshHeading
      : [medlineCitation.MeshHeadingList.MeshHeading];
    
    for (const mesh of meshList) {
      const descriptor = mesh.DescriptorName?.["#text"] || mesh.DescriptorName;
      if (descriptor) meshTerms.push(descriptor);
    }
  }
  
  // Extract keywords
  const keywords: string[] = [];
  if (medlineCitation.KeywordList?.Keyword) {
    const keywordList = Array.isArray(medlineCitation.KeywordList.Keyword)
      ? medlineCitation.KeywordList.Keyword
      : [medlineCitation.KeywordList.Keyword];
    
    for (const keyword of keywordList) {
      const kw = keyword["#text"] || keyword;
      if (kw) keywords.push(kw);
    }
  }
  
  // Extract DOI
  let doi: string | undefined;
  if (Array.isArray(article.PubmedData?.ArticleIdList?.ArticleId)) {
    const doiId = article.PubmedData.ArticleIdList.ArticleId.find(
      (id: any) => id["@_IdType"] === "doi"
    );
    doi = doiId?.["#text"] || doiId;
  }
  
  return {
    pmid,
    title,
    abstract,
    authors,
    journal,
    publicationDate,
    publicationYear,
    meshTerms,
    keywords,
    doi,
  };
}

/**
 * Collect massive dataset for specific medical topics
 */
export async function collectMedicalDataset(
  topics: string[],
  maxArticlesPerTopic: number = 10000,
  onProgress?: (topic: string, current: number, total: number) => void
): Promise<{
  totalArticles: number;
  articlesByTopic: Record<string, number>;
}> {
  const articlesByTopic: Record<string, number> = {};
  let totalArticles = 0;
  
  for (const topic of topics) {
    console.log(`Collecting articles for topic: ${topic}`);
    
    // Search PubMed
    const pmids = await searchPubMed(topic, maxArticlesPerTopic);
    console.log(`Found ${pmids.length} articles for ${topic}`);
    
    // Fetch articles in batches
    const batchSize = 100;
    let processed = 0;
    
    for (let i = 0; i < pmids.length; i += batchSize) {
      const batch = pmids.slice(i, i + batchSize);
      const articles = await fetchPubMedArticles(batch);
      
      processed += articles.length;
      totalArticles += articles.length;
      
      if (onProgress) {
        onProgress(topic, processed, pmids.length);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    articlesByTopic[topic] = pmids.length;
  }
  
  return { totalArticles, articlesByTopic };
}

/**
 * MENA-specific medical topics for data collection
 */
export const MENA_MEDICAL_TOPICS = [
  // High prevalence diseases in MENA
  "diabetes mellitus middle east",
  "cardiovascular disease iraq",
  "hypertension arab countries",
  "obesity mena region",
  "tuberculosis iraq",
  "hepatitis middle east",
  "chronic kidney disease iraq",
  "respiratory diseases middle east",
  
  // Infectious diseases
  "leishmaniasis iraq",
  "brucellosis middle east",
  "cholera iraq",
  "typhoid fever middle east",
  "malaria middle east",
  
  // Environmental health
  "air pollution health iraq",
  "water contamination middle east",
  "heat stress middle east",
  
  // Maternal and child health
  "maternal mortality middle east",
  "child malnutrition iraq",
  "neonatal care middle east",
  
  // Mental health
  "ptsd iraq",
  "depression middle east",
  "anxiety arab countries",
  
  // Genetic disorders
  "thalassemia middle east",
  "sickle cell disease iraq",
  "consanguinity genetic disorders middle east",
];

/**
 * Download and process massive medical literature
 */
export async function downloadMassiveMedicalData(
  outputDir: string,
  options: {
    includePubMedBaseline?: boolean;
    includeRegionalTopics?: boolean;
    maxArticlesPerTopic?: number;
    onProgress?: (stage: string, progress: number, total: number) => void;
  } = {}
): Promise<{
  totalArticles: number;
  totalSize: number;
  datasetStats: any;
}> {
  const {
    includePubMedBaseline = false,
    includeRegionalTopics = true,
    maxArticlesPerTopic = 10000,
    onProgress,
  } = options;
  
  let totalArticles = 0;
  let totalSize = 0;
  const datasetStats: any = {};
  
  // Stage 1: Download PubMed baseline (optional, very large)
  if (includePubMedBaseline) {
    if (onProgress) onProgress("pubmed_baseline", 0, 1);
    
    const baselineDir = path.join(outputDir, "pubmed_baseline");
    const result = await downloadPubMedBaseline(baselineDir, (current, total) => {
      if (onProgress) onProgress("pubmed_baseline", current, total);
    });
    
    totalSize += result.totalSize;
    datasetStats.pubmed_baseline = result;
  }
  
  // Stage 2: Collect regional medical topics
  if (includeRegionalTopics) {
    if (onProgress) onProgress("regional_topics", 0, MENA_MEDICAL_TOPICS.length);
    
    const result = await collectMedicalDataset(
      MENA_MEDICAL_TOPICS,
      maxArticlesPerTopic,
      (topic, current, total) => {
        if (onProgress) {
          const topicIndex = MENA_MEDICAL_TOPICS.indexOf(topic);
          onProgress("regional_topics", topicIndex, MENA_MEDICAL_TOPICS.length);
        }
      }
    );
    
    totalArticles += result.totalArticles;
    datasetStats.regional_topics = result;
  }
  
  return {
    totalArticles,
    totalSize,
    datasetStats,
  };
}
