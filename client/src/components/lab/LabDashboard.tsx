import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function LabDashboard() {
  const { data: summary } = trpc.lab.getDashboardSummary.useQuery();
  const { data: abnormalResults } = trpc.lab.getAbnormalResults.useQuery();
  const { data: criticalResults } = trpc.lab.getCriticalResults.useQuery();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Lab Results Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Your comprehensive lab results dashboard. View trends, abnormal results, and health insights.
          </p>
          
          {summary && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{summary.totalReports}</div>
                <div className="text-sm text-blue-700">Total Reports</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{summary.totalResults}</div>
                <div className="text-sm text-green-700">Total Tests</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {abnormalResults && abnormalResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-900">Abnormal Results Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {abnormalResults.slice(0, 5).map((result: any) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">{result.testName}</div>
                    <div className="text-sm text-slate-600">{result.value} {result.unit}</div>
                  </div>
                  <div className="text-sm text-orange-700">{result.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
