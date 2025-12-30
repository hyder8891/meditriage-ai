/**
 * PubMed Baseline Bulk Download Script
 * 
 * Downloads PubMed baseline files from NCBI FTP server
 * Baseline contains ~35 million citations
 * 
 * FTP: ftp://ftp.ncbi.nlm.nih.gov/pubmed/baseline/
 * Format: XML files (gzipped)
 * Size: ~300GB total
 * 
 * Usage:
 *   node dist/server/training/pubmed-download.js [--files=10] [--start=0]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';

const PUBMED_FTP_BASE = 'https://ftp.ncbi.nlm.nih.gov/pubmed/baseline/';
const DOWNLOAD_DIR = path.join(process.cwd(), 'data', 'pubmed', 'baseline');
const EXTRACTED_DIR = path.join(process.cwd(), 'data', 'pubmed', 'extracted');

// Ensure directories exist
function ensureDirectories() {
  [DOWNLOAD_DIR, EXTRACTED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Get list of available baseline files
 */
async function getBaselineFileList(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    https.get(PUBMED_FTP_BASE, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Parse HTML to extract .xml.gz file names
        const fileRegex = /pubmed\d+n\d+\.xml\.gz/g;
        const files = data.match(fileRegex) || [];
        const uniqueFiles = Array.from(new Set(files)).sort();
        resolve(uniqueFiles);
      });
    }).on('error', reject);
  });
}

/**
 * Download a single baseline file
 */
async function downloadFile(filename: string): Promise<string> {
  const url = PUBMED_FTP_BASE + filename;
  const outputPath = path.join(DOWNLOAD_DIR, filename);
  
  // Skip if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`✓ Already downloaded: ${filename}`);
    return outputPath;
  }
  
  console.log(`⬇ Downloading: ${filename}`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      let downloaded = 0;
      const totalSize = parseInt(response.headers['content-length'] || '0');
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(1)}MB)`);
      });
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`\n✓ Downloaded: ${filename}`);
        resolve(outputPath);
      });
      
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extract gzipped XML file
 */
async function extractFile(gzipPath: string): Promise<string> {
  const xmlFilename = path.basename(gzipPath, '.gz');
  const outputPath = path.join(EXTRACTED_DIR, xmlFilename);
  
  // Skip if already extracted
  if (fs.existsSync(outputPath)) {
    console.log(`✓ Already extracted: ${xmlFilename}`);
    return outputPath;
  }
  
  console.log(`📦 Extracting: ${xmlFilename}`);
  
  const source = fs.createReadStream(gzipPath);
  const destination = fs.createWriteStream(outputPath);
  const gunzip = zlib.createGunzip();
  
  await pipeline(source, gunzip, destination);
  
  console.log(`✓ Extracted: ${xmlFilename}`);
  return outputPath;
}

/**
 * Download and extract multiple baseline files
 */
async function downloadBaseline(options: {
  maxFiles?: number;
  startIndex?: number;
} = {}) {
  const { maxFiles = 10, startIndex = 0 } = options;
  
  console.log('🔍 Fetching baseline file list...');
  const files = await getBaselineFileList();
  console.log(`📋 Found ${files.length} baseline files`);
  
  const filesToDownload = files.slice(startIndex, startIndex + maxFiles);
  console.log(`⬇ Downloading ${filesToDownload.length} files (starting from index ${startIndex})`);
  
  for (let i = 0; i < filesToDownload.length; i++) {
    const filename = filesToDownload[i];
    console.log(`\n[${i + 1}/${filesToDownload.length}] Processing: ${filename}`);
    
    try {
      const gzipPath = await downloadFile(filename);
      await extractFile(gzipPath);
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
      // Continue with next file
    }
  }
  
  console.log('\n✅ Baseline download complete!');
  console.log(`📁 Downloaded files: ${DOWNLOAD_DIR}`);
  console.log(`📁 Extracted files: ${EXTRACTED_DIR}`);
}

/**
 * Get download statistics
 */
function getDownloadStats() {
  const downloadedFiles = fs.existsSync(DOWNLOAD_DIR) 
    ? fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.gz'))
    : [];
  
  const extractedFiles = fs.existsSync(EXTRACTED_DIR)
    ? fs.readdirSync(EXTRACTED_DIR).filter(f => f.endsWith('.xml'))
    : [];
  
  let totalSize = 0;
  downloadedFiles.forEach(file => {
    const stats = fs.statSync(path.join(DOWNLOAD_DIR, file));
    totalSize += stats.size;
  });
  
  return {
    downloaded: downloadedFiles.length,
    extracted: extractedFiles.length,
    totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
  };
}

// Main execution
if (require.main === module) {
  ensureDirectories();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const maxFiles = parseInt(args.find(a => a.startsWith('--files='))?.split('=')[1] || '10');
  const startIndex = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '0');
  
  console.log('🏥 PubMed Baseline Downloader');
  console.log('================================\n');
  
  // Show current stats
  const stats = getDownloadStats();
  console.log('📊 Current Status:');
  console.log(`   Downloaded: ${stats.downloaded} files (${stats.totalSizeGB} GB)`);
  console.log(`   Extracted: ${stats.extracted} files\n`);
  
  downloadBaseline({ maxFiles, startIndex })
    .then(() => {
      const finalStats = getDownloadStats();
      console.log('\n📊 Final Status:');
      console.log(`   Downloaded: ${finalStats.downloaded} files (${finalStats.totalSizeGB} GB)`);
      console.log(`   Extracted: ${finalStats.extracted} files`);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { downloadBaseline, getBaselineFileList, downloadFile, extractFile, getDownloadStats };
