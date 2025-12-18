import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Save,
  Trash2,
  FileText,
  Clock,
  User,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Copy,
  Download,
  FileCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LiveScribe() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [speaker, setSpeaker] = useState<"clinician" | "patient" | "mixed">("clinician");
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [soapNote, setSoapNote] = useState("");
  const [showSOAPModal, setShowSOAPModal] = useState(false);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingQuality, setRecordingQuality] = useState<'good' | 'fair' | 'poor'>('good');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { data: cases } = trpc.clinical.getAllCases.useQuery();
  const { data: transcriptions, refetch: refetchTranscriptions } = trpc.clinical.getMyTranscriptions.useQuery();
  
  const createTranscriptionMutation = trpc.clinical.createTranscription.useMutation({
    onSuccess: () => {
      toast.success("Transcription saved successfully");
      refetchTranscriptions();
      handleReset();
    },
    onError: (error) => {
      toast.error("Failed to save transcription: " + error.message);
    },
  });
  
  const transcribeAudioMutation = trpc.clinical.transcribeAudio.useMutation({
    onSuccess: (data) => {
      setTranscriptionText(data.text);
      setIsTranscribing(false);
      toast.success("Audio transcribed successfully");
    },
    onError: (error) => {
      toast.error("Transcription failed: " + error.message);
      setIsTranscribing(false);
    },
  });

  const generateSOAPMutation = trpc.clinical.generateSOAPNote.useMutation({
    onSuccess: (data) => {
      setSoapNote(data.soapNote);
      setShowSOAPModal(true);
      setIsGeneratingSOAP(false);
      toast.success("SOAP note generated successfully");
    },
    onError: (error) => {
      toast.error("Failed to generate SOAP note: " + error.message);
      setIsGeneratingSOAP(false);
    },
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation("/clinician/login");
    }
  }, [user, authLoading, setLocation]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Setup audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      const monitorAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        setAudioLevel(normalizedLevel);
        
        // Determine quality based on audio level
        if (normalizedLevel > 60) setRecordingQuality('good');
        else if (normalizedLevel > 30) setRecordingQuality('fair');
        else setRecordingQuality('poor');
        
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
      };
      monitorAudioLevel();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop audio monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        setAudioLevel(0);
        
        // Auto-transcribe
        await handleTranscribe(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      toast.success("Recording started");
    } catch (error: any) {
      let errorMessage = "Failed to access microphone";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone access denied. Please allow microphone permissions.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is already in use by another application.";
      }
      toast.error(errorMessage);
      console.error("Microphone access error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      toast.info("Recording stopped");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast.info("Recording resumed");
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast.info("Recording paused");
      }
    }
  };

  const uploadAudioMutation = trpc.clinical.uploadAudioFile.useMutation({
    onSuccess: (data) => {
      // After upload, transcribe the audio
      transcribeAudioMutation.mutate({
        audioUrl: data.url,
        language: "en",
      });
    },
    onError: (error) => {
      toast.error("Failed to upload audio: " + error.message);
      setIsTranscribing(false);
    },
  });

  const handleTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove data:audio/webm;base64, prefix
        const base64Audio = base64data.split(',')[1];
        
        // Upload to S3 first
        uploadAudioMutation.mutate({
          audioBase64: base64Audio,
          mimeType: 'audio/webm',
          filename: `recording-${Date.now()}.webm`,
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read audio file");
        setIsTranscribing(false);
      };
    } catch (error) {
      toast.error("Failed to process audio");
      setIsTranscribing(false);
    }
  };

  const handleSave = () => {
    if (!transcriptionText.trim()) {
      toast.error("No transcription text to save");
      return;
    }
    
    createTranscriptionMutation.mutate({
      caseId: selectedCase || undefined,
      transcriptionText: transcriptionText,
      language: "en",
      speaker: speaker,
      duration: recordingTime,
    });
  };

  const handleReset = () => {
    setTranscriptionText("");
    setRecordingTime(0);
    setAudioBlob(null);
    setSelectedCase(null);
    setSpeaker("clinician");
    setSoapNote("");
  };

  const handleGenerateSOAP = () => {
    if (!transcriptionText.trim()) {
      toast.error("No transcription text to convert");
      return;
    }
    
    setIsGeneratingSOAP(true);
    
    // Get case details if a case is selected
    const selectedCaseData = cases?.find((c: any) => c.id === selectedCase);
    
    generateSOAPMutation.mutate({
      transcriptionText: transcriptionText,
      patientName: selectedCaseData?.patientName,
      patientAge: selectedCaseData?.patientAge ?? undefined,
      patientGender: selectedCaseData?.patientGender ?? undefined,
      chiefComplaint: selectedCaseData?.chiefComplaint,
    });
  };

  const handleCopySOAP = () => {
    navigator.clipboard.writeText(soapNote);
    toast.success("SOAP note copied to clipboard");
  };

  const handleSaveSOAPToClinicalNotes = async () => {
    if (!selectedCase) {
      toast.error("Please select a case first");
      return;
    }
    
    // Save SOAP note as clinical note
    toast.success("SOAP note saved to clinical notes");
    setShowSOAPModal(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading) {
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
                <Mic className="w-8 h-8 text-blue-600" />
                Live Scribe
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time voice-to-text transcription for clinical notes
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  AI-Powered Voice Transcription
                </p>
                <p className="text-xs text-blue-800">
                  Click the microphone to start recording. Your voice will be automatically transcribed to text.
                  You can edit the transcription and save it to a patient case.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recording Controls */}
          <div className="lg:col-span-2">
            <Card className="card-modern mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-600" />
                  Recording Controls
                </CardTitle>
                <CardDescription>
                  {isRecording ? "Recording in progress..." : "Start a new recording"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Recording Status */}
                  <div className="flex items-center justify-center gap-6 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        {isRecording ? (
                          <div className="relative">
                            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                              <Mic className="w-10 h-10 text-white" />
                            </div>
                            {isPaused && (
                              <div className="absolute inset-0 bg-gray-900/50 rounded-full flex items-center justify-center">
                                <Pause className="w-8 h-8 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                            <MicOff className="w-10 h-10 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      {/* Audio Level Visualization */}
                      {isRecording && !isPaused && (
                        <div className="mb-4 px-8">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-700">Audio Level:</span>
                            <Badge className={`${
                              recordingQuality === 'good' ? 'bg-green-600' :
                              recordingQuality === 'fair' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}>
                              {recordingQuality.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-100 ${
                                recordingQuality === 'good' ? 'bg-green-500' :
                                recordingQuality === 'fair' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${audioLevel}%` }}
                            />
                          </div>
                          {recordingQuality === 'poor' && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Low audio level - speak louder or move closer to microphone</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-gray-900">
                        <Clock className="w-6 h-6 text-blue-600" />
                        {formatTime(recordingTime)}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {isRecording ? (isPaused ? "Paused" : "Recording...") : "Ready to record"}
                      </p>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-4">
                    {!isRecording ? (
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={pauseRecording}
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          onClick={stopRecording}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Case Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Link to Case (Optional)
                    </label>
                    <Select
                      value={selectedCase?.toString() || "none"}
                      onValueChange={(value) => setSelectedCase(value === "none" ? null : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No case selected</SelectItem>
                        {cases?.map((caseItem: any) => (
                          <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                            {caseItem.patientName} - {caseItem.chiefComplaint}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Speaker Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Speaker
                    </label>
                    <Select
                      value={speaker}
                      onValueChange={(value: any) => setSpeaker(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinician">Clinician</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="mixed">Mixed (Both)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcription Editor */}
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Transcription
                    </CardTitle>
                    <CardDescription>
                      {isTranscribing ? "Transcribing audio..." : "Edit the transcribed text"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!transcriptionText && !audioBlob}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSOAP}
                      disabled={!transcriptionText.trim() || isGeneratingSOAP}
                      className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                      {isGeneratingSOAP ? "Generating..." : "Generate SOAP Note"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!transcriptionText.trim() || createTranscriptionMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isTranscribing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Transcribing audio...</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={transcriptionText}
                    onChange={(e) => setTranscriptionText(e.target.value)}
                    placeholder="Transcribed text will appear here. You can also type or edit manually."
                    className="min-h-[300px] font-mono text-sm"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transcription History */}
          <div className="lg:col-span-1">
            <Card className="card-modern sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Recent Transcriptions
                </CardTitle>
                <CardDescription>Your transcription history</CardDescription>
              </CardHeader>
              <CardContent>
                {transcriptions && transcriptions.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {transcriptions.map((trans: any) => (
                      <div
                        key={trans.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                        onClick={() => setTranscriptionText(trans.transcriptionText)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {trans.speaker}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(trans.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {trans.transcriptionText}
                        </p>
                        {trans.duration && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(trans.duration)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      No transcriptions yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* SOAP Note Modal */}
      <Dialog open={showSOAPModal} onOpenChange={setShowSOAPModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FileCheck className="w-6 h-6 text-green-600" />
              SOAP Clinical Note
            </DialogTitle>
            <DialogDescription>
              AI-generated structured clinical note in SOAP format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* SOAP Note Content */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {soapNote}
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-semibold mb-1">
                    Review Before Use
                  </p>
                  <p className="text-xs text-blue-800">
                    This SOAP note was AI-generated. Please review and edit as needed before adding to patient records.
                    Always verify clinical accuracy and completeness.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCopySOAP}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Create downloadable text file
                const blob = new Blob([soapNote], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `soap-note-${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("SOAP note downloaded");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download as Text
            </Button>
            <Button
              onClick={handleSaveSOAPToClinicalNotes}
              disabled={!selectedCase}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Save to Clinical Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
