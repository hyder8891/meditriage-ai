import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock,
  CheckCheck,
  Search
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { io, Socket } from "socket.io-client";
import { useLocation } from "wouter";

function SecureMessagingContent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Get patient ID from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patient');
    if (patientId) {
      setSelectedConversation(parseInt(patientId));
    }
  }, []);

  // Get all conversations for current user
  const { data: sentMessages, refetch: refetchSent } = trpc.clinical.getMessagesBySender.useQuery(
    { senderId: user?.id || 0 },
    { enabled: !!user }
  );
  
  const { data: receivedMessages, refetch: refetchReceived } = trpc.clinical.getMessagesByRecipient.useQuery(
    { recipientId: user?.id || 0 },
    { enabled: !!user }
  );

  // Initialize Socket.IO connection for real-time messaging
  useEffect(() => {
    if (!user?.id) return;

    // Connect to Socket.IO server
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id);
      // Register user for receiving notifications
      socket.emit('register-user', { userId: user.id });
    });

    // Listen for new messages in real-time
    socket.on(`user:${user.id}:new-message`, (data: any) => {
      console.log('New message received:', data);
      // Refetch messages to update UI
      refetchSent();
      refetchReceived();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unregister-user', { userId: user.id });
        socketRef.current.disconnect();
      }
    };
  }, [user?.id, refetchSent, refetchReceived]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, sentMessages, receivedMessages]);

  // Send message mutation
  const sendMessageMutation = trpc.clinical.sendMessage.useMutation({
    onSuccess: () => {
      setMessageContent("");
      utils.clinical.getMessagesBySender.invalidate();
      utils.clinical.getMessagesByRecipient.invalidate();
    },
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.clinical.markMessageAsRead.useMutation({
    onSuccess: () => {
      utils.clinical.getMessagesByRecipient.invalidate();
    },
  });

  const t = {
    title: language === "ar" ? "الرسائل الآمنة" : "Secure Messaging",
    subtitle: language === "ar" ? "تواصل بشكل آمن مع المرضى والأطباء" : "Communicate securely with patients and clinicians",
    conversations: language === "ar" ? "المحادثات" : "Conversations",
    newMessage: language === "ar" ? "رسالة جديدة" : "New Message",
    search: language === "ar" ? "بحث..." : "Search...",
    typeMessage: language === "ar" ? "اكتب رسالتك..." : "Type your message...",
    send: language === "ar" ? "إرسال" : "Send",
    noConversations: language === "ar" ? "لا توجد محادثات" : "No conversations",
    selectConversation: language === "ar" ? "اختر محادثة لعرض الرسائل" : "Select a conversation to view messages",
    unread: language === "ar" ? "غير مقروءة" : "Unread",
    read: language === "ar" ? "مقروءة" : "Read",
    you: language === "ar" ? "أنت" : "You",
  };

  // Combine and organize conversations
  const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
  
  // Group messages by conversation partner
  const conversations = allMessages.reduce((acc: any[], msg) => {
    const partnerId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
    const existing = acc.find(c => c.partnerId === partnerId);
    
    if (existing) {
      existing.messages.push(msg);
      existing.lastMessage = msg;
      if (msg.recipientId === user?.id && !msg.read) {
        existing.unreadCount += 1;
      }
    } else {
      acc.push({
        partnerId,
        partnerName: msg.senderId === user?.id ? `User ${msg.recipientId}` : `User ${msg.senderId}`,
        messages: [msg],
        lastMessage: msg,
        unreadCount: msg.recipientId === user?.id && !msg.read ? 1 : 0,
      });
    }
    
    return acc;
  }, []);

  // Sort by most recent message
  conversations.sort((a: any, b: any) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  const selectedConv = conversations.find(c => c.partnerId === selectedConversation);
  const selectedMessages = selectedConv?.messages.sort((a: any, b: any) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) || [];

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      senderId: user?.id || 0,
      recipientId: selectedConversation,
      content: messageContent,
    });
  };

  const handleSelectConversation = (partnerId: number) => {
    setSelectedConversation(partnerId);
    // Update URL with patient parameter
    navigate(`/clinician/messages?patient=${partnerId}`, { replace: true });
    
    // Mark unread messages as read
    const unreadMessages = receivedMessages?.filter(
      (m: any) => m.senderId === partnerId && !m.read
    ) || [];
    
    unreadMessages.forEach((msg: any) => {
      markAsReadMutation.mutate({ messageId: msg.id });
    });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {t.conversations}
              </CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{t.noConversations}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv: any) => (
                      <button
                        key={conv.partnerId}
                        onClick={() => handleSelectConversation(conv.partnerId)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedConversation === conv.partnerId ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{conv.partnerName}</span>
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConv ? selectedConv.partnerName : t.selectConversation}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedConversation ? (
                <div className="h-[600px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>{t.selectConversation}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <ScrollArea className="h-[500px] mb-4">
                    <div className="space-y-4 p-4">
                      {selectedMessages.map((msg: any) => {
                        const isOwn = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-4 ${
                                isOwn
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {msg.subject && (
                                <p className="font-semibold mb-2">{msg.subject}</p>
                              )}
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <div
                                className={`flex items-center gap-2 mt-2 text-xs ${
                                  isOwn ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                {new Date(msg.createdAt).toLocaleString()}
                                {isOwn && msg.read && (
                                  <CheckCheck className="w-4 h-4 text-blue-200" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={t.typeMessage}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendMessageMutation.isPending}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SecureMessaging() {
  return (
    <ClinicianLayout>
      <SecureMessagingContent />
    </ClinicianLayout>
  );
}
