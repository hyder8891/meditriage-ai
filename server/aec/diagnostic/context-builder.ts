/**
 * Codebase Context Builder - Diagnostic Layer
 * Builds comprehensive context for Gemini Pro analysis
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CodebaseContext {
  error: ErrorContext;
  codebase: {
    relevantFiles: FileContent[];
    recentChanges: GitCommit[];
    dependencies: PackageInfo;
    schema: string;
  };
  runtime: {
    logs: string;
    environment: Record<string, string>;
    systemInfo: SystemInfo;
  };
  visual?: {
    screenshot: string;
    expectedUI?: string;
  };
}

export interface ErrorContext {
  id: number;
  severity: string;
  errorType: string;
  source?: string;
  errorMessage: string;
  stackTrace?: string;
  context?: any;
  detectedAt: Date;
}

export interface FileContent {
  path: string;
  content: string;
  relevance: number; // 0-1 score
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  filesChanged: string[];
}

export interface PackageInfo {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  uptime: number;
}

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build comprehensive diagnostic context for an error
 */
export async function buildDiagnosticContext(
  errorContext: ErrorContext
): Promise<CodebaseContext> {
  console.log(`[AEC Context Builder] Building context for error ${errorContext.id}...`);

  const [relevantFiles, recentChanges, dependencies, schema, systemInfo] = await Promise.all([
    getRelevantFiles(errorContext),
    getRecentCommits(10),
    getPackageInfo(),
    getDatabaseSchema(),
    getSystemInfo(),
  ]);

  const context: CodebaseContext = {
    error: errorContext,
    codebase: {
      relevantFiles,
      recentChanges,
      dependencies,
      schema,
    },
    runtime: {
      logs: errorContext.context?.recentLogs || "",
      environment: getFilteredEnvironment(),
      systemInfo,
    },
  };

  // Add screenshot if available
  if (errorContext.context?.screenshotUrl) {
    context.visual = {
      screenshot: errorContext.context.screenshotUrl,
    };
  }

  console.log(`[AEC Context Builder] Context built: ${relevantFiles.length} files, ${recentChanges.length} commits`);

  return context;
}

// ============================================================================
// File Analysis
// ============================================================================

/**
 * Get relevant files based on error context
 */
async function getRelevantFiles(errorContext: ErrorContext): Promise<FileContent[]> {
  const projectRoot = "/home/ubuntu/meditriage-ai";
  const files: FileContent[] = [];

  // Extract file path from stack trace
  const filesFromStack = extractFilesFromStackTrace(errorContext.stackTrace);

  // Add files mentioned in error source
  if (errorContext.source) {
    filesFromStack.push(errorContext.source);
  }

  // Read each file
  for (const filePath of filesFromStack) {
    try {
      const fullPath = path.join(projectRoot, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      
      files.push({
        path: filePath,
        content: content,
        relevance: 1.0, // Files from stack trace are highly relevant
      });
    } catch (error) {
      console.warn(`[AEC Context Builder] Could not read file ${filePath}:`, error);
    }
  }

  // Add related files (same directory, imports, etc.)
  const relatedFiles = await findRelatedFiles(filesFromStack, projectRoot);
  for (const filePath of relatedFiles) {
    try {
      const fullPath = path.join(projectRoot, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      
      files.push({
        path: filePath,
        content: content,
        relevance: 0.5, // Related files are moderately relevant
      });
    } catch (error) {
      // Ignore errors for related files
    }
  }

  return files;
}

/**
 * Extract file paths from stack trace
 */
function extractFilesFromStackTrace(stackTrace?: string): string[] {
  if (!stackTrace) return [];

  const files: string[] = [];
  const lines = stackTrace.split("\n");

  for (const line of lines) {
    // Match patterns like "at /home/ubuntu/meditriage-ai/server/file.ts:123:45"
    const match = line.match(/\/home\/ubuntu\/meditriage-ai\/(.*?):\d+:\d+/);
    if (match) {
      files.push(match[1]);
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

/**
 * Find related files (same directory, imported files, etc.)
 */
async function findRelatedFiles(sourceFiles: string[], projectRoot: string): Promise<string[]> {
  const related: string[] = [];

  for (const file of sourceFiles) {
    const dir = path.dirname(file);
    
    try {
      // Get files in same directory
      const fullDir = path.join(projectRoot, dir);
      const dirFiles = await fs.readdir(fullDir);
      
      for (const dirFile of dirFiles) {
        if (dirFile.endsWith(".ts") || dirFile.endsWith(".tsx")) {
          related.push(path.join(dir, dirFile));
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  return [...new Set(related)].slice(0, 10); // Limit to 10 related files
}

// ============================================================================
// Git History
// ============================================================================

/**
 * Get recent git commits
 */
async function getRecentCommits(count: number): Promise<GitCommit[]> {
  try {
    const { stdout } = await execAsync(
      `cd /home/ubuntu/meditriage-ai && git log -${count} --pretty=format:"%H|%an|%ad|%s" --date=iso --name-only`,
      { maxBuffer: 1024 * 1024 }
    );

    const commits: GitCommit[] = [];
    const commitBlocks = stdout.split("\n\n");

    for (const block of commitBlocks) {
      const lines = block.split("\n");
      if (lines.length === 0) continue;

      const [hash, author, date, message] = lines[0].split("|");
      const filesChanged = lines.slice(1).filter(f => f.trim());

      commits.push({
        hash: hash || "",
        author: author || "",
        date: date || "",
        message: message || "",
        filesChanged,
      });
    }

    return commits;
  } catch (error) {
    console.warn("[AEC Context Builder] Could not get git commits:", error);
    return [];
  }
}

// ============================================================================
// Package Info
// ============================================================================

/**
 * Get package.json information
 */
async function getPackageInfo(): Promise<PackageInfo> {
  try {
    const packageJson = await fs.readFile(
      "/home/ubuntu/meditriage-ai/package.json",
      "utf-8"
    );
    const pkg = JSON.parse(packageJson);

    return {
      name: pkg.name || "meditriage-ai",
      version: pkg.version || "1.0.0",
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
    };
  } catch (error) {
    console.warn("[AEC Context Builder] Could not read package.json:", error);
    return {
      name: "meditriage-ai",
      version: "1.0.0",
      dependencies: {},
      devDependencies: {},
    };
  }
}

// ============================================================================
// Database Schema
// ============================================================================

/**
 * Get database schema
 */
async function getDatabaseSchema(): Promise<string> {
  try {
    const schemaFiles = [
      "/home/ubuntu/meditriage-ai/drizzle/schema.ts",
      "/home/ubuntu/meditriage-ai/drizzle/aec-schema.ts",
    ];

    let schema = "";
    for (const file of schemaFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");
        schema += `\n// ${path.basename(file)}\n${content}\n`;
      } catch (error) {
        // File might not exist
      }
    }

    return schema;
  } catch (error) {
    console.warn("[AEC Context Builder] Could not read schema:", error);
    return "";
  }
}

// ============================================================================
// System Info
// ============================================================================

/**
 * Get system information
 */
function getSystemInfo(): SystemInfo {
  const totalMem = require("os").totalmem();
  const freeMem = require("os").freemem();

  return {
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
    },
    uptime: process.uptime(),
  };
}

/**
 * Get filtered environment variables (exclude secrets)
 */
function getFilteredEnvironment(): Record<string, string> {
  const env: Record<string, string> = {};
  const safeKeys = ["NODE_ENV", "PORT", "DATABASE_URL"];

  for (const key of safeKeys) {
    if (process.env[key]) {
      env[key] = process.env[key]!;
    }
  }

  return env;
}

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Estimate token count for context
 */
export function estimateTokenCount(context: CodebaseContext): number {
  let text = JSON.stringify(context);
  
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Trim context to fit within token limit
 */
export function trimContextToTokenLimit(
  context: CodebaseContext,
  maxTokens: number = 900000 // Leave room for response
): CodebaseContext {
  let currentTokens = estimateTokenCount(context);

  if (currentTokens <= maxTokens) {
    return context;
  }

  console.log(`[AEC Context Builder] Context too large (${currentTokens} tokens), trimming...`);

  // Trim strategy: Keep most relevant files, reduce related files
  const trimmedContext = { ...context };
  
  // Sort files by relevance
  trimmedContext.codebase.relevantFiles.sort((a, b) => b.relevance - a.relevance);
  
  // Keep only high-relevance files
  while (estimateTokenCount(trimmedContext) > maxTokens && trimmedContext.codebase.relevantFiles.length > 1) {
    trimmedContext.codebase.relevantFiles.pop();
  }

  console.log(`[AEC Context Builder] Trimmed to ${estimateTokenCount(trimmedContext)} tokens`);

  return trimmedContext;
}
