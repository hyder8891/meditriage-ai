import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  Heart,
  Pill,
  Stethoscope,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  Filter,
  ArrowLeft,
  Download,
  Clock,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CaseTimeline() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/clinician/case/:id/timeline");
  const { user, loading: authLoading } = useAuth();
  
  const caseId = params?.id ? parseInt(params.id) : null;
  
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([
    "symptom",
    "vital_signs",
    "diagnosis",
    "treatment",
    "medication",
  ]);
  
  const { data: caseData } = trpc.clinical.getCase.useQuery(
    { id: caseId! },
    { enabled: !!caseId }
  );
  
  const { data: timelineEvents, isLoading } = trpc.clinical.getCaseTimeline.useQuery(
    { caseId: caseId! },
    { enabled: !!caseId }
  );
  
  const { data: vitalsData } = trpc.clinical.getVitalsByCaseId.useQuery(
    { caseId: caseId! },
    { enabled: !!caseId }
  );

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation("/clinician/login");
    }
  }, [user, authLoading, setLocation]);

  if (!caseId) {
    return <div className="min-h-screen flex items-center justify-center">Invalid case ID</div>;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "symptom":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "vital_signs":
        return <Activity className="w-5 h-5 text-blue-600" />;
      case "diagnosis":
        return <Stethoscope className="w-5 h-5 text-purple-600" />;
      case "treatment":
        return <Heart className="w-5 h-5 text-red-600" />;
      case "medication":
        return <Pill className="w-5 h-5 text-green-600" />;
      case "procedure":
        return <Activity className="w-5 h-5 text-indigo-600" />;
      case "lab_result":
        return <FileText className="w-5 h-5 text-cyan-600" />;
      case "imaging":
        return <FileText className="w-5 h-5 text-teal-600" />;
      case "note":
        return <FileText className="w-5 h-5 text-gray-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "symptom":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "vital_signs":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "diagnosis":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "treatment":
        return "bg-red-100 border-red-300 text-red-800";
      case "medication":
        return "bg-green-100 border-green-300 text-green-800";
      case "procedure":
        return "bg-indigo-100 border-indigo-300 text-indigo-800";
      case "lab_result":
        return "bg-cyan-100 border-cyan-300 text-cyan-800";
      case "imaging":
        return "bg-teal-100 border-teal-300 text-teal-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const filteredEvents = timelineEvents?.filter((event: any) =>
    selectedEventTypes.includes(event.eventType)
  ) || [];

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((t) => t !== eventType)
        : [...prev, eventType]
    );
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                Case Timeline
              </h1>
              <p className="text-gray-600 mt-1">
                {caseData?.patientName} - {caseData?.chiefComplaint}
              </p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Timeline
          </Button>
        </div>

        {/* Event Type Filters */}
        <Card className="card-modern mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-600" />
              Filter Events
            </CardTitle>
            <CardDescription>Select event types to display on the timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { type: "symptom", label: "Symptoms", icon: AlertCircle },
                { type: "vital_signs", label: "Vital Signs", icon: Activity },
                { type: "diagnosis", label: "Diagnoses", icon: Stethoscope },
                { type: "treatment", label: "Treatments", icon: Heart },
                { type: "medication", label: "Medications", icon: Pill },
                { type: "procedure", label: "Procedures", icon: Activity },
                { type: "lab_result", label: "Lab Results", icon: FileText },
                { type: "imaging", label: "Imaging", icon: FileText },
                { type: "note", label: "Notes", icon: FileText },
              ].map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant={selectedEventTypes.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleEventType(type)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vitals Trend Graph */}
        {vitalsData && vitalsData.length > 0 && selectedEventTypes.includes("vital_signs") && (
          <Card className="card-modern mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Vital Signs Trends
              </CardTitle>
              <CardDescription>Track changes in vital signs over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blood Pressure */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-900">Blood Pressure</span>
                  </div>
                  <div className="space-y-1">
                    {vitalsData.slice(0, 3).map((vital: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-800">
                        {vital.bloodPressure || "N/A"} - {new Date(vital.recordedAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heart Rate */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">Heart Rate</span>
                  </div>
                  <div className="space-y-1">
                    {vitalsData.slice(0, 3).map((vital: any, idx: number) => (
                      <div key={idx} className="text-xs text-blue-800">
                        {vital.heartRate || "N/A"} bpm - {new Date(vital.recordedAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Temperature */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-900">Temperature</span>
                  </div>
                  <div className="space-y-1">
                    {vitalsData.slice(0, 3).map((vital: any, idx: number) => (
                      <div key={idx} className="text-xs text-orange-800">
                        {vital.temperature || "N/A"}°C - {new Date(vital.recordedAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SpO2 */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Oxygen Saturation</span>
                  </div>
                  <div className="space-y-1">
                    {vitalsData.slice(0, 3).map((vital: any, idx: number) => (
                      <div key={idx} className="text-xs text-green-800">
                        {vital.oxygenSaturation || "N/A"}% - {new Date(vital.recordedAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Events */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Timeline Events
            </CardTitle>
            <CardDescription>
              Chronological view of patient case events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No timeline events found</p>
                <p className="text-sm text-gray-400">
                  Events will appear here as the case progresses
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Timeline Events */}
                <div className="space-y-6">
                  {filteredEvents.map((event: any, idx: number) => (
                    <div key={event.id} className="relative pl-20">
                      {/* Timeline Dot */}
                      <div className="absolute left-5 top-2 w-6 h-6 rounded-full bg-white border-4 border-blue-500 z-10"></div>

                      {/* Event Card */}
                      <div className={`p-4 rounded-lg border-2 ${getEventColor(event.eventType)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getEventIcon(event.eventType)}
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <p className="text-xs opacity-75">
                                {new Date(event.eventTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {event.severity && (
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm mt-2">{event.description}</p>
                        )}
                        {event.eventData && (
                          <div className="mt-3 p-3 bg-white/50 rounded text-xs font-mono">
                            {JSON.stringify(event.eventData, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
