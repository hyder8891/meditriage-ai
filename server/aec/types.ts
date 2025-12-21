/**
 * AEC (Autonomous Error Correction) Type Definitions
 */

export interface DetectedError {
  id: number;
  errorType: string;
  errorMessage: string;
  stackTrace: string | null;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  userId: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface Diagnostic {
  id: number;
  errorId: number;
  rootCause: string;
  impact: string;
  affectedFeatures: string | null;
  proposedSolution: string;
  confidence: string | null;
  codeContext: string | null;
  relatedFiles: string | null;
  analysisModel: string | null;
  analysisDuration: number | null;
  tokensUsed?: number | null;
  modelVersion?: string | null;
  createdAt: Date;
}

export interface Patch {
  id: number;
  errorId: number;
  diagnosticId?: number;
  patchVersion: string;
  branchName: string | null;
  filePath?: string | null;
  filesModified: string | null;
  diffContent: string | null;
  testResults: string | null;
  validationStatus: string | null;
  deployedAt: Date | null;
  deploymentStatus: string | null;
  rollbackAt: Date | null;
  rollbackReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthCheck {
  id: number;
  checkType: string;
  endpoint: string | null;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number | null;
  errorMessage: string | null;
  metadata: string | null;
  createdAt: Date;
}

export interface AECConfig {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: Date;
}

export interface DiagnosticResult {
  errorId: number;
  rootCause: {
    file?: string;
    line?: number;
    function?: string;
    issue: string;
  };
  explanation: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedFeatures: string[];
  fixSteps: string[];
  filesToModify: string[];
  refactoringNeeded: any[];
  testsToAdd: any[];
  diagnosticDuration: number;
  tokensUsed: number;
  modelVersion: string;
}

export interface PatchResult {
  success: boolean;
  patchVersion: string;
  branchName: string;
  filesModified: string[];
  diffContent: string;
  testResults?: string;
  validationStatus: 'pending' | 'passed' | 'failed';
  error?: string;
}

export interface DeploymentResult {
  success: boolean;
  deployedAt: Date;
  deploymentStatus: 'success' | 'failed' | 'rolled_back';
  healthChecksPassed: boolean;
  error?: string;
}
