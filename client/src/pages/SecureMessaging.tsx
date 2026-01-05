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
  Search,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { io, Socket } from "socket.io-client";
import { useLocation } from "wouter";
import { VoiceInput } from "@/components/VoiceInput";
import { toast } from "sonner";

function SecureMessagingContent() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/notification.mp3');
    notificationSoundRef.current.volume = 0.5;
  }, []);

  const utils = trpc.useUtils();

  // Get patient ID from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('patient');
    if (patientId) {
      setSelectedUserId(parseInt(patientId));
    }
  }, []);

  // Get all conversations using b2b2c messaging API
  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = 
    trpc.b2b2c.messaging.getConversations.useQuery(undefined, {
      retry: false,
    });

  // Debug logging
  useEffect(() => {
    console.log('[SecureMessaging] Conversations:', conversations);
    console.log('[SecureMessaging] Loading:', conversationsLoading);
    console.log('[SecureMessaging] Error:', conversationsError);
  }, [conversations, conversationsLoading, conversationsError]);

  // Get selected conversation messages
  const { data: messages, isLoading: messagesLoading } = 
    trpc.b2b2c.messaging.getConversation.useQuery(
      { otherUserId: selectedUserId! },
      { 
        enabled: selectedUserId !== null,
      }
    );

  // Send message mutation using b2b2c API
  const sendMessageMutation = trpc.b2b2c.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessageContent("");
      utils.b2b2c.messaging.getConversation.invalidate();
      utils.b2b2c.messaging.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(isArabic ? 'فشل إرسال الرسالة' : 'Failed to send message', {
        description: error.message,
      });
    },
  });

  // Mark as read mutation
  const markAsRead = trpc.b2b2c.messaging.markAsRead.useMutation({
    onSuccess: () => {
      utils.b2b2c.messaging.getConversations.invalidate();
      utils.b2b2c.messaging.getUnreadCount.invalidate();
    },
  });

  // Initialize Socket.IO connection for real-time messaging
  useEffect(() => {
    if (!user?.id) return;

    // Connect to Socket.IO server
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SecureMessaging] Socket connected:', socket.id);
      // Register user for receiving notifications
      socket.emit('register-user', { userId: user.id });
    });

    // Listen for new messages in real-time
    socket.on(`user:${user.id}:new-message`, (data: any) => {
      console.log('[SecureMessaging] New message received:', data);
      
      // Invalidate queries to refresh UI
      utils.b2b2c.messaging.getConversations.invalidate();
      
      // If the message is from the currently selected conversation, refresh it
      if (selectedUserId && data.senderId === selectedUserId) {
        utils.b2b2c.messaging.getConversation.invalidate({ otherUserId: selectedUserId });
      }
      
      // Show notification if not in the conversation
      if (data.senderId !== selectedUserId) {
        toast.info(isArabic ? 'رسالة جديدة' : 'New message', {
          description: data.senderName || (isArabic ? 'رسالة جديدة من محادثة' : 'New message from conversation'),
        });
      }
      
      // Play notification sound if user is on another tab
      if (document.hidden && notificationSoundRef.current) {
        notificationSoundRef.current.play().catch(err => {
          console.log('[SecureMessaging] Failed to play notification sound:', err);
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[SecureMessaging] Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[SecureMessaging] Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unregister-user', { userId: user.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, selectedUserId, utils, isArabic]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (messages && selectedUserId && user) {
      const unreadMessages = messages
        .filter(m => m.recipientId === user.id && !m.read)
        .map(m => m.id);
      
      if (unreadMessages.length > 0) {
        markAsRead.mutate({ messageIds: unreadMessages });
      }
    }
  }, [messages, selectedUserId, user]);

  const t = {
    title: isArabic ? "الرسائل الآمنة" : "Secure Messaging",
    subtitle: isArabic ? "تواصل بشكل آمن مع المرضى" : "Communicate securely with your patients",
    conversations: isArabic ? "المحادثات" : "Conversations",
    newMessage: isArabic ? "رسالة جديدة" : "New Message",
    search: isArabic ? "بحث..." : "Search...",
    typeMessage: isArabic ? "اكتب رسالتك..." : "Type your message...",
    send: isArabic ? "إرسال" : "Send",
    noConversations: isArabic ? "لا توجد محادثات بعد" : "No conversations yet",
    selectConversation: isArabic ? "اختر محادثة لعرض الرسائل" : "Select a conversation to view messages",
    unread: isArabic ? "غير مقروءة" : "Unread",
    read: isArabic ? "مقروءة" : "Read",
    you: isArabic ? "أنت" : "You",
    noMessages: isArabic ? "لا توجد رسائل بعد. ابدأ المحادثة!" : "No messages yet. Start the conversation!",
    loading: isArabic ? "جاري التحميل..." : "Loading...",
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedUserId) return;
    
    sendMessageMutation.mutate({
      recipientId: selectedUserId,
      content: messageContent.trim(),
    });
  };

  const handleSelectConversation = (userId: number) => {
    setSelectedUserId(userId);
    // Update URL with patient parameter
    navigate(`/clinician/messages?patient=${userId}`, { replace: true });
  };

  // Filter conversations by search query
  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery.trim()) return true;
    const otherUser = conv.otherUser;
    if (!otherUser) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.displayName?.toLowerCase().includes(searchLower) ||
      otherUser.name?.toLowerCase().includes(searchLower) ||
      otherUser.email?.toLowerCase().includes(searchLower) ||
      otherUser.phoneNumber?.includes(searchQuery)
    );
  }) || [];

  // Get selected conversation details
  const selectedConv = conversations?.find(c => c.otherUser?.id === selectedUserId);

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5" />
                {t.conversations}
              </CardTitle>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversationsError ? (
                  <div className="text-center py-8 text-red-600 text-sm px-4">
                    <p className="font-semibold">{isArabic ? 'خطأ في تحميل المحادثات:' : 'Error loading conversations:'}</p>
                    <p className="text-xs mt-2">{conversationsError.message}</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{t.noConversations}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => {
                      const otherUser = conv.otherUser;
                      if (!otherUser) return null;

                      const isSelected = selectedUserId === otherUser.id;
                      const hasUnread = conv.unreadCount > 0;

                      return (
                        <button
                          key={otherUser.id}
                          onClick={() => handleSelectConversation(otherUser.id)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <span className={`font-medium block ${hasUnread ? "font-bold" : ""}`}>
                                  {otherUser.displayName || otherUser.name || otherUser.phoneNumber || otherUser.email || `User ${otherUser.id}`}
                                </span>
                                {otherUser.role && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {otherUser.role === 'patient' 
                                      ? (isArabic ? 'مريض' : 'Patient')
                                      : otherUser.role === 'clinician'
                                      ? (isArabic ? 'طبيب' : 'Doctor')
                                      : otherUser.role
                                    }
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {hasUnread && (
                              <Badge className="bg-red-500 text-white">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          {conv.latestMessage && (
                            <p className="text-sm text-gray-600 truncate mt-2">
                              {conv.latestMessage.content}
                            </p>
                          )}
                          
                          {conv.latestMessage && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {new Date(conv.latestMessage.createdAt).toLocaleDateString(
                                isArabic ? 'ar-IQ' : 'en-US',
                                { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="flex items-center gap-3">
                {selectedConv?.otherUser && (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <span className="block">
                    {selectedConv?.otherUser 
                      ? (selectedConv.otherUser.displayName || selectedConv.otherUser.name || selectedConv.otherUser.phoneNumber || `User ${selectedConv.otherUser.id}`)
                      : t.selectConversation
                    }
                  </span>
                  {selectedConv?.otherUser?.role && (
                    <span className="text-sm font-normal text-gray-500">
                      {selectedConv.otherUser.role === 'patient' 
                        ? (isArabic ? 'مريض' : 'Patient')
                        : selectedConv.otherUser.role === 'clinician'
                        ? (isArabic ? 'طبيب' : 'Doctor')
                        : selectedConv.otherUser.role
                      }
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {!selectedUserId ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>{t.selectConversation}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : !messages || messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {t.noMessages}
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isSentByMe = message.senderId === user?.id;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isSentByMe
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                <div
                                  className={`flex items-center gap-2 mt-2 text-xs ${
                                    isSentByMe ? "text-blue-100" : "text-gray-500"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {new Date(message.createdAt).toLocaleString(
                                    isArabic ? 'ar-IQ' : 'en-US',
                                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                                  )}
                                  {isSentByMe && message.read && (
                                    <CheckCheck className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
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
                        className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                      />
                      <div className="flex flex-col gap-2">
                        <VoiceInput
                          onTranscript={(text) => setMessageContent(messageContent + (messageContent ? ' ' : '') + text)}
                          language={isArabic ? 'ar-SA' : 'en-US'}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageContent.trim() || sendMessageMutation.isPending}
                          size="icon"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {sendMessageMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
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
