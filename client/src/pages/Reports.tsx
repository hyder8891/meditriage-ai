import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, TrendingUp, Users, Activity, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import ClinicianLayout from "@/components/ClinicianLayout";

function ReportsContent() {
  const [, setLocation] = useLocation();

  const reports = [
    { 
      id: 1, 
      title: "Monthly Patient Summary", 
      type: "patient", 
      date: "2024-01-31", 
      status: "completed",
      description: "Comprehensive overview of patient visits and outcomes"
    },
    { 
      id: 2, 
      title: "Diagnostic Accuracy Report", 
      type: "diagnostic", 
      date: "2024-01-30", 
      status: "completed",
      description: "BRAIN system performance and accuracy metrics"
    },
    { 
      id: 3, 
      title: "Weekly Case Review", 
      type: "case", 
      date: "2024-01-28", 
      status: "completed",
      description: "Summary of clinical cases and treatment outcomes"
    },
    { 
      id: 4, 
      title: "Medication Adherence Analysis", 
      type: "medication", 
      date: "2024-01-25", 
      status: "pending",
      description: "Patient medication compliance and outcomes"
    },
  ];

  const getReportIcon = (type: string) => {
    switch (type) {
      case "patient": return <Users className="w-5 h-5" />;
      case "diagnostic": return <Activity className="w-5 h-5" />;
      case "case": return <FileText className="w-5 h-5" />;
      case "medication": return <BarChart3 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case "patient": return "bg-blue-100 text-blue-600";
      case "diagnostic": return "bg-purple-100 text-purple-600";
      case "case": return "bg-green-100 text-green-600";
      case "medication": return "bg-orange-100 text-orange-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 mt-1">View and generate clinical reports</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">{reports.length}</div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">3</div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">
                  {reports.filter(r => r.status === "pending").length}
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-purple-600">
                  {reports.filter(r => r.status === "completed").length}
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Generate</CardTitle>
            <CardDescription>Generate common reports with one click</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Users className="w-6 h-6 mb-2 text-blue-500" />
                <span className="font-medium">Patient Summary</span>
                <span className="text-xs text-gray-500 mt-1">Monthly overview</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Activity className="w-6 h-6 mb-2 text-purple-500" />
                <span className="font-medium">Diagnostic Report</span>
                <span className="text-xs text-gray-500 mt-1">BRAIN accuracy</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <FileText className="w-6 h-6 mb-2 text-green-500" />
                <span className="font-medium">Case Review</span>
                <span className="text-xs text-gray-500 mt-1">Weekly summary</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <BarChart3 className="w-6 h-6 mb-2 text-orange-500" />
                <span className="font-medium">Analytics</span>
                <span className="text-xs text-gray-500 mt-1">Custom metrics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>View and download your generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getReportColor(report.type)}`}>
                      {getReportIcon(report.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {report.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === "completed" && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Reports() {
  return (
    <ClinicianLayout>
      <ReportsContent />
    </ClinicianLayout>
  );
}
