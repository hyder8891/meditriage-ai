import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, Filter, Calendar } from "lucide-react";
import { toast } from "sonner";
import { VitalsTrendsChart } from "@/components/VitalsTrendsChart";

export function PatientVitalsViewer() {
  const [patientId, setPatientId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  const { data: vitals, isLoading, refetch } = trpc.vitals.getDoctorPatientVitals.useQuery(
    {
      patientId: patientId ? parseInt(patientId) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      onlyAbnormal,
      limit: 100,
    },
    {
      enabled: true, // Always fetch, filters are optional
    }
  );

  const handleFilter = () => {
    refetch();
    toast.success("Filters applied");
  };

  const getHeartRateStatus = (hr: number | null) => {
    if (!hr) return { label: "N/A", color: "gray", icon: Minus };
    if (hr < 50) return { label: "Low", color: "blue", icon: TrendingDown };
    if (hr > 100) return { label: "High", color: "red", icon: TrendingUp };
    return { label: "Normal", color: "green", icon: Minus };
  };

  const getStressColor = (level: string | null) => {
    if (!level) return "gray";
    if (level === "HIGH") return "red";
    if (level === "LOW") return "blue";
    return "green";
  };

  const getAnsBalanceColor = (balance: string | null) => {
    if (!balance) return "gray";
    if (balance === "SYMPATHETIC") return "orange";
    if (balance === "PARASYMPATHETIC") return "blue";
    return "green";
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Vitals Monitor</h1>
          <p className="text-muted-foreground">View and analyze patient cardiovascular measurements</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter vitals by patient, date range, or abnormal readings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                type="number"
                placeholder="Enter patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abnormalOnly">Reading Type</Label>
              <Select value={onlyAbnormal ? "abnormal" : "all"} onValueChange={(v) => setOnlyAbnormal(v === "abnormal")}>
                <SelectTrigger id="abnormalOnly">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Readings</SelectItem>
                  <SelectItem value="abnormal">Abnormal Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleFilter}>
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setPatientId("");
                setStartDate("");
                setEndDate("");
                setOnlyAbnormal(false);
                setTimeout(() => refetch(), 100);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading vitals...</p>
          </CardContent>
        </Card>
      ) : !vitals || vitals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No vitals found matching your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {vitals.length} measurement{vitals.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid gap-4">
            {vitals.map((vital: any) => {
              const hrStatus = getHeartRateStatus(vital.heartRate);
              const StatusIcon = hrStatus.icon;

              return (
                <Card key={vital.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Patient & Timestamp */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Patient</p>
                        <p className="text-lg font-semibold">ID: {vital.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          {vital.createdAt ? new Date(vital.createdAt).toLocaleString() : "N/A"}
                        </p>
                      </div>

                      {/* Heart Rate */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          Heart Rate
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{vital.heartRate ?? "N/A"}</p>
                          {vital.heartRate && <span className="text-sm text-muted-foreground">BPM</span>}
                        </div>
                        <Badge variant="outline" className={`text-${hrStatus.color}-600 border-${hrStatus.color}-300`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {hrStatus.label}
                        </Badge>
                      </div>

                      {/* HRV Stress Score */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          HRV Stress
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{vital.hrvStressScore ?? "N/A"}</p>
                          {vital.hrvStressScore !== null && <span className="text-sm text-muted-foreground">/100</span>}
                        </div>
                        {vital.hrvAnsBalance && (
                          <Badge variant="outline" className={`text-${getAnsBalanceColor(vital.hrvAnsBalance)}-600`}>
                            {vital.hrvAnsBalance}
                          </Badge>
                        )}
                      </div>

                      {/* Stress Level */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Stress Level</p>
                        <Badge className={`text-${getStressColor(vital.stressLevel)}-600 border-${getStressColor(vital.stressLevel)}-300`} variant="outline">
                          {vital.stressLevel ?? "N/A"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {vital.confidenceScore ?? "N/A"}%
                        </p>
                      </div>

                      {/* HRV Details */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">HRV Metrics</p>
                        <div className="text-xs space-y-0.5">
                          {vital.hrvRmssd && <p>RMSSD: {vital.hrvRmssd}ms</p>}
                          {vital.hrvSdnn && <p>SDNN: {vital.hrvSdnn}ms</p>}
                          {vital.hrvPnn50 && <p>pNN50: {vital.hrvPnn50}%</p>}
                          {vital.hrvLfHfRatio && <p>LF/HF: {vital.hrvLfHfRatio}</p>}
                          {!vital.hrvRmssd && <p className="text-muted-foreground">No HRV data</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trends Chart */}
          {vitals && vitals.length > 0 && (
            <div className="mt-8">
              <VitalsTrendsChart 
                vitals={vitals}
                title="Patient Vitals Trends"
                description="Visualize heart rate and HRV patterns over time"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
