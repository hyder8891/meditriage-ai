import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  FileText,
  User,
  Clock,
  Send,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLogo } from "@/components/AppLogo";

interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  message: string;
  timestamp: Date;
}

export default function ConsultationRoom() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const consultationId = parseInt(id || "0");
  
  // Video/Audio states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(true);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Queries
  const { data: consultation, isLoading } = trpc.consultation.getById.useQuery(
    { id: consultationId },
    { enabled: !!consultationId }
  );
  
  const utils = trpc.useUtils();
  
  // Mutations
  const startMutation = trpc.consultation.start.useMutation({
    onSuccess: () => {
      utils.consultation.getById.invalidate({ id: consultationId });
      toast.success(language === 'ar' ? 'بدأت الاستشارة' : 'Consultation started');
    },
  });
  
  const endMutation = trpc.consultation.end.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'انتهت الاستشارة' : 'Consultation ended');
      setLocation(user?.role === 'clinician' ? '/clinician/dashboard' : '/patient/portal');
    },
  });
  
  const saveNotesMutation = trpc.consultation.saveNotes.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حفظ الملاحظات' : 'Notes saved');
    },
  });
  
  // Initialize local video stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const initializeMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast.error(language === 'ar' ? 'فشل الوصول إلى الكاميرا/الميكروفون' : 'Failed to access camera/microphone');
      }
    };
    
    initializeMedia();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [language]);
  
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Start consultation when page loads
  useEffect(() => {
    if (consultation && consultation.status === 'scheduled') {
      startMutation.mutate({ id: consultationId });
    }
  }, [consultation?.status]);
  
  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };
  
  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };
  
  const handleEndCall = () => {
    if (confirm(language === 'ar' ? 'هل تريد إنهاء الاستشارة؟' : 'Are you sure you want to end the consultation?')) {
      endMutation.mutate({ id: consultationId });
    }
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 0,
      senderName: user?.name || 'User',
      message: newMessage,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage("");
    
    // TODO: Send message via WebSocket or tRPC subscription
  };
  
  const handleSaveNotes = () => {
    if (!notes.trim()) return;
    
    saveNotesMutation.mutate({
      id: consultationId,
      notes,
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {language === 'ar' ? 'الاستشارة غير موجودة' : 'Consultation Not Found'}
            </h2>
            <Button onClick={() => setLocation(user?.role === 'clinician' ? '/clinician/dashboard' : '/patient/portal')}>
              {language === 'ar' ? 'العودة' : 'Go Back'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isDoctor = user?.role === 'clinician' || user?.role === 'admin';
  const otherParticipantName = isDoctor 
    ? (consultation as any).patient?.name || 'Patient'
    : (consultation as any).doctor?.name || 'Doctor';
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogo href={user?.role === 'clinician' ? '/clinician/dashboard' : '/patient/portal'} size="sm" showText={false} />
            <div>
              <h1 className="text-white font-semibold">
                {language === 'ar' ? 'استشارة فيديو' : 'Video Consultation'}
              </h1>
              <p className="text-gray-400 text-sm">
                {language === 'ar' ? 'مع' : 'with'} {otherParticipantName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600">
              <Clock className="w-3 h-3 mr-1" />
              {consultation.duration || 0} {language === 'ar' ? 'دقيقة' : 'min'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(user?.role === 'clinician' ? '/clinician/dashboard' : '/patient/portal')}
              className="text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Video Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Remote Video */}
            <Card className="flex-1 bg-gray-800 border-gray-700 relative overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                {otherParticipantName}
              </div>
              {/* Placeholder when no remote stream */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <User className="w-24 h-24 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {language === 'ar' ? 'في انتظار الطرف الآخر...' : 'Waiting for other participant...'}
                  </p>
                </div>
              </div>
            </Card>
            
            {/* Local Video */}
            <div className="relative w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                {language === 'ar' ? 'أنت' : 'You'}
              </div>
            </div>
            
            {/* Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant={isVideoEnabled ? "default" : "destructive"}
                    onClick={toggleVideo}
                    className="rounded-full w-14 h-14"
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant={isAudioEnabled ? "default" : "destructive"}
                    onClick={toggleAudio}
                    className="rounded-full w-14 h-14"
                  >
                    {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleEndCall}
                    className="rounded-full w-14 h-14"
                    disabled={endMutation.isPending}
                  >
                    {endMutation.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <PhoneOff className="w-6 h-6" />
                    )}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowChat(!showChat)}
                    className="rounded-full w-14 h-14"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - Chat & Notes */}
          {showChat && (
            <div className="flex flex-col gap-4">
              {/* Chat */}
              <Card className="flex-1 bg-gray-800 border-gray-700 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">
                    {language === 'ar' ? 'الدردشة' : 'Chat'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4 pt-0">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.senderId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Notes (Doctor only) */}
              {isDoctor && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {language === 'ar' ? 'ملاحظات' : 'Notes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'اكتب ملاحظاتك هنا...' : 'Write your notes here...'}
                      className="bg-gray-700 border-gray-600 text-white min-h-[120px] mb-2"
                    />
                    <Button
                      onClick={handleSaveNotes}
                      disabled={saveNotesMutation.isPending}
                      className="w-full"
                      size="sm"
                    >
                      {saveNotesMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      {language === 'ar' ? 'حفظ الملاحظات' : 'Save Notes'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
