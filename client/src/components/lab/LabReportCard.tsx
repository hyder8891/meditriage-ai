import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  Building2,
  User,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface LabReportCardProps {
  report: any;
}

export function LabReportCard({ report }: LabReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: reportDetails } = trpc.lab.getLabReport.useQuery(
    { reportId: report.id },
    { enabled: expanded }
  );

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      low: { variant: "default", icon: CheckCircle, label: "Low Risk", color: "text-green-600" },
      moderate: { variant: "secondary", icon: Activity, label: "Moderate Risk", color: "text-yellow-600" },
      high: { variant: "destructive", icon: AlertCircle, label: "High Risk", color: "text-orange-600" },
      critical: { variant: "destructive", icon: AlertCircle, label: "Critical", color: "text-red-600" },
    };

    const config = variants[riskLevel] || variants.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      normal: { color: "bg-green-100 text-green-800", label: "Normal" },
      high: { color: "bg-orange-100 text-orange-800", label: "High" },
      low: { color: "bg-blue-100 text-blue-800", label: "Low" },
      critical_high: { color: "bg-red-100 text-red-800", label: "Critical High" },
      critical_low: { color: "bg-red-100 text-red-800", label: "Critical Low" },
    };

    const config = variants[status] || { color: "bg-gray-100 text-gray-800", label: status };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">
              {report.reportName || "Lab Report"}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(report.reportDate).toLocaleDateString()}
              </div>
              {report.labName && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {report.labName}
                </div>
              )}
              {report.orderingPhysician && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {report.orderingPhysician}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.riskLevel && getRiskBadge(report.riskLevel)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && reportDetails && (
        <CardContent className="space-y-6">
          {/* Overall Interpretation */}
          {reportDetails.report.overallInterpretation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Overall Assessment</h4>
              <p className="text-sm text-blue-800">
                {reportDetails.report.overallInterpretation}
              </p>
            </div>
          )}

          {/* Recommended Actions */}
          {reportDetails.report.recommendedActions && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Recommended Actions</h4>
              <ul className="list-disc list-inside space-y-1">
                {JSON.parse(reportDetails.report.recommendedActions).map((action: string, idx: number) => (
                  <li key={idx} className="text-sm text-orange-800">{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual Results */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Test Results</h4>
            <div className="space-y-3">
              {reportDetails.results.map((result: any) => (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 ${
                    result.criticalFlag
                      ? "border-red-300 bg-red-50"
                      : result.abnormalFlag
                      ? "border-orange-300 bg-orange-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-slate-900">{result.testName}</h5>
                      {result.testCategory && (
                        <p className="text-xs text-slate-500">{result.testCategory}</p>
                      )}
                    </div>
                    {getStatusBadge(result.status)}
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-slate-900">{result.value}</span>
                    {result.unit && <span className="text-slate-600">{result.unit}</span>}
                    {result.referenceRangeText && (
                      <span className="text-sm text-slate-500">
                        (Normal: {result.referenceRangeText})
                      </span>
                    )}
                  </div>

                  {result.interpretation && (
                    <div className="bg-white/50 p-3 rounded border border-slate-200 mb-2">
                      <p className="text-sm text-slate-700">{result.interpretation}</p>
                    </div>
                  )}

                  {result.clinicalSignificance && result.abnormalFlag && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-2">
                      <p className="text-xs font-medium text-blue-900 mb-1">Clinical Significance:</p>
                      <p className="text-sm text-blue-800">{result.clinicalSignificance}</p>
                    </div>
                  )}

                  {result.possibleCauses && result.abnormalFlag && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-2">
                      <p className="text-xs font-medium text-yellow-900 mb-1">Possible Causes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {JSON.parse(result.possibleCauses).map((cause: string, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-800">{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendedFollowUp && (
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <p className="text-xs font-medium text-purple-900 mb-1">Follow-up:</p>
                      <p className="text-sm text-purple-800">{result.recommendedFollowUp}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
