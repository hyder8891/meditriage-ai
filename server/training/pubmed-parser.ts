/**
 * PubMed XML Parser
 * 
 * Parses PubMed baseline XML files and extracts article metadata
 * 
 * Article structure:
 * - PMID (PubMed ID)
 * - Title
 * - Abstract
 * - Authors
 * - Journal
 * - Publication Date
 * - MeSH Terms (Medical Subject Headings)
 * - Keywords
 */

import * as fs from 'fs';
import * as xml2js from 'xml2js';

export interface PubMedArticle {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  meshTerms: string[];
  keywords: string[];
  doi?: string;
  pmcid?: string;
}

/**
 * Parse a single PubMed XML file
 */
export async function parsePubMedXML(xmlPath: string): Promise<PubMedArticle[]> {
  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  const parser = new xml2js.Parser();
  
  try {
    const result = await parser.parseStringPromise(xmlContent);
    const articles: PubMedArticle[] = [];
    
    const pubmedArticles = result.PubmedArticleSet?.PubmedArticle || [];
    
    for (const article of pubmedArticles) {
      try {
        const parsed = parseArticle(article);
        if (parsed) {
          articles.push(parsed);
        }
      } catch (error) {
        console.error('Error parsing article:', error);
        // Continue with next article
      }
    }
    
    return articles;
  } catch (error) {
    console.error(`Error parsing XML file ${xmlPath}:`, error);
    return [];
  }
}

/**
 * Parse a single article from XML structure
 */
function parseArticle(articleData: any): PubMedArticle | null {
  try {
    const medlineCitation = articleData.MedlineCitation?.[0];
    if (!medlineCitation) return null;
    
    const pmid = medlineCitation.PMID?.[0]?._ || medlineCitation.PMID?.[0] || '';
    const articleNode = medlineCitation.Article?.[0];
    if (!articleNode) return null;
    
    // Extract title
    const title = articleNode.ArticleTitle?.[0] || '';
    
    // Extract abstract
    const abstractNode = articleNode.Abstract?.[0];
    let abstract = '';
    if (abstractNode?.AbstractText) {
      abstract = abstractNode.AbstractText
        .map((text: any) => {
          if (typeof text === 'string') return text;
          if (text._) return text._;
          return '';
        })
        .join(' ');
    }
    
    // Extract authors
    const authorList = articleNode.AuthorList?.[0]?.Author || [];
    const authors = authorList.map((author: any) => {
      const lastName = author.LastName?.[0] || '';
      const foreName = author.ForeName?.[0] || '';
      return `${foreName} ${lastName}`.trim();
    }).filter((name: string) => name.length > 0);
    
    // Extract journal
    const journal = articleNode.Journal?.[0]?.Title?.[0] || '';
    
    // Extract publication date
    const pubDate = articleNode.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0];
    let publicationDate = '';
    if (pubDate) {
      const year = pubDate.Year?.[0] || '';
      const month = pubDate.Month?.[0] || '';
      const day = pubDate.Day?.[0] || '';
      publicationDate = [year, month, day].filter(Boolean).join('-');
    }
    
    // Extract MeSH terms
    const meshHeadingList = medlineCitation.MeshHeadingList?.[0]?.MeshHeading || [];
    const meshTerms = meshHeadingList.map((mesh: any) => {
      return mesh.DescriptorName?.[0]?._ || mesh.DescriptorName?.[0] || '';
    }).filter((term: string) => term.length > 0);
    
    // Extract keywords
    const keywordList = medlineCitation.KeywordList?.[0]?.Keyword || [];
    const keywords = keywordList.map((kw: any) => {
      if (typeof kw === 'string') return kw;
      return kw._ || '';
    }).filter((kw: string) => kw.length > 0);
    
    // Extract DOI and PMCID
    const articleIdList = articleData.PubmedData?.[0]?.ArticleIdList?.[0]?.ArticleId || [];
    let doi: string | undefined;
    let pmcid: string | undefined;
    
    for (const id of articleIdList) {
      const idType = id.$?.IdType;
      const idValue = id._ || id;
      if (idType === 'doi') doi = idValue;
      if (idType === 'pmc') pmcid = idValue;
    }
    
    return {
      pmid,
      title,
      abstract,
      authors,
      journal,
      publicationDate,
      meshTerms,
      keywords,
      doi,
      pmcid,
    };
  } catch (error) {
    console.error('Error parsing article structure:', error);
    return null;
  }
}

/**
 * Parse multiple XML files and combine results
 */
export async function parsePubMedFiles(xmlPaths: string[]): Promise<PubMedArticle[]> {
  const allArticles: PubMedArticle[] = [];
  
  for (let i = 0; i < xmlPaths.length; i++) {
    const xmlPath = xmlPaths[i];
    console.log(`[${i + 1}/${xmlPaths.length}] Parsing: ${xmlPath}`);
    
    try {
      const articles = await parsePubMedXML(xmlPath);
      allArticles.push(...articles);
      console.log(`  ✓ Extracted ${articles.length} articles`);
    } catch (error) {
      console.error(`  ❌ Error parsing ${xmlPath}:`, error);
    }
  }
  
  return allArticles;
}

/**
 * Convert article to training text format
 */
export function articleToTrainingText(article: PubMedArticle): string {
  const sections: string[] = [];
  
  sections.push(`Title: ${article.title}`);
  
  if (article.abstract) {
    sections.push(`Abstract: ${article.abstract}`);
  }
  
  if (article.meshTerms.length > 0) {
    sections.push(`Medical Terms: ${article.meshTerms.join(', ')}`);
  }
  
  if (article.keywords.length > 0) {
    sections.push(`Keywords: ${article.keywords.join(', ')}`);
  }
  
  sections.push(`Journal: ${article.journal}`);
  sections.push(`Published: ${article.publicationDate}`);
  sections.push(`PMID: ${article.pmid}`);
  
  return sections.join('\n\n');
}

// Test parsing if run directly
if (require.main === module) {
  const testFile = process.argv[2];
  
  if (!testFile) {
    console.error('Usage: node pubmed-parser.js <xml-file>');
    process.exit(1);
  }
  
  console.log(`Parsing: ${testFile}\n`);
  
  parsePubMedXML(testFile)
    .then(articles => {
      console.log(`\n✅ Parsed ${articles.length} articles`);
      
      if (articles.length > 0) {
        console.log('\nSample article:');
        console.log('================');
        console.log(articleToTrainingText(articles[0]));
      }
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
