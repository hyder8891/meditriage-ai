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
import { io, Socket } from "socket.io-client";

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
  const roomId = `consultation-${consultationId}`;
  
  // Video/Audio states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/notification.mp3');
    notificationSoundRef.current.volume = 0.5;
  }, []);
  
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
      // Cleanup before leaving
      cleanupConnection();
      setLocation(user?.role === 'clinician' ? '/clinician/dashboard' : '/patient/portal');
    },
  });
  
  const saveNotesMutation = trpc.consultation.saveNotes.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حفظ الملاحظات' : 'Notes saved');
    },
  });
  
  // Initialize Socket.IO and WebRTC
  useEffect(() => {
    if (!user || !consultationId) return;
    
    // Connect to Socket.IO server
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Join consultation room
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        role: user.role,
      });
      setIsConnecting(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error(language === 'ar' ? 'فشل الاتصال بالخادم' : 'Failed to connect to server');
    });
    
    // Handle existing participants
    socket.on('existing-participants', (participants: string[]) => {
      console.log('Existing participants:', participants);
      if (participants.length > 0) {
        remoteSocketIdRef.current = participants[0];
        // Create offer for existing participant
        createOffer(participants[0]);
      }
    });
    
    // Handle new user joining
    socket.on('user-joined', ({ socketId, userId, role }) => {
      console.log('User joined:', socketId, userId, role);
      if (!remoteSocketIdRef.current) {
        remoteSocketIdRef.current = socketId;
        // Wait for offer from the new user
      }
    });
    
    // Handle user leaving
    socket.on('user-left', ({ socketId }) => {
      console.log('User left:', socketId);
      if (socketId === remoteSocketIdRef.current) {
        setRemoteConnected(false);
        remoteSocketIdRef.current = null;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        toast.info(language === 'ar' ? 'غادر الطرف الآخر' : 'Other participant left');
      }
    });
    
    // WebRTC signaling handlers
    socket.on('offer', async ({ offer, from }) => {
      console.log('Received offer from:', from);
      remoteSocketIdRef.current = from;
      await handleOffer(offer, from);
    });
    
    socket.on('answer', async ({ answer }) => {
      console.log('Received answer');
      await handleAnswer(answer);
    });
    
    socket.on('ice-candidate', async ({ candidate }) => {
      console.log('Received ICE candidate');
      await handleIceCandidate(candidate);
    });
    
    // Chat message handler
    socket.on('chat-message', ({ message, sender, senderName, timestamp }) => {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        senderId: sender,
        senderName,
        message,
        timestamp: new Date(timestamp),
      }]);
      
      // Play notification sound if message is from other user and user is on another tab
      if (sender !== user.id && document.hidden && notificationSoundRef.current) {
        notificationSoundRef.current.play().catch(err => {
          console.log('[ConsultationRoom] Failed to play notification sound:', err);
        });
      }
    });
    
    // Initialize local media
    initializeMedia();
    
    return () => {
      cleanupConnection();
    };
  }, [user, consultationId, roomId, language]);
  
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('Local media initialized');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error(language === 'ar' ? 'فشل الوصول إلى الكاميرا/الميكروفون' : 'Failed to access camera/microphone');
    }
  };
  
  const createPeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && remoteSocketIdRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          to: remoteSocketIdRef.current,
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        toast.success(language === 'ar' ? 'تم الاتصال بنجاح' : 'Connected successfully');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        toast.error(language === 'ar' ? 'فشل الاتصال' : 'Connection failed');
      }
    };
    
    peerConnectionRef.current = pc;
    return pc;
  };
  
  const createOffer = async (targetSocketId: string) => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current?.emit('offer', {
        offer,
        to: targetSocketId,
      });
      
      console.log('Offer sent to:', targetSocketId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };
  
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    try {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current?.emit('answer', {
        answer,
        to: from,
      });
      
      console.log('Answer sent');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };
  
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set');
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };
  
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };
  
  const cleanupConnection = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId, userId: user?.id });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
  
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
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };
  
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
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
    if (!newMessage.trim() || !socketRef.current || !user) return;
    
    socketRef.current.emit('chat-message', {
      roomId,
      message: newMessage,
      sender: user.id,
      senderName: user.name || 'User',
    });
    
    setNewMessage("");
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
            {isConnecting && (
              <Badge className="bg-yellow-600">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
              </Badge>
            )}
            {!isConnecting && remoteConnected && (
              <Badge className="bg-green-600">
                <Clock className="w-3 h-3 mr-1" />
                {language === 'ar' ? 'متصل' : 'Connected'}
              </Badge>
            )}
            {!isConnecting && !remoteConnected && (
              <Badge className="bg-orange-600">
                <Clock className="w-3 h-3 mr-1" />
                {language === 'ar' ? 'في انتظار الطرف الآخر' : 'Waiting for other'}
              </Badge>
            )}
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
              {remoteConnected && (
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                  {otherParticipantName}
                </div>
              )}
              {/* Placeholder when no remote stream */}
              {!remoteConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="text-center">
                    <User className="w-24 h-24 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {language === 'ar' ? 'في انتظار الطرف الآخر...' : 'Waiting for other participant...'}
                    </p>
                  </div>
                </div>
              )}
            </Card>
            
            {/* Local Video */}
            <div className="relative w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
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
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.senderId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-xs opacity-75 mb-1">{msg.senderName}</p>
                          <p className="text-sm">{msg.message}</p>
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
                      {language === 'ar' ? 'الملاحظات' : 'Notes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'ملاحظات الاستشارة...' : 'Consultation notes...'}
                      className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                    />
                    <Button
                      onClick={handleSaveNotes}
                      disabled={saveNotesMutation.isPending}
                      className="w-full"
                    >
                      {saveNotesMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {language === 'ar' ? 'حفظ الملاحظات' : 'Save Notes'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
