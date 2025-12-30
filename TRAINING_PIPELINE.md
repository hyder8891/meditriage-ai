# MediTriage AI - Medical Literature Training Pipeline

This document describes the complete pipeline for training the MediTriage AI model on medical literature from PubMed and PMC.

## Overview

The training pipeline consists of three main stages:

1. **Bulk Download** - Download medical literature from NCBI
2. **Data Ingestion** - Parse and process articles
3. **Model Training** - Train the AI model on processed data

## Data Sources

### 1. PubMed Baseline (~35 Million Citations)

**Source**: https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/

**Format**: XML files (gzipped)

**Size**: ~300GB total

**Content**:
- Article titles
- Abstracts
- Authors
- Publication dates
- MeSH terms (Medical Subject Headings)
- Keywords
- Journal information

**Update Frequency**: Annual baseline + daily updates

### 2. PMC Open Access Subset (~3.5 Million Full-Text Articles)

**Source**: https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_bulk/

**Format**: XML/PDF files

**Size**: ~500GB total

**Content**:
- Full-text articles
- Introduction, Methods, Results, Discussion sections
- Figures and tables
- References

**Update Frequency**: Weekly updates

## Pipeline Components

### Stage 1: Bulk Download

#### PubMed Baseline Download

```bash
# Download first 10 baseline files (for testing)
cd /home/ubuntu/meditriage-ai
node dist/server/training/pubmed-download.js --files=10 --start=0

# Download all baseline files (production)
node dist/server/training/pubmed-download.js --files=1200 --start=0
```

**Output**:
- Downloaded files: `data/pubmed/baseline/*.xml.gz`
- Extracted files: `data/pubmed/extracted/*.xml`

#### PMC Open Access Download

```bash
# Download PMC articles (to be implemented)
node dist/server/training/pmc-download.js
```

**Output**:
- Downloaded files: `data/pmc/articles/*.tar.gz`
- Extracted files: `data/pmc/extracted/*.xml`

### Stage 2: Data Ingestion

#### Parse PubMed XML Files

```bash
# Parse a single file (testing)
node dist/server/training/pubmed-parser.js data/pubmed/extracted/pubmed24n0001.xml

# Parse all extracted files
node dist/server/training/pubmed-ingest.js
```

**Processing Steps**:
1. Parse XML structure
2. Extract article metadata
3. Clean and normalize text
4. Extract medical entities
5. Store in database

**Database Schema**:
```sql
CREATE TABLE medical_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pmid VARCHAR(20) UNIQUE,
  title TEXT,
  abstract TEXT,
  authors JSON,
  journal VARCHAR(255),
  publication_date DATE,
  mesh_terms JSON,
  keywords JSON,
  doi VARCHAR(100),
  pmcid VARCHAR(20),
  full_text LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pmid ON medical_articles(pmid);
CREATE INDEX idx_publication_date ON medical_articles(publication_date);
CREATE FULLTEXT INDEX idx_title_abstract ON medical_articles(title, abstract);
```

### Stage 3: Model Training

#### Training Approaches

**Option 1: RAG (Retrieval-Augmented Generation)**
- Store articles in vector database
- Use embeddings for semantic search
- Retrieve relevant articles during inference
- No model fine-tuning required
- **Recommended for quick deployment**

**Option 2: Fine-Tuning**
- Create training dataset from articles
- Fine-tune LLM on medical literature
- Requires significant compute resources
- **Recommended for specialized medical AI**

**Option 3: Hybrid Approach**
- Fine-tune on curated medical knowledge
- Use RAG for up-to-date literature
- **Recommended for production system**

#### RAG Implementation

```typescript
// 1. Generate embeddings for articles
import { generateEmbedding } from './embeddings';

for (const article of articles) {
  const embedding = await generateEmbedding(
    `${article.title}\n\n${article.abstract}`
  );
  
  await storeEmbedding(article.pmid, embedding);
}

// 2. Semantic search during inference
const queryEmbedding = await generateEmbedding(userQuery);
const relevantArticles = await searchSimilarArticles(queryEmbedding, topK=5);

// 3. Augment LLM prompt with retrieved articles
const context = relevantArticles.map(a => 
  `${a.title}\n${a.abstract}`
).join('\n\n---\n\n');

const response = await invokeLLM({
  messages: [
    {
      role: 'system',
      content: `You are a medical AI assistant. Use the following medical literature as context:\n\n${context}`
    },
    {
      role: 'user',
      content: userQuery
    }
  ]
});
```

## Usage Instructions

### Quick Start (Testing with 10 Files)

```bash
# 1. Build the project
cd /home/ubuntu/meditriage-ai
pnpm build

# 2. Download sample baseline files
node dist/server/training/pubmed-download.js --files=10

# 3. Parse downloaded files
node dist/server/training/pubmed-parser.js data/pubmed/extracted/pubmed24n0001.xml

# 4. Ingest into database (to be implemented)
# node dist/server/training/pubmed-ingest.js

# 5. Train model (to be implemented)
# node dist/server/training/train-model.js
```

### Production Deployment

```bash
# 1. Download all baseline files (~300GB, takes several hours)
node dist/server/training/pubmed-download.js --files=1200

# 2. Download PMC articles (~500GB)
node dist/server/training/pmc-download.js

# 3. Ingest all articles into database
node dist/server/training/ingest-all.js

# 4. Generate embeddings for RAG
node dist/server/training/generate-embeddings.js

# 5. Set up automated updates
# Add to crontab for weekly updates
0 2 * * 0 cd /home/ubuntu/meditriage-ai && node dist/server/training/update-articles.js
```

## Automated Updates

### Daily PubMed Updates

NCBI provides daily update files for new articles:

**Source**: https://ftp.ncbi.nlm.nih.gov/pubmed/updatefiles/

```bash
# Download and process daily updates
node dist/server/training/pubmed-daily-update.js
```

### Weekly PMC Updates

```bash
# Download new PMC articles
node dist/server/training/pmc-weekly-update.js
```

## Storage Requirements

| Component | Size | Notes |
|-----------|------|-------|
| PubMed Baseline (compressed) | ~300GB | .xml.gz files |
| PubMed Baseline (extracted) | ~1TB | .xml files |
| PMC Open Access (compressed) | ~500GB | .tar.gz files |
| PMC Full-Text (extracted) | ~2TB | .xml/.pdf files |
| Database (articles) | ~500GB | Indexed text |
| Vector Embeddings | ~100GB | For RAG |
| **Total** | **~4TB** | **Full pipeline** |

**Recommendations**:
- Use SSD for database and embeddings (fast access)
- Use HDD for archived XML files (infrequent access)
- Consider cloud storage (S3) for raw files
- Implement data retention policy (e.g., keep last 10 years)

## Performance Metrics

### Download Speed
- **PubMed**: ~50-100 MB/s from NCBI FTP
- **Total time**: 1-2 hours for baseline
- **Parallel downloads**: 5-10 concurrent connections

### Parsing Speed
- **PubMed XML**: ~1000-5000 articles/second
- **Total time**: 2-4 hours for 35M articles
- **Memory usage**: ~2GB per process

### Training Time
- **Embedding generation**: ~10,000 articles/hour
- **Fine-tuning**: 1-7 days (depends on model size)
- **RAG setup**: 1-2 days for full index

## Monitoring & Maintenance

### Health Checks
- Monitor download progress
- Track parsing errors
- Verify database integrity
- Check embedding quality

### Error Handling
- Retry failed downloads (max 3 attempts)
- Log parsing errors for review
- Skip corrupted files
- Alert on critical failures

### Backup Strategy
- Daily database backups
- Weekly full system backup
- Retain last 30 days of backups
- Test restore procedures monthly

## Next Steps

1. ✅ **Implemented**: PubMed baseline downloader
2. ✅ **Implemented**: PubMed XML parser
3. 🔄 **In Progress**: Database ingestion
4. ⏳ **Pending**: PMC downloader
5. ⏳ **Pending**: Embedding generation
6. ⏳ **Pending**: RAG implementation
7. ⏳ **Pending**: Model fine-tuning
8. ⏳ **Pending**: Automated updates

## Support & Resources

- **NCBI E-utilities**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **PubMed FTP**: https://ftp.ncbi.nlm.nih.gov/pubmed/
- **PMC FTP**: https://ftp.ncbi.nlm.nih.gov/pub/pmc/
- **NCBI Help**: eutilities@ncbi.nlm.nih.gov

## License & Compliance

- PubMed data is **public domain** (U.S. government work)
- PMC Open Access articles have **various licenses** (check individual articles)
- Respect copyright for non-OA articles
- Attribute sources in AI responses
- Comply with NCBI usage policies

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Development
