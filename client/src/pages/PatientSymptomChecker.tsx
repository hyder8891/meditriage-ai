import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Download
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { AudioInput } from "@/components/AudioInput";

export default function PatientSymptomChecker() {
  const [, setLocation] = useLocation();
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [useAudioInput, setUseAudioInput] = useState(false);

  const analyzeMutation = trpc.clinical.patientSymptomAnalysis.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success("Analysis complete");
    },
    onError: (error) => {
      toast.error("Analysis failed: " + error.message);
    },
  });

  const handleAnalyze = async () => {
    // Audio input mode
    if (useAudioInput && audioBlob) {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const mimeType = audioBlob.type;

          // Call audio analysis endpoint
          const result = await fetch('/api/trpc/audioSymptom.analyzeAudioSymptoms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
              language: 'ar'
            })
          });

          const data = await result.json();
          if (data.result?.data) {
            setAnalysis(data.result.data.analysis);
            toast.success("Audio analysis complete");
          }
        };
      } catch (error) {
        toast.error("Audio analysis failed");
        console.error(error);
      }
      return;
    }

    // Text input mode
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms");
      return;
    }

    analyzeMutation.mutate({ symptoms });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "emergency": return "bg-red-600";
      case "urgent": return "bg-orange-600";
      case "semi-urgent": return "bg-yellow-600";
      case "non-urgent": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-600" />
                Symptom Checker
              </h1>
              <p className="text-gray-600 mt-1">AI-powered health assessment & care guide</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-900 font-semibold mb-1">
                  Medical Disclaimer
                </p>
                <p className="text-sm text-orange-800">
                  This tool provides general health information and is not a substitute for professional medical advice. 
                  If you're experiencing a medical emergency, call emergency services immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Describe Your Symptoms
              </CardTitle>
              <CardDescription>
                Tell us what you're experiencing in your own words
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!useAudioInput ? "default" : "outline"}
                  onClick={() => setUseAudioInput(false)}
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Text Input
                </Button>
                <Button
                  variant={useAudioInput ? "default" : "outline"}
                  onClick={() => setUseAudioInput(true)}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Voice Input (Arabic)
                </Button>
              </div>

              {/* Text Input */}
              {!useAudioInput && (
                <Textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Example: I've had a persistent headache for 3 days, along with fever and body aches. The headache gets worse when I stand up..."
                  rows={12}
                  className="resize-none"
                />
              )}

              {/* Audio Input */}
              {useAudioInput && (
                <AudioInput
                  onAudioCapture={(blob, url) => {
                    setAudioBlob(blob);
                    toast.success("Audio recorded successfully");
                  }}
                  onClear={() => {
                    setAudioBlob(null);
                    setSymptoms("");
                  }}
                  language="ar"
                  maxDuration={180}
                  disabled={analyzeMutation.isPending}
                />
              )}

              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || (useAudioInput && !audioBlob) || (!useAudioInput && !symptoms.trim())}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                size="lg"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing your symptoms...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Analyze Symptoms
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your information is private and secure
              </p>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Urgency Level */}
                <Card className="card-modern border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Urgency Level
                      </span>
                      <Badge className={`${getUrgencyColor(analysis.urgencyLevel)} text-white px-4 py-1`}>
                        {analysis.urgencyLevel}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Care Guide */}
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Personalized Care Guide
                    </CardTitle>
                    <CardDescription>Recommended actions for your situation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{analysis.careGuide}</Streamdown>
                    </div>
                  </CardContent>
                </Card>

                {/* Doctor Script */}
                {analysis.doctorScript && (
                  <Card className="card-modern border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <MessageSquare className="w-5 h-5" />
                        Doctor Communication Script
                      </CardTitle>
                      <CardDescription>Use this when talking to your doctor</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{analysis.doctorScript}</Streamdown>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(analysis.doctorScript);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copy Script
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Possible Conditions */}
                {analysis.possibleConditions && analysis.possibleConditions.length > 0 && (
                  <Card className="card-modern">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Possible Conditions
                      </CardTitle>
                      <CardDescription>Based on your symptoms</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.possibleConditions.map((condition: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Home Care Advice */}
                {analysis.homeCareAdvice && (
                  <Card className="card-modern border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        Home Care Advice
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{analysis.homeCareAdvice}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="card-modern">
                <CardContent className="py-12 text-center">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No analysis yet</p>
                  <p className="text-sm text-gray-400">
                    Describe your symptoms to get personalized care guidance
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
