import { useState, useEffect, useRef } from "react";
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
  TrendingDown,
  Minus,
  Calendar,
  Filter,
  ArrowLeft,
  Download,
  Clock,
  Thermometer,
  Wind,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';

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
  
  const [selectedVitalMetric, setSelectedVitalMetric] = useState<'all' | 'bp' | 'hr' | 'temp' | 'spo2'>('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  
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

  // Prepare chart data from vitals
  const vitalsChartData = vitalsData?.map((vital: any) => {
    // Parse blood pressure
    const bpMatch = vital.bloodPressure?.match(/(\d+)\/(\d+)/);
    const systolic = bpMatch ? parseInt(bpMatch[1]) : null;
    const diastolic = bpMatch ? parseInt(bpMatch[2]) : null;
    
    return {
      date: new Date(vital.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: new Date(vital.recordedAt).getTime(),
      systolic,
      diastolic,
      heartRate: vital.heartRate || null,
      temperature: vital.temperature || null,
      spo2: vital.oxygenSaturation || null,
    };
  }).sort((a: any, b: any) => a.timestamp - b.timestamp) || [];

  // Calculate trends
  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3).filter(d => d[key] !== null);
    if (recent.length < 2) return 'stable';
    
    const first = recent[0][key];
    const last = recent[recent.length - 1][key];
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

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

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Medical Case Timeline Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Patient Information
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Patient: ${caseData?.patientName || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Age: ${caseData?.patientAge || 'N/A'} | Gender: ${caseData?.patientGender || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Chief Complaint: ${caseData?.chiefComplaint || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Urgency: ${caseData?.urgency || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Report Generated: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 15;

      // Vital Signs Summary
      if (vitalsData && vitalsData.length > 0) {
        const latestVital = vitalsData[vitalsData.length - 1];
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Latest Vital Signs', 20, yPosition);
        yPosition += 7;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        if (latestVital.bloodPressureSystolic && latestVital.bloodPressureDiastolic) {
          pdf.text(`Blood Pressure: ${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic} mmHg`, 20, yPosition);
          yPosition += 6;
        }
        if (latestVital.heartRate) {
          pdf.text(`Heart Rate: ${latestVital.heartRate} bpm`, 20, yPosition);
          yPosition += 6;
        }
        if (latestVital.temperature) {
          pdf.text(`Temperature: ${latestVital.temperature}°C`, 20, yPosition);
          yPosition += 6;
        }
        if (latestVital.oxygenSaturation) {
          pdf.text(`Oxygen Saturation: ${latestVital.oxygenSaturation}%`, 20, yPosition);
          yPosition += 6;
        }
        yPosition += 10;
      }

      // Capture charts as images
      if (chartsRef.current) {
        try {
          const canvas = await html2canvas(chartsRef.current, {
            scale: 2,
            logging: false,
            useCORS: true,
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if we need a new page
          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Vital Signs Trends', 20, yPosition);
          yPosition += 10;
          
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, Math.min(imgHeight, 100));
          yPosition += Math.min(imgHeight, 100) + 15;
        } catch (error) {
          console.error('Error capturing charts:', error);
        }
      }

      // Timeline Events
      if (filteredEvents && filteredEvents.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Timeline Events', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        filteredEvents.slice(0, 20).forEach((event: any, index: number) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const eventDate = new Date(event.eventDate).toLocaleDateString();
          const eventText = `${eventDate} - ${event.eventType.toUpperCase()}`;
          pdf.setFont('helvetica', 'bold');
          pdf.text(eventText, 20, yPosition);
          yPosition += 5;
          
          pdf.setFont('helvetica', 'normal');
          if (event.description) {
            const lines = pdf.splitTextToSize(event.description, pageWidth - 50);
            lines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 25, yPosition);
              yPosition += 5;
            });
          }
          yPosition += 3;
        });
      }

      // Footer on last page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          `MediTriage AI Pro - Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      pdf.save(`case-timeline-${caseData?.patientName?.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
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
          <Button 
            variant="outline"
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Timeline PDF
              </>
            )}
          </Button>
        </div>

        {/* Vital Signs Charts */}
        {vitalsData && vitalsData.length > 0 && selectedEventTypes.includes("vital_signs") && (
          <div ref={chartsRef} className="space-y-6 mb-6">
            {/* Vital Signs Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Blood Pressure Card */}
              <Card className="card-modern">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-semibold">Blood Pressure</span>
                    </div>
                    {getTrendIcon(calculateTrend(vitalsChartData, 'systolic'))}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsChartData[vitalsChartData.length - 1]?.systolic || 'N/A'}/
                    {vitalsChartData[vitalsChartData.length - 1]?.diastolic || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">mmHg</p>
                </CardContent>
              </Card>

              {/* Heart Rate Card */}
              <Card className="card-modern">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold">Heart Rate</span>
                    </div>
                    {getTrendIcon(calculateTrend(vitalsChartData, 'heartRate'))}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsChartData[vitalsChartData.length - 1]?.heartRate || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">bpm</p>
                </CardContent>
              </Card>

              {/* Temperature Card */}
              <Card className="card-modern">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-semibold">Temperature</span>
                    </div>
                    {getTrendIcon(calculateTrend(vitalsChartData, 'temperature'))}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsChartData[vitalsChartData.length - 1]?.temperature || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">°C</p>
                </CardContent>
              </Card>

              {/* SpO2 Card */}
              <Card className="card-modern">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold">SpO2</span>
                    </div>
                    {getTrendIcon(calculateTrend(vitalsChartData, 'spo2'))}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {vitalsChartData[vitalsChartData.length - 1]?.spo2 || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">%</p>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Charts */}
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Vital Signs Trend Analysis
                    </CardTitle>
                    <CardDescription>Interactive charts showing vital signs over time</CardDescription>
                  </div>
                  <Select value={selectedVitalMetric} onValueChange={(v: any) => setSelectedVitalMetric(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Metrics</SelectItem>
                      <SelectItem value="bp">Blood Pressure</SelectItem>
                      <SelectItem value="hr">Heart Rate</SelectItem>
                      <SelectItem value="temp">Temperature</SelectItem>
                      <SelectItem value="spo2">SpO2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedVitalMetric === 'all' ? (
                  <div className="space-y-8">
                    {/* Blood Pressure Chart */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-600" />
                        Blood Pressure (mmHg)
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={vitalsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[60, 180]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="systolic" stroke="#dc2626" strokeWidth={2} name="Systolic" />
                          <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} name="Diastolic" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Heart Rate Chart */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Heart Rate (bpm)
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={vitalsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[40, 140]} />
                          <Tooltip />
                          <Area type="monotone" dataKey="heartRate" stroke="#2563eb" fill="#93c5fd" name="Heart Rate" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Temperature & SpO2 Combined */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-600" />
                        Temperature & SpO2
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <ComposedChart data={vitalsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" domain={[35, 42]} />
                          <YAxis yAxisId="right" orientation="right" domain={[90, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} name="Temp (°C)" />
                          <Bar yAxisId="right" dataKey="spo2" fill="#22c55e" name="SpO2 (%)" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    {selectedVitalMetric === 'bp' ? (
                      <LineChart data={vitalsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[60, 180]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="systolic" stroke="#dc2626" strokeWidth={3} name="Systolic" />
                        <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={3} name="Diastolic" />
                      </LineChart>
                    ) : selectedVitalMetric === 'hr' ? (
                      <AreaChart data={vitalsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[40, 140]} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="heartRate" stroke="#2563eb" fill="#93c5fd" strokeWidth={3} name="Heart Rate (bpm)" />
                      </AreaChart>
                    ) : selectedVitalMetric === 'temp' ? (
                      <LineChart data={vitalsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[35, 42]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} name="Temperature (°C)" />
                      </LineChart>
                    ) : (
                      <AreaChart data={vitalsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[90, 100]} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="spo2" stroke="#22c55e" fill="#86efac" strokeWidth={3} name="SpO2 (%)" />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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

        {/* Timeline Events */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Event Timeline
            </CardTitle>
            <CardDescription>Chronological view of patient events</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No events found. Try adjusting your filters.
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                {/* Events */}
                <div className="space-y-6">
                  {filteredEvents.map((event: any, index: number) => (
                    <div key={event.id} className="relative pl-16">
                      {/* Timeline Dot */}
                      <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-md"></div>

                      {/* Event Card */}
                      <Card className={`border-2 ${getEventColor(event.eventType)}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {getEventIcon(event.eventType)}
                              <div>
                                <CardTitle className="text-base">{event.title}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {new Date(event.timestamp).toLocaleString()}
                                </CardDescription>
                              </div>
                            </div>
                            {event.severity && (
                              <Badge className={getSeverityColor(event.severity)}>
                                {event.severity}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        {event.description && (
                          <CardContent className="pt-0">
                            <p className="text-sm text-gray-700">{event.description}</p>
                            {event.data && typeof event.data === 'object' && (
                              <div className="mt-3 p-3 bg-white/50 rounded text-xs space-y-1">
                                {Object.entries(event.data).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="font-medium">{key}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
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
