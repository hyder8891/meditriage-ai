/**
 * BRAIN Performance Monitor
 * Real-time performance tracking and optimization recommendations
 */

import mysql from 'mysql2/promise';

let _connection: mysql.Connection | null = null;

async function getConnection() {
  if (!_connection && process.env.DATABASE_URL) {
    try {
      _connection = await mysql.createConnection(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Performance Monitor] Failed to connect to database:", error);
      _connection = null;
    }
  }
  return _connection;
}

export interface PerformanceMetrics {
  overall: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    totalCases: number;
    period: string;
  };
  byCondition: Array<{
    condition: string;
    accuracy: number;
    caseCount: number;
    avgConfidence: number;
  }>;
  byDemographic: {
    byAge: Array<{ ageGroup: string; accuracy: number; caseCount: number }>;
    byGender: Array<{ gender: string; accuracy: number; caseCount: number }>;
  };
  errorAnalysis: {
    missedDiagnoses: number;
    incorrectRanking: number;
    lowConfidence: number;
  };
  trends: {
    accuracyTrend: Array<{ date: string; accuracy: number }>;
    volumeTrend: Array<{ date: string; cases: number }>;
  };
}

export interface OptimizationRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'data' | 'model' | 'process';
  issue: string;
  recommendation: string;
  expectedImpact: string;
}

export class PerformanceMonitor {
  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(period: 'day' | 'week' | 'month' | 'all' = 'month'): Promise<PerformanceMetrics> {
    const conn = await getConnection();
    if (!conn) throw new Error('Database not available');

    const dateFilter = this.getDateFilter(period);

    try {
      // Overall metrics
      const overall = await this.calculateOverallMetrics(conn, dateFilter);
      
      // Performance by condition
      const byCondition = await this.getPerformanceByCondition(conn, dateFilter);
      
      // Performance by demographics
      const byDemographic = await this.getPerformanceByDemographic(conn, dateFilter);
      
      // Error analysis
      const errorAnalysis = await this.getErrorAnalysis(conn, dateFilter);
      
      // Trends
      const trends = await this.getPerformanceTrends(conn, period);

      return {
        overall,
        byCondition,
        byDemographic,
        errorAnalysis,
        trends
      };
    } catch (error) {
      console.error('[Performance Monitor] Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate overall performance metrics
   */
  private async calculateOverallMetrics(conn: mysql.Connection, dateFilter: string): Promise<any> {
    const [rows] = await conn.execute(`
      SELECT 
        COUNT(*) as total_cases,
        AVG(accuracy_score) as accuracy,
        SUM(CASE WHEN accuracy_score >= 0.8 THEN 1 ELSE 0 END) / COUNT(*) as precision,
        SUM(CASE WHEN accuracy_score >= 0.5 THEN 1 ELSE 0 END) / COUNT(*) as recall
      FROM brain_learning_feedback
      WHERE ${dateFilter}
    `);

    const result = (rows as any[])[0];
    const precision = result.precision || 0;
    const recall = result.recall || 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      accuracy: result.accuracy || 0,
      precision,
      recall,
      f1Score,
      totalCases: result.total_cases || 0,
      period: dateFilter
    };
  }

  /**
   * Get performance breakdown by condition
   */
  private async getPerformanceByCondition(conn: mysql.Connection, dateFilter: string): Promise<any[]> {
    const [rows] = await conn.execute(`
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(actual_diagnosis, '$.diagnosis')) as condition,
        AVG(accuracy_score) as accuracy,
        COUNT(*) as case_count,
        AVG(JSON_EXTRACT(brain_diagnosis, '$.confidence')) as avg_confidence
      FROM brain_learning_feedback
      WHERE ${dateFilter}
      GROUP BY condition
      HAVING case_count >= 3
      ORDER BY case_count DESC
      LIMIT 20
    `);

    return (rows as any[]).map((row: any) => ({
      condition: row.condition,
      accuracy: row.accuracy,
      caseCount: row.case_count,
      avgConfidence: row.avg_confidence
    }));
  }

  /**
   * Get performance breakdown by demographics
   */
  private async getPerformanceByDemographic(conn: mysql.Connection, dateFilter: string): Promise<any> {
    // By age group
    const [ageRows] = await conn.execute(`
      SELECT 
        CASE 
          WHEN JSON_EXTRACT(c.patient_demographics, '$.age') < 18 THEN 'Under 18'
          WHEN JSON_EXTRACT(c.patient_demographics, '$.age') BETWEEN 18 AND 35 THEN '18-35'
          WHEN JSON_EXTRACT(c.patient_demographics, '$.age') BETWEEN 36 AND 50 THEN '36-50'
          WHEN JSON_EXTRACT(c.patient_demographics, '$.age') BETWEEN 51 AND 65 THEN '51-65'
          ELSE 'Over 65'
        END as age_group,
        AVG(f.accuracy_score) as accuracy,
        COUNT(*) as case_count
      FROM brain_learning_feedback f
      JOIN brain_case_history c ON f.case_id = c.case_id
      WHERE ${dateFilter}
      GROUP BY age_group
      ORDER BY age_group
    `);

    // By gender
    const [genderRows] = await conn.execute(`
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(c.patient_demographics, '$.gender')) as gender,
        AVG(f.accuracy_score) as accuracy,
        COUNT(*) as case_count
      FROM brain_learning_feedback f
      JOIN brain_case_history c ON f.case_id = c.case_id
      WHERE ${dateFilter}
      GROUP BY gender
    `);

    return {
      byAge: (ageRows as any[]).map((row: any) => ({
        ageGroup: row.age_group,
        accuracy: row.accuracy,
        caseCount: row.case_count
      })),
      byGender: (genderRows as any[]).map((row: any) => ({
        gender: row.gender,
        accuracy: row.accuracy,
        caseCount: row.case_count
      }))
    };
  }

  /**
   * Get error analysis
   */
  private async getErrorAnalysis(conn: mysql.Connection, dateFilter: string): Promise<any> {
    const [rows] = await conn.execute(`
      SELECT 
        error_type,
        COUNT(*) as count
      FROM brain_error_analysis
      WHERE ${dateFilter}
      GROUP BY error_type
    `);

    const errorCounts: any = {};
    (rows as any[]).forEach((row: any) => {
      errorCounts[row.error_type] = row.count;
    });

    return {
      missedDiagnoses: errorCounts.missed_diagnosis || 0,
      incorrectRanking: errorCounts.incorrect_ranking || 0,
      lowConfidence: errorCounts.no_diagnosis || 0
    };
  }

  /**
   * Get performance trends
   */
  private async getPerformanceTrends(conn: mysql.Connection, period: string): Promise<any> {
    const days = period === 'day' ? 7 : period === 'week' ? 30 : 90;

    const [accuracyRows] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        AVG(accuracy_score) as accuracy
      FROM brain_learning_feedback
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    const [volumeRows] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as cases
      FROM brain_case_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    return {
      accuracyTrend: (accuracyRows as any[]).map((row: any) => ({
        date: row.date,
        accuracy: row.accuracy
      })),
      volumeTrend: (volumeRows as any[]).map((row: any) => ({
        date: row.date,
        cases: row.cases
      }))
    };
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const metrics = await this.getPerformanceMetrics('month');
    const recommendations: OptimizationRecommendation[] = [];

    // Check overall accuracy
    if (metrics.overall.accuracy < 0.85) {
      recommendations.push({
        priority: 'high',
        category: 'model',
        issue: `Overall accuracy is ${(metrics.overall.accuracy * 100).toFixed(1)}%, below target of 85%`,
        recommendation: 'Trigger immediate training session with recent feedback data',
        expectedImpact: 'Improve accuracy by 5-10%'
      });
    }

    // Check for conditions with low accuracy
    const lowAccuracyConditions = metrics.byCondition.filter(c => c.accuracy < 0.7 && c.caseCount >= 5);
    if (lowAccuracyConditions.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data',
        issue: `${lowAccuracyConditions.length} conditions have accuracy below 70%`,
        recommendation: `Focus training on: ${lowAccuracyConditions.map(c => c.condition).join(', ')}. Consider adding more training cases for these conditions.`,
        expectedImpact: 'Improve condition-specific accuracy by 10-15%'
      });
    }

    // Check error patterns
    if (metrics.errorAnalysis.missedDiagnoses > metrics.overall.totalCases * 0.2) {
      recommendations.push({
        priority: 'high',
        category: 'model',
        issue: `High rate of missed diagnoses (${metrics.errorAnalysis.missedDiagnoses} cases)`,
        recommendation: 'Review differential diagnosis generation logic. May need to expand knowledge base or adjust confidence thresholds.',
        expectedImpact: 'Reduce missed diagnoses by 20-30%'
      });
    }

    // Check data volume
    if (metrics.overall.totalCases < 100) {
      recommendations.push({
        priority: 'medium',
        category: 'data',
        issue: `Low case volume (${metrics.overall.totalCases} cases this month)`,
        recommendation: 'Increase data collection efforts. Consider synthetic case generation for rare conditions.',
        expectedImpact: 'Improve model robustness and generalization'
      });
    }

    // Check demographic gaps
    const lowVolumeAgeGroups = metrics.byDemographic.byAge.filter(g => g.caseCount < 10);
    if (lowVolumeAgeGroups.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'data',
        issue: `Limited data for age groups: ${lowVolumeAgeGroups.map(g => g.ageGroup).join(', ')}`,
        recommendation: 'Collect more cases from underrepresented age groups to ensure model fairness.',
        expectedImpact: 'Improve accuracy across all demographics'
      });
    }

    // Check confidence calibration
    const lowConfidenceCases = metrics.byCondition.filter(c => c.avgConfidence < 0.6);
    if (lowConfidenceCases.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'model',
        issue: `${lowConfidenceCases.length} conditions show low confidence scores`,
        recommendation: 'Review confidence calibration. May need to adjust scoring algorithm or add more supporting evidence.',
        expectedImpact: 'Improve clinical decision confidence'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get date filter SQL clause
   */
  private getDateFilter(period: string): string {
    switch (period) {
      case 'day':
        return "created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
      case 'week':
        return "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
      case 'month':
        return "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
      case 'all':
        return "1=1";
      default:
        return "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }
  }

  /**
   * Export performance report
   */
  async exportPerformanceReport(period: 'day' | 'week' | 'month' | 'all' = 'month'): Promise<string> {
    const metrics = await this.getPerformanceMetrics(period);
    const recommendations = await this.generateOptimizationRecommendations();

    const report = {
      generatedAt: new Date().toISOString(),
      period,
      metrics,
      recommendations,
      summary: {
        overallHealth: this.calculateHealthScore(metrics),
        keyFindings: this.generateKeyFindings(metrics),
        actionItems: recommendations.filter(r => r.priority === 'high')
      }
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(metrics: PerformanceMetrics): number {
    const accuracyScore = metrics.overall.accuracy * 100;
    const volumeScore = Math.min(metrics.overall.totalCases / 100, 1) * 100;
    const errorScore = (1 - (metrics.errorAnalysis.missedDiagnoses / metrics.overall.totalCases)) * 100;

    return (accuracyScore * 0.5 + volumeScore * 0.2 + errorScore * 0.3);
  }

  /**
   * Generate key findings
   */
  private generateKeyFindings(metrics: PerformanceMetrics): string[] {
    const findings: string[] = [];

    findings.push(`Overall accuracy: ${(metrics.overall.accuracy * 100).toFixed(1)}%`);
    findings.push(`Total cases analyzed: ${metrics.overall.totalCases}`);
    findings.push(`F1 Score: ${(metrics.overall.f1Score * 100).toFixed(1)}%`);

    if (metrics.byCondition.length > 0) {
      const topCondition = metrics.byCondition[0];
      findings.push(`Most common condition: ${topCondition.condition} (${topCondition.caseCount} cases)`);
    }

    const totalErrors = metrics.errorAnalysis.missedDiagnoses + 
                       metrics.errorAnalysis.incorrectRanking + 
                       metrics.errorAnalysis.lowConfidence;
    if (totalErrors > 0) {
      findings.push(`Total diagnostic errors: ${totalErrors}`);
    }

    return findings;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
