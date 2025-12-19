import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Brain, TrendingUp, Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function BRAINDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate date range
  const getDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  // Fetch BRAIN metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.brain.getMetrics.useQuery({
    startDate: getDaysAgo(days),
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch case history
  const { data: caseHistory, isLoading: historyLoading } = trpc.brain.getCaseHistory.useQuery({
    caseId: '' // Empty string to get all cases
  });

  if (metricsLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading BRAIN Analytics...</p>
        </div>
      </div>
    );
  }

  const accuracyRate = metrics?.accuracy || 0;
  const totalCases = metrics?.totalCases || 0;
  const correctDiagnoses = Math.round((metrics?.accuracy || 0) * (metrics?.totalCases || 0));
  const avgProcessingTime = metrics?.averageProcessingTime || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              BRAIN Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Biomedical Reasoning and Intelligence Network Performance Metrics
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-6">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
            size="sm"
          >
            Last 7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
            size="sm"
          >
            Last 30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('90d')}
            size="sm"
          >
            Last 90 Days
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Accuracy Rate */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Diagnostic Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {(accuracyRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {correctDiagnoses} of {totalCases} cases correct
            </p>
          </CardContent>
        </Card>

        {/* Total Cases */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Cases Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalCases.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Clinical reasoning sessions
            </p>
          </CardContent>
        </Card>

        {/* Correct Diagnoses */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Correct Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {correctDiagnoses}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Validated by clinicians
            </p>
          </CardContent>
        </Card>

        {/* Avg Processing Time */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {(avgProcessingTime / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per clinical reasoning session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Case History
            </CardTitle>
            <CardDescription>
              Latest clinical reasoning sessions processed by BRAIN
            </CardDescription>
          </CardHeader>
          <CardContent>
            {caseHistory && caseHistory.length > 0 ? (
              <div className="space-y-4">
                {caseHistory.map((caseItem: any) => {
                  let diagnosis;
                  try {
                    diagnosis = typeof caseItem.diagnosis === 'string' 
                      ? JSON.parse(caseItem.diagnosis) 
                      : caseItem.diagnosis;
                  } catch {
                    diagnosis = { differentialDiagnosis: [] };
                  }

                  const topDiagnosis = diagnosis.differentialDiagnosis?.[0];
                  const confidence = caseItem.confidence_score || 0;

                  return (
                    <div
                      key={caseItem.case_id}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        confidence > 0.8 ? 'bg-green-100' : 
                        confidence > 0.6 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {confidence > 0.8 ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {topDiagnosis?.condition || 'Diagnosis Pending'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Case ID: {caseItem.case_id}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {(confidence * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">Confidence</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {topDiagnosis?.reasoning || 'No reasoning available'}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {new Date(caseItem.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No cases analyzed yet</p>
                <p className="text-sm mt-2">Start using BRAIN to see analytics here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <div className="max-w-7xl mx-auto mt-8">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Brain className="w-12 h-12 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">BRAIN System Information</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Version 1.0.0 • Knowledge Base: 20,000+ medical concepts • Literature: 30M+ PubMed articles
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Continuous learning enabled • Iraqi medical context integrated • Arabic language support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
