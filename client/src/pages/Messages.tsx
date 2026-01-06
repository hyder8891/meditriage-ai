import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, User, Circle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PatientLayout } from "@/components/PatientLayout";

import { useLanguage } from "@/contexts/LanguageContext";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

function MessagesContent() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const utils = trpc.useUtils();
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/notification.mp3');
    notificationSoundRef.current.volume = 0.5;
  }, []);

  // Get all conversations
  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = 
    trpc.b2b2c.messaging.getConversations.useQuery(undefined, {
      retry: false,
    });
  
  // Debug logging
  useEffect(() => {
    console.log('[Messages] Conversations:', conversations);
    console.log('[Messages] Loading:', conversationsLoading);
    console.log('[Messages] Error:', conversationsError);
  }, [conversations, conversationsLoading, conversationsError]);

  // Get selected conversation messages
  const { data: messages, isLoading: messagesLoading } = 
    trpc.b2b2c.messaging.getConversation.useQuery(
      { otherUserId: selectedUserId! },
      { 
        enabled: selectedUserId !== null,
      }
    );

  // Send message mutation
  const sendMessage = trpc.b2b2c.messaging.sendMessage.useMutation({
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

  // Initialize Socket.IO for real-time messaging
  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO server
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Messages] Socket connected:', socket.id);
      // Register user for receiving messages
      socket.emit('register-user', { userId: user.id });
    });

    socket.on('connect_error', (error) => {
      console.error('[Messages] Socket connection error:', error);
    });

    // Listen for new messages
    socket.on(`user:${user.id}:new-message`, (data) => {
      console.log('[Messages] New message received:', data);
      
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
          console.log('[Messages] Failed to play notification sound:', err);
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unregister-user', { userId: user.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, selectedUserId, utils, isArabic]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedUserId) return;

    sendMessage.mutate({
      recipientId: selectedUserId,
      content: messageContent.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isArabic ? 'الرسائل' : 'Messages'}
        </h1>
        <p className="text-muted-foreground">
          {isArabic 
            ? `مراسلة آمنة مع ${user?.role === "patient" ? "أطبائك" : "مرضاك"}`
            : `Secure messaging with your ${user?.role === "patient" ? "doctors" : "patients"}`
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">
            {isArabic ? 'المحادثات' : 'Conversations'}
          </h2>
          
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversationsError ? (
            <div className="text-center py-8 text-red-600 text-sm">
              <p className="font-semibold">Error loading conversations:</p>
              <p className="text-xs mt-2">{conversationsError.message}</p>
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {isArabic ? 'لا توجد محادثات بعد' : 'No conversations yet'}
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const otherUser = conv.otherUser;
                if (!otherUser) return null;

                const isSelected = selectedUserId === otherUser.id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={otherUser.id}
                    onClick={() => setSelectedUserId(otherUser.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-medium truncate ${hasUnread ? "font-bold" : ""}`}>
                            {otherUser.displayName || otherUser.name || otherUser.phoneNumber || otherUser.email || `User ${otherUser.id}`}
                          </span>
                          {hasUnread && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        {otherUser.specialty && (
                          <p className="text-xs text-muted-foreground truncate">
                            {otherUser.specialty}
                          </p>
                        )}
                        
                        {conv.latestMessage && (
                          <p className={`text-xs truncate mt-1 ${
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}>
                            {conv.latestMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Messages Area */}
        <Card className="md:col-span-2 flex flex-col">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {isArabic ? 'اختر محادثة لبدء المراسلة' : 'Select a conversation to start messaging'}
            </div>
          ) : (
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {isArabic ? 'لا توجد رسائل بعد. ابدأ المحادثة!' : 'No messages yet. Start the conversation!'}
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
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isSentByMe
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isSentByMe && message.read && " • Read"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={isArabic ? 'اكتب رسالتك...' : 'Type your message...'}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendMessage.isPending}
                    size="icon"
                    className="h-auto"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isArabic 
                    ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد'
                    : 'Press Enter to send, Shift+Enter for new line'
                  }
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  return (
    <PatientLayout title={isArabic ? 'الرسائل' : 'Messages'}>
      <MessagesContent />
    </PatientLayout>
  );
}
