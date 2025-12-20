/**
 * Patch Applicator - Surgical Layer
 * Applies generated patches with git integration and safety checks
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { GeneratedPatch, FilePatch } from "./patch-generator";

const execAsync = promisify(exec);
const PROJECT_ROOT = "/home/ubuntu/meditriage-ai";

export interface PatchApplicationResult {
  success: boolean;
  branchName?: string;
  filesApplied: string[];
  errors: string[];
  backupPath?: string;
}

// ============================================================================
// Patch Application
// ============================================================================

/**
 * Apply patch to codebase with safety checks
 */
export async function applyPatch(
  patch: GeneratedPatch,
  options: {
    createBranch?: boolean;
    createBackup?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<PatchApplicationResult> {
  console.log(`[AEC Patch Applicator] Applying patch for error ${patch.errorId}...`);

  const result: PatchApplicationResult = {
    success: false,
    filesApplied: [],
    errors: [],
  };

  try {
    // Step 1: Create backup if requested
    if (options.createBackup) {
      const backupPath = await createBackup(patch.filesModified);
      result.backupPath = backupPath;
      console.log(`[AEC Patch Applicator] Backup created at ${backupPath}`);
    }

    // Step 2: Create git branch if requested
    if (options.createBranch) {
      const branchName = await createGitBranch(patch.patchVersion);
      result.branchName = branchName;
      console.log(`[AEC Patch Applicator] Created branch: ${branchName}`);
    }

    // Step 3: Apply file changes
    if (!options.dryRun) {
      for (const file of patch.filesModified) {
        try {
          await applyFilePatch(file);
          result.filesApplied.push(file.filePath);
          console.log(`[AEC Patch Applicator] ✅ Applied patch to ${file.filePath}`);
        } catch (error: any) {
          const errorMsg = `Failed to apply patch to ${file.filePath}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error(`[AEC Patch Applicator] ❌ ${errorMsg}`);
        }
      }
    } else {
      console.log(`[AEC Patch Applicator] Dry run - no files modified`);
      result.filesApplied = patch.filesModified.map(f => f.filePath);
    }

    // Step 4: Git commit if branch was created
    if (options.createBranch && result.branchName && result.filesApplied.length > 0 && !options.dryRun) {
      await gitCommitChanges(patch, result.filesApplied);
      console.log(`[AEC Patch Applicator] Changes committed to ${result.branchName}`);
    }

    result.success = result.errors.length === 0;

    if (result.success) {
      console.log(`[AEC Patch Applicator] ✅ Patch applied successfully`);
    } else {
      console.log(`[AEC Patch Applicator] ⚠️  Patch applied with ${result.errors.length} errors`);
    }

    return result;
  } catch (error: any) {
    console.error(`[AEC Patch Applicator] Fatal error:`, error);
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Apply a single file patch
 */
async function applyFilePatch(filePatch: FilePatch): Promise<void> {
  const fullPath = path.join(PROJECT_ROOT, filePatch.filePath);

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });

  // Write patched content
  await fs.writeFile(fullPath, filePatch.patchedContent, "utf-8");
}

/**
 * Create backup of files before patching
 */
async function createBackup(files: FilePatch[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupDir = path.join(PROJECT_ROOT, ".aec-backups", timestamp);

  await fs.mkdir(backupDir, { recursive: true });

  for (const file of files) {
    const sourcePath = path.join(PROJECT_ROOT, file.filePath);
    const backupPath = path.join(backupDir, file.filePath);
    const backupFileDir = path.dirname(backupPath);

    try {
      // Create backup directory structure
      await fs.mkdir(backupFileDir, { recursive: true });

      // Copy original file
      await fs.copyFile(sourcePath, backupPath);
    } catch (error) {
      // File might not exist (new file)
      console.warn(`[AEC Patch Applicator] Could not backup ${file.filePath}:`, error);
    }
  }

  return backupDir;
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(backupPath: string): Promise<void> {
  console.log(`[AEC Patch Applicator] Restoring from backup: ${backupPath}`);

  // Get all files in backup
  const files = await getAllFiles(backupPath);

  for (const file of files) {
    const relativePath = path.relative(backupPath, file);
    const targetPath = path.join(PROJECT_ROOT, relativePath);

    // Restore file
    await fs.copyFile(file, targetPath);
    console.log(`[AEC Patch Applicator] Restored ${relativePath}`);
  }

  console.log(`[AEC Patch Applicator] ✅ Backup restored`);
}

/**
 * Get all files in directory recursively
 */
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * Create git branch for patch
 */
async function createGitBranch(patchVersion: string): Promise<string> {
  const branchName = `aec/${patchVersion}`;

  try {
    // Create and checkout new branch
    await execAsync(`cd ${PROJECT_ROOT} && git checkout -b ${branchName}`, {
      maxBuffer: 1024 * 1024,
    });

    return branchName;
  } catch (error: any) {
    console.error(`[AEC Patch Applicator] Failed to create branch:`, error);
    throw new Error(`Git branch creation failed: ${error.message}`);
  }
}

/**
 * Commit changes to git
 */
async function gitCommitChanges(patch: GeneratedPatch, filesApplied: string[]): Promise<void> {
  try {
    // Stage files
    const fileList = filesApplied.join(" ");
    await execAsync(`cd ${PROJECT_ROOT} && git add ${fileList}`, {
      maxBuffer: 1024 * 1024,
    });

    // Commit with detailed message
    const commitMessage = `[AEC] Fix error ${patch.errorId}: ${patch.summary}

${patch.reasoning}

Files modified:
${filesApplied.map(f => `- ${f}`).join("\n")}

Diagnostic ID: ${patch.diagnosticId}
Patch Version: ${patch.patchVersion}
Generated by: AEC Surgical Layer`;

    await execAsync(`cd ${PROJECT_ROOT} && git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      maxBuffer: 1024 * 1024,
    });

    console.log(`[AEC Patch Applicator] Git commit created`);
  } catch (error: any) {
    console.error(`[AEC Patch Applicator] Git commit failed:`, error);
    throw new Error(`Git commit failed: ${error.message}`);
  }
}

/**
 * Get current git branch
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync(`cd ${PROJECT_ROOT} && git rev-parse --abbrev-ref HEAD`, {
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim();
  } catch (error) {
    return "unknown";
  }
}

/**
 * Switch to a git branch
 */
export async function switchBranch(branchName: string): Promise<void> {
  try {
    await execAsync(`cd ${PROJECT_ROOT} && git checkout ${branchName}`, {
      maxBuffer: 1024 * 1024,
    });
    console.log(`[AEC Patch Applicator] Switched to branch: ${branchName}`);
  } catch (error: any) {
    throw new Error(`Failed to switch branch: ${error.message}`);
  }
}

/**
 * Delete a git branch
 */
export async function deleteBranch(branchName: string, force: boolean = false): Promise<void> {
  try {
    const flag = force ? "-D" : "-d";
    await execAsync(`cd ${PROJECT_ROOT} && git branch ${flag} ${branchName}`, {
      maxBuffer: 1024 * 1024,
    });
    console.log(`[AEC Patch Applicator] Deleted branch: ${branchName}`);
  } catch (error: any) {
    throw new Error(`Failed to delete branch: ${error.message}`);
  }
}

// ============================================================================
// Safety Checks
// ============================================================================

/**
 * Validate patch before application
 */
export async function validateBeforeApply(patch: GeneratedPatch): Promise<{
  safe: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // Check 1: Ensure files exist or are in valid locations
  for (const file of patch.filesModified) {
    const fullPath = path.join(PROJECT_ROOT, file.filePath);

    // Check if path is within project
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      warnings.push(`File ${file.filePath} is outside project root`);
    }

    // Warn if modifying critical files
    const criticalPaths = [
      "package.json",
      "drizzle.config.ts",
      "tsconfig.json",
      ".env",
    ];

    if (criticalPaths.some(p => file.filePath.includes(p))) {
      warnings.push(`Modifying critical file: ${file.filePath}`);
    }
  }

  // Check 2: Ensure git is clean (no uncommitted changes)
  try {
    const { stdout } = await execAsync(`cd ${PROJECT_ROOT} && git status --porcelain`, {
      maxBuffer: 1024 * 1024,
    });

    if (stdout.trim().length > 0) {
      warnings.push("Git working directory has uncommitted changes");
    }
  } catch (error) {
    warnings.push("Could not check git status");
  }

  // Check 3: Ensure patch content is not suspiciously large
  for (const file of patch.filesModified) {
    if (file.patchedContent.length > 100000) {
      warnings.push(`File ${file.filePath} is very large (${file.patchedContent.length} chars)`);
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
