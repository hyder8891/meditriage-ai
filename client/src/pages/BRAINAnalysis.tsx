/**
 * BRAIN Analysis Page
 * Clinical reasoning interface with evidence-based diagnosis
 */

import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Brain, Activity, AlertTriangle, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BRAINAnalysis() {
  const [symptoms, setSymptoms] = useState<string[]>(['']);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [location, setLocation] = useState('Iraq');

  const analyzeMutation = trpc.brain.analyze.useMutation({
    onSuccess: () => {
      toast.success('Analysis complete');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    }
  });

  const handleAddSymptom = () => {
    setSymptoms([...symptoms, '']);
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSymptomChange = (index: number, value: string) => {
    const newSymptoms = [...symptoms];
    newSymptoms[index] = value;
    setSymptoms(newSymptoms);
  };

  const handleAnalyze = () => {
    const validSymptoms = symptoms.filter(s => s.trim().length > 0);
    
    if (validSymptoms.length === 0) {
      toast.error('Please enter at least one symptom');
      return;
    }

    if (!age || parseInt(age) <= 0) {
      toast.error('Please enter a valid age');
      return;
    }

    analyzeMutation.mutate({
      symptoms: validSymptoms,
      patientInfo: {
        age: parseInt(age),
        gender,
        medicalHistory: medicalHistory ? medicalHistory.split(',').map(s => s.trim()) : [],
        location
      },
      language: 'en'
    });
  };

  const result = analyzeMutation.data;

  return (
    <div className="container py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">BRAIN Analysis</h1>
            <p className="text-muted-foreground">Biomedical Reasoning and Intelligence Network</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Evidence-based clinical reasoning powered by 900,000+ medical concepts and continuous learning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Enter patient demographics and symptoms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="0"
                  max="150"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Baghdad, Iraq"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Medical History */}
              <div className="space-y-2">
                <Label htmlFor="history">Medical History</Label>
                <Input
                  id="history"
                  placeholder="Comma-separated conditions"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Example: Diabetes, Hypertension, Asthma
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Symptoms *</CardTitle>
              <CardDescription>List all presenting symptoms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {symptoms.map((symptom, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Symptom ${index + 1}`}
                    value={symptom}
                    onChange={(e) => handleSymptomChange(index, e.target.value)}
                  />
                  {symptoms.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveSymptom(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={handleAddSymptom}
                className="w-full"
              >
                + Add Symptom
              </Button>

              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                size="lg"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze with BRAIN
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Differential Diagnosis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Differential Diagnosis
                  </CardTitle>
                  <CardDescription>
                    Confidence: {(result.diagnosis.confidence * 100).toFixed(0)}% • 
                    Processing: {result.processingTime}ms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.diagnosis.differentialDiagnosis.map((dx, i) => (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{i + 1}. {dx.condition}</span>
                            {dx.icd10 && (
                              <Badge variant="secondary" className="text-xs">
                                {dx.icd10}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {dx.reasoning}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {(dx.probability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {dx.supportingEvidence.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Evidence:</strong> {dx.supportingEvidence.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Red Flags */}
              {result.diagnosis.redFlags.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.diagnosis.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <span className="mt-1">•</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.diagnosis.recommendations.immediateActions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Immediate Actions</h4>
                      <ul className="space-y-1">
                        {result.diagnosis.recommendations.immediateActions.map((action, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary">→</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.diagnosis.recommendations.tests.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Diagnostic Tests</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.diagnosis.recommendations.tests.map((test, i) => (
                          <Badge key={i} variant="secondary">{test}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.diagnosis.recommendations.imaging.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Imaging Studies</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.diagnosis.recommendations.imaging.map((img, i) => (
                          <Badge key={i} variant="secondary">{img}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.diagnosis.recommendations.referrals.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Specialist Referrals</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.diagnosis.recommendations.referrals.map((ref, i) => (
                          <Badge key={i} variant="outline">{ref}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evidence Sources */}
              {result.evidence.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Evidence Sources
                    </CardTitle>
                    <CardDescription>
                      Knowledge base matches: {result.evidence.length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.evidence.map((ev, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>{ev.title}</span>
                          <Badge variant="outline">{(ev.relevance * 100).toFixed(0)}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Case ID */}
              <div className="text-xs text-muted-foreground text-center">
                Case ID: {result.caseId}
              </div>
            </>
          )}

          {!result && !analyzeMutation.isPending && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Enter patient information and symptoms, then click "Analyze with BRAIN" to get evidence-based clinical reasoning
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
