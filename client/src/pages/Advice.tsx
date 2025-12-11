import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Download, 
  Printer, 
  Copy, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Home
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

interface AdviceData {
  urgencyLevel: string;
  chiefComplaint: string;
  symptoms: string[];
  assessment: string;
  recommendations: string;
  redFlags: string[];
  disclaimer: string;
}

export default function Advice() {
  const { strings, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  // Mock data - in real app, this would come from triage session
  const advice: AdviceData = {
    urgencyLevel: "SEMI-URGENT",
    chiefComplaint: "Persistent headache with visual disturbances",
    symptoms: ["Headache", "Blurred vision", "Nausea", "Light sensitivity"],
    assessment: "Based on the symptoms described, this could indicate a migraine or potentially more serious neurological condition. The combination of visual disturbances and persistent headache warrants medical evaluation.",
    recommendations: "1. Seek medical attention within 24 hours\n2. Avoid bright lights and loud noises\n3. Stay hydrated\n4. Document any changes in symptoms\n5. If symptoms worsen, seek immediate emergency care",
    redFlags: [
      "Sudden severe headache (thunderclap)",
      "Loss of consciousness",
      "Confusion or difficulty speaking",
      "Weakness or numbness on one side",
      "High fever with stiff neck"
    ],
    disclaimer: "This assessment is provided by an AI system and is not a medical diagnosis. Always consult with a qualified healthcare professional for proper medical advice."
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'EMERGENCY':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'URGENT':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'SEMI-URGENT':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'NON-URGENT':
        return <Info className="w-6 h-6 text-blue-600" />;
      case 'ROUTINE':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  const getUrgencyClass = (level: string) => {
    const levelLower = level.toLowerCase().replace('-', '-');
    return `urgency-${levelLower}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.info("PDF download feature coming soon");
  };

  const handleCopy = async () => {
    const text = `
${strings.adviceTitle}

${strings.summaryHeaders.urgency}: ${advice.urgencyLevel}
${strings.summaryHeaders.complaint}: ${advice.chiefComplaint}

${strings.summaryHeaders.details}:
${advice.symptoms.join(', ')}

${strings.summaryHeaders.recommendation}:
${advice.recommendations}

${strings.summaryHeaders.disclaimer}:
${advice.disclaimer}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(strings.copied);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(strings.errors.generic);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card p-4 flex items-center justify-between no-print">
        <h1 className="text-xl font-semibold">{strings.adviceTitle}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {strings.printReport}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            {strings.downloadPdf}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? strings.copied : strings.copyReport}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Urgency Level */}
          <Card className={`border-2 ${getUrgencyClass(advice.urgencyLevel)}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getUrgencyIcon(advice.urgencyLevel)}
                <div>
                  <CardTitle>{strings.summaryHeaders.urgency}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {advice.urgencyLevel}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle>{strings.summaryHeaders.complaint}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{advice.chiefComplaint}</p>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>{strings.summaryHeaders.details}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {advice.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{advice.assessment}</p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>{strings.summaryHeaders.recommendation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{advice.recommendations}</p>
            </CardContent>
          </Card>

          {/* Red Flags */}
          {advice.redFlags.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                <strong className="block mb-2">Warning Signs - Seek Immediate Care If:</strong>
                <ul className="list-disc list-inside space-y-1">
                  {advice.redFlags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Disclaimer */}
          <Alert>
            <Info className="h-5 w-5" />
            <AlertDescription>
              <strong className="block mb-1">{strings.summaryHeaders.disclaimer}</strong>
              {advice.disclaimer}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-4 justify-center no-print">
            <Button onClick={() => setLocation('/triage')} size="lg">
              {strings.restart}
            </Button>
            <Button onClick={() => setLocation('/')} variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
