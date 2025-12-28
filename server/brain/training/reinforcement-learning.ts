/**
 * Reinforcement Learning Module
 * Implements reward-based learning from patient outcomes
 */

import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../../_core/db-config';

const dbConfig = getDatabaseConfig();
const rlPool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 50,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  maxIdle: 5,
  idleTimeout: 60000,
});

export interface PatientOutcome {
  diagnosisCorrect: boolean;
  timeToResolution: number; // in hours
  patientSatisfaction: number; // 1-5 scale
  treatmentEffective: boolean;
  adverseEvents: boolean;
  readmissionWithin30Days: boolean;
}

export interface Diagnosis {
  condition: string;
  confidence: number;
  urgencyLevel: string;
  recommendedTests: string[];
  recommendedTreatments: string[];
}

export interface PatientState {
  symptoms: string[];
  vitalSigns: Record<string, number>;
  medicalHistory: string[];
  age: number;
  riskFactors: string[];
}

export interface StateAction {
  state: string; // Serialized patient state
  action: string; // Diagnosis or treatment
}

/**
 * Calculate reward from patient outcome
 */
export class RewardFunction {
  /**
   * Calculate comprehensive reward score
   * Range: -1.0 (worst) to +1.0 (best)
   */
  static calculateReward(
    prediction: Diagnosis,
    actualOutcome: PatientOutcome
  ): number {
    let reward = 0;

    // Diagnosis correctness (most important): +0.4 or -0.4
    if (actualOutcome.diagnosisCorrect) {
      reward += 0.4;
    } else {
      reward -= 0.4;
    }

    // Time to resolution (faster is better): +0.2 to -0.2
    const timeScore = this.calculateTimeScore(actualOutcome.timeToResolution);
    reward += timeScore * 0.2;

    // Patient satisfaction: +0.2 to -0.2
    const satisfactionScore = (actualOutcome.patientSatisfaction - 3) / 2; // Normalize to -1 to +1
    reward += satisfactionScore * 0.2;

    // Treatment effectiveness: +0.1 or -0.1
    if (actualOutcome.treatmentEffective) {
      reward += 0.1;
    } else {
      reward -= 0.1;
    }

    // Adverse events (penalty): -0.2
    if (actualOutcome.adverseEvents) {
      reward -= 0.2;
    }

    // Readmission (penalty): -0.1
    if (actualOutcome.readmissionWithin30Days) {
      reward -= 0.1;
    }

    // Confidence calibration bonus/penalty: +0.1 to -0.1
    const confidenceScore = this.calculateConfidenceScore(
      prediction.confidence,
      actualOutcome.diagnosisCorrect
    );
    reward += confidenceScore * 0.1;

    // Clamp reward to [-1, 1]
    return Math.max(-1, Math.min(1, reward));
  }

  /**
   * Calculate time score (faster resolution is better)
   */
  private static calculateTimeScore(timeToResolutionHours: number): number {
    // Excellent: < 24 hours = +1
    // Good: 24-48 hours = +0.5
    // Acceptable: 48-72 hours = 0
    // Slow: 72-168 hours = -0.5
    // Very slow: > 168 hours = -1

    if (timeToResolutionHours < 24) return 1;
    if (timeToResolutionHours < 48) return 0.5;
    if (timeToResolutionHours < 72) return 0;
    if (timeToResolutionHours < 168) return -0.5;
    return -1;
  }

  /**
   * Calculate confidence calibration score
   */
  private static calculateConfidenceScore(
    confidence: number,
    correct: boolean
  ): number {
    // Reward well-calibrated confidence
    // High confidence + correct = +1
    // Low confidence + incorrect = +1
    // High confidence + incorrect = -1
    // Low confidence + correct = -1

    if (correct) {
      return confidence * 2 - 1; // Maps [0,1] to [-1,1]
    } else {
      return 1 - confidence * 2; // Maps [0,1] to [1,-1]
    }
  }
}

/**
 * Q-Learning implementation for medical decision making
 */
export class QLearner {
  private qTable: Map<string, number> = new Map();
  private learningRate = 0.1;
  private discountFactor = 0.9;
  private epsilon = 0.1; // Exploration rate

  /**
   * Get Q-value for state-action pair
   */
  getQValue(state: PatientState, action: string): number {
    const key = this.serializeStateAction(state, action);
    return this.qTable.get(key) || 0;
  }

  /**
   * Update Q-value based on reward
   */
  async learn(
    state: PatientState,
    action: string,
    reward: number,
    nextState: PatientState
  ): Promise<void> {
    const key = this.serializeStateAction(state, action);
    const currentQ = this.qTable.get(key) || 0;
    const maxNextQ = this.getMaxQ(nextState);

    // Q-learning update rule
    const newQ =
      currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);

    this.qTable.set(key, newQ);

    // Persist to database
    await this.persistQValue(key, newQ);
  }

  /**
   * Get maximum Q-value for next state
   */
  private getMaxQ(state: PatientState): number {
    // Get all possible actions for this state
    const possibleActions = this.getPossibleActions(state);

    let maxQ = -Infinity;
    for (const action of possibleActions) {
      const q = this.getQValue(state, action);
      if (q > maxQ) {
        maxQ = q;
      }
    }

    return maxQ === -Infinity ? 0 : maxQ;
  }

  /**
   * Select action using epsilon-greedy policy
   */
  selectAction(state: PatientState): string {
    const possibleActions = this.getPossibleActions(state);

    // Exploration: random action
    if (Math.random() < this.epsilon) {
      return possibleActions[Math.floor(Math.random() * possibleActions.length)];
    }

    // Exploitation: best action
    let bestAction = possibleActions[0];
    let bestQ = this.getQValue(state, bestAction);

    for (const action of possibleActions) {
      const q = this.getQValue(state, action);
      if (q > bestQ) {
        bestQ = q;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Get possible actions (diagnoses) for a state
   */
  private getPossibleActions(state: PatientState): string[] {
    // In practice, this would be a comprehensive list of possible diagnoses
    // For now, return common conditions
    return [
      'acute_myocardial_infarction',
      'pneumonia',
      'appendicitis',
      'gastroenteritis',
      'urinary_tract_infection',
      'migraine',
      'anxiety_disorder',
      'hypertension',
      'diabetes',
      'asthma',
    ];
  }

  /**
   * Serialize state-action pair to string key
   */
  private serializeStateAction(state: PatientState, action: string): string {
    // Create a compact representation
    const stateHash = JSON.stringify({
      symptoms: state.symptoms.sort(),
      age: Math.floor(state.age / 10) * 10, // Bin by decade
      riskFactors: state.riskFactors.sort(),
    });

    return `${stateHash}|${action}`;
  }

  /**
   * Persist Q-value to database
   */
  private async persistQValue(key: string, value: number): Promise<void> {
    try {
      const conn = await rlPool.getConnection();
      try {
        await conn.query(
          `INSERT INTO rl_q_table (state_action_key, q_value, updated_at)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE q_value = ?, updated_at = NOW()`,
          [key, value, value]
        );
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('[QLearner] Failed to persist Q-value:', error);
    }
  }

  /**
   * Load Q-table from database
   */
  async loadQTable(): Promise<void> {
    try {
      const conn = await rlPool.getConnection();
      try {
        const [rows] = await conn.query(
          `SELECT state_action_key, q_value FROM rl_q_table`
        );

        for (const row of rows as any[]) {
          this.qTable.set(row.state_action_key, row.q_value);
        }

        console.log(`[QLearner] Loaded ${this.qTable.size} Q-values from database`);
      } finally {
        conn.release();
      }
    } catch (error) {
      console.warn('[QLearner] Failed to load Q-table:', error);
    }
  }

  /**
   * Get Q-table statistics
   */
  getStats() {
    const values = Array.from(this.qTable.values());
    const avgQ = values.reduce((sum, v) => sum + v, 0) / values.length;
    const maxQ = Math.max(...values);
    const minQ = Math.min(...values);

    return {
      size: this.qTable.size,
      avgQ: avgQ.toFixed(4),
      maxQ: maxQ.toFixed(4),
      minQ: minQ.toFixed(4),
      learningRate: this.learningRate,
      discountFactor: this.discountFactor,
      epsilon: this.epsilon,
    };
  }
}

/**
 * Multi-Armed Bandit for treatment selection
 * Uses Thompson Sampling for exploration-exploitation balance
 */
export class ThompsonSampling {
  private arms: Map<string, { successes: number; failures: number }> = new Map();

  /**
   * Select treatment using Thompson Sampling
   */
  selectTreatment(condition: string, availableTreatments: string[]): string {
    let bestTreatment = availableTreatments[0];
    let bestSample = -Infinity;

    for (const treatment of availableTreatments) {
      const key = `${condition}|${treatment}`;
      const arm = this.arms.get(key) || { successes: 1, failures: 1 }; // Prior

      // Sample from Beta distribution
      const sample = this.sampleBeta(arm.successes, arm.failures);

      if (sample > bestSample) {
        bestSample = sample;
        bestTreatment = treatment;
      }
    }

    return bestTreatment;
  }

  /**
   * Update arm based on treatment outcome
   */
  async updateArm(
    condition: string,
    treatment: string,
    success: boolean
  ): Promise<void> {
    const key = `${condition}|${treatment}`;
    const arm = this.arms.get(key) || { successes: 1, failures: 1 };

    if (success) {
      arm.successes++;
    } else {
      arm.failures++;
    }

    this.arms.set(key, arm);

    // Persist to database
    await this.persistArm(key, arm);
  }

  /**
   * Sample from Beta distribution (simplified)
   */
  private sampleBeta(alpha: number, beta: number): number {
    // Simplified Beta sampling using mean + random noise
    // For production, use a proper Beta distribution library
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const noise = (Math.random() - 0.5) * Math.sqrt(variance) * 4;

    return Math.max(0, Math.min(1, mean + noise));
  }

  /**
   * Persist arm to database
   */
  private async persistArm(
    key: string,
    arm: { successes: number; failures: number }
  ): Promise<void> {
    try {
      const conn = await rlPool.getConnection();
      try {
        await conn.query(
          `INSERT INTO rl_bandit_arms (condition_treatment_key, successes, failures, updated_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE successes = ?, failures = ?, updated_at = NOW()`,
          [key, arm.successes, arm.failures, arm.successes, arm.failures]
        );
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('[ThompsonSampling] Failed to persist arm:', error);
    }
  }

  /**
   * Load arms from database
   */
  async loadArms(): Promise<void> {
    try {
      const conn = await rlPool.getConnection();
      try {
        const [rows] = await conn.query(
          `SELECT condition_treatment_key, successes, failures FROM rl_bandit_arms`
        );

        for (const row of rows as any[]) {
          this.arms.set(row.condition_treatment_key, {
            successes: row.successes,
            failures: row.failures,
          });
        }

        console.log(`[ThompsonSampling] Loaded ${this.arms.size} arms from database`);
      } finally {
        conn.release();
      }
    } catch (error) {
      console.warn('[ThompsonSampling] Failed to load arms:', error);
    }
  }

  /**
   * Get arm statistics
   */
  getArmStats(condition: string, treatment: string) {
    const key = `${condition}|${treatment}`;
    const arm = this.arms.get(key);

    if (!arm) {
      return null;
    }

    const total = arm.successes + arm.failures;
    const successRate = arm.successes / total;
    const confidence = Math.sqrt((successRate * (1 - successRate)) / total);

    return {
      successes: arm.successes,
      failures: arm.failures,
      total,
      successRate: (successRate * 100).toFixed(2) + '%',
      confidence: (confidence * 100).toFixed(2) + '%',
    };
  }
}

/**
 * Global RL instances
 */
let globalQLearner: QLearner | null = null;
let globalBandit: ThompsonSampling | null = null;

/**
 * Get or create global Q-learner
 */
export async function getQLearner(): Promise<QLearner> {
  if (!globalQLearner) {
    globalQLearner = new QLearner();
    await globalQLearner.loadQTable();
  }
  return globalQLearner;
}

/**
 * Get or create global Thompson Sampling bandit
 */
export async function getThompsonSampling(): Promise<ThompsonSampling> {
  if (!globalBandit) {
    globalBandit = new ThompsonSampling();
    await globalBandit.loadArms();
  }
  return globalBandit;
}

/**
 * Shutdown RL system
 */
export async function shutdownRL(): Promise<void> {
  try {
    await rlPool.end();
    console.log('[RL] Connection pool closed');
  } catch (error) {
    console.error('[RL] Error closing pool:', error);
  }
}
