import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";

interface ChatSocketOptions {
  serverUrl: string;
  accessToken: string;
  userId: string;
}

// Define interfaces for all data structures
interface SocketUser {
  id?: string;
  userId?: string;
  user_id?: string;
  username?: string;
  name?: string;
}

interface SocketMember {
  id: string;
  userId?: string;
  user_id?: string;
  conversationId: string;
  role: string;
  isMuted?: boolean;
  joinedAt?: string;
}

interface SocketMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  sender?: SocketUser;
  senderName?: string;
  content: string;
  displayMessage?: string;
  type: string;
  sentAt?: string;
  createdAt?: string;
  status?: string;
  paymentDirection?: string;
  paymentAmount?: number;
  starred?: boolean;
  deleted?: boolean;
}

interface SocketConversation {
  id: string;
  type?: string;
  unreadCount?: number;
  members?: SocketMember[];
  participants?: string[];
  messages?: SocketMessage[];
  lastMessage?: string;
  lastMessageAt?: string;
}

interface ConversationCreatedData {
  conversation: SocketConversation;
  isExisting?: boolean;
}

interface NewConversationData {
  conversation: SocketConversation;
}

interface ConversationsListData {
  conversations: SocketConversation[];
}

interface ConversationMessagesData {
  conversationId: string;
  messages: SocketMessage[];
}

interface MessageDeliveredData {
  clientMessageId: string;
  messageId: string;
}

interface MessageFailedData {
  clientMessageId: string;
  error: string;
}

interface TypingIndicatorData {
  conversationId: string;
  isTyping: boolean;
  userName?: string;
  userId?: string;
  user?: SocketUser;
  senderId?: string;
}

interface MessageStarredData {
  messageId: string;
  starred: boolean;
}

interface UserOnlineData {
  userId: string;
}

interface UserOfflineData {
  userId: string;
  lastSeen?: string;
}

interface WelcomeData {
  userId: string;
  username?: string;
  name?: string;
}

interface ErrorData {
  message: string;
}

class ChatSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private presenceInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.socket = null;
  }

  connect(options: ChatSocketOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[CHAT SOCKET] Connecting to ${options.serverUrl} with user: ${options.userId}`);

        this.socket = io(options.serverUrl, {
          auth: {
            token: options.accessToken,
          },
          transports: ["websocket", "polling"],
          upgrade: true,
          secure: options.serverUrl.startsWith("https"),
          forceNew: true,
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.setupEventHandlers();

        this.socket.on("connect", () => {
          console.log("[CHAT SOCKET] Connected successfully");
          this.reconnectAttempts = 0;
          useChatStore.getState().setIsConnected(true);
          useChatStore.getState().setConnectionStatus("Connected");
          useChatStore.getState().showToast("Connected to chat server!", "success");
          this.startPresencePing();
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.log(`[CHAT SOCKET] Connection error: ${error.message}`);
          useChatStore.getState().setIsConnected(false);
          useChatStore.getState().setConnectionStatus("Connection Failed");
          
          let errorMessage = "Connection failed";
          if (error.message.includes("Authentication") || error.message.includes("401")) {
            errorMessage = "Authentication failed - check your token";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Connection timeout - check server status";
          } else if (error.message.includes("ECONNREFUSED")) {
            errorMessage = "Connection refused - is the server running?";
          }

          useChatStore.getState().showToast(errorMessage, "error");
          reject(error);
        });

      } catch (error) {
        console.log(`[CHAT SOCKET] Setup failed: ${error}`);
        useChatStore.getState().showToast("Failed to connect to chat server", "error");
        reject(error);
      }
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("disconnect", (reason) => {
      console.log(`[CHAT SOCKET] Disconnected: ${reason}`);
      useChatStore.getState().setIsConnected(false);
      useChatStore.getState().setConnectionStatus("Disconnected");
      useChatStore.getState().showToast("Disconnected from chat server", "error");
      this.stopPresencePing();
      this.clearAllTypingIndicators(); // Clear typing indicators on disconnect
    });

    // Welcome event
    this.socket.on("welcome", (data: WelcomeData) => {
      console.log(`[CHAT SOCKET] Welcome received: ${JSON.stringify(data)}`);
      if (data && data.userId) {
        console.log(`[CHAT SOCKET] Current user confirmed: ${data.userId}`);
        
        // Set current user in store
        const store = useChatStore.getState();
        store.setCurrentUser({
          id: data.userId,
          name: data.username || data.name || data.userId
        });
        
        setTimeout(() => {
          this.requestConversationsList();
        }, 500);
      }
    });

    // Chat events
    this.socket.on("CONVERSATION_CREATED", this.handleConversationCreated.bind(this));
    this.socket.on("NEW_CONVERSATION", this.handleNewConversation.bind(this));
    this.socket.on("CONVERSATIONS_LIST", this.handleConversationsList.bind(this));
    this.socket.on("CONVERSATION_MESSAGES", this.handleConversationMessages.bind(this));
    this.socket.on("NEW_MESSAGE", this.handleNewMessage.bind(this));
    this.socket.on("MESSAGE_DELIVERED", this.handleMessageDelivered.bind(this));
    this.socket.on("MESSAGE_FAILED", this.handleMessageFailed.bind(this));
    this.socket.on("TYPING_INDICATOR", this.handleTypingIndicator.bind(this));
    this.socket.on("MESSAGE_STARRED", this.handleMessageStarred.bind(this));
    this.socket.on("USER_ONLINE", this.handleUserOnline.bind(this));
    this.socket.on("USER_OFFLINE", this.handleUserOffline.bind(this));

    // Error events
    this.socket.on("ERROR", (data: ErrorData) => {
      console.log(`[CHAT SOCKET] Socket error: ${data.message}`);
      useChatStore.getState().showToast(`Error: ${data.message}`, "error");
      
      // Reset loading states on error
      useChatStore.getState().setIsLoadingConversations(false);
      useChatStore.getState().setIsLoadingMessages(false);
    });
  }

  // Event handlers
  private handleConversationCreated(data: ConversationCreatedData) {
    const { conversation, isExisting } = data;
    if (conversation) {
      const store = useChatStore.getState();
      
      // Process conversation data similar to the original implementation
      const processedConversation = this.processConversationData(conversation);
      
      // Check if conversation already exists
      const existingConv = store.conversations.find(c => c.id === conversation.id);
      if (existingConv) {
        store.updateConversation(conversation.id, processedConversation);
      } else {
        store.addConversation(processedConversation);
      }
      
      store.setCurrentConversation(processedConversation);
      store.showToast(isExisting ? "Found existing conversation" : "Conversation created!", "success");
    }
  }

  private handleNewConversation(data: NewConversationData) {
    const { conversation } = data;
    if (conversation) {
      const store = useChatStore.getState();
      const processedConversation = this.processConversationData(conversation);
      
      const existingConv = store.conversations.find(c => c.id === conversation.id);
      if (!existingConv) {
        store.addConversation(processedConversation);
        store.showToast("New conversation added", "info");
      }
    }
  }

  private handleConversationsList(data: ConversationsListData) {
    const { conversations: convs } = data;
    console.log(`[CHAT SOCKET] Setting ${convs?.length || 0} conversations`);
    
    const store = useChatStore.getState();
    const enhancedConversations = (convs || []).map((conv: SocketConversation) => 
      this.processConversationData(conv)
    );
    
    store.setConversations(enhancedConversations);
    store.setIsLoadingConversations(false); // Reset loading state
    
    if (enhancedConversations && enhancedConversations.length > 0) {
      store.showToast(`Loaded ${enhancedConversations.length} conversations`, "success");
    }
  }

  private handleConversationMessages(data: ConversationMessagesData) {
    const { conversationId, messages: msgs } = data;
    const messageList = msgs || [];
    
    console.log(`[CHAT SOCKET] Received ${messageList.length} messages for conversation ${conversationId}`);
    
    const store = useChatStore.getState();
    
    // Process messages with proper sender names
    const processedMessages = messageList.map((msg: SocketMessage) => {
      const senderId = msg.senderId || msg.sender?.userId || msg.sender?.id;
      return {
        ...msg,
        senderId,
        senderName: store.getContactName(senderId) || msg.senderName || msg.sender?.username || "Unknown",
        sentAt: msg.sentAt || msg.createdAt || new Date(),
        status: msg.status || "delivered",
      };
    });
    
    store.setMessages(conversationId, processedMessages);

    // Update starred messages
    processedMessages.forEach((msg: SocketMessage) => {
      if (msg.starred) {
        store.toggleStarMessage(msg.id);
      }
    });

    // Mark conversation as read if it's the current one
    if (store.currentConversation?.id === conversationId) {
      store.markConversationAsRead(conversationId);
    }
    
    console.log(`[CHAT SOCKET] Messages loaded and stored for conversation ${conversationId}`);
  }

  private handleNewMessage(data: SocketMessage) {
    const store = useChatStore.getState();
    const senderId = data.senderId || data.sender?.userId || data.sender?.id || data.sender?.user_id;
    
    const message = {
      id: data.id,
      conversationId: data.conversationId,
      senderId: senderId,
      senderName: store.getContactName(senderId) || data.senderName || data.sender?.username || "Unknown",
      content: data.content,
      displayMessage: data.displayMessage || data.content,
      type: data.type,
      sentAt: data.sentAt || new Date(),
      status: "received" as const,
      paymentDirection: data.paymentDirection,
      paymentAmount: data.paymentAmount,
      starred: data.starred || false,
      deleted: data.deleted || false,
      isPayment: data.type === "PAYMENT",
    };

    store.addMessage(message);
    this.updateConversationLastMessage(message.conversationId, message);

    // Update unread count if not current conversation
    if (store.currentConversation?.id !== message.conversationId) {
      store.updateConversation(message.conversationId, {
        unreadCount: (store.conversations.find(c => c.id === message.conversationId)?.unreadCount || 0) + 1
      });
    }

    // Mark as read if current conversation
    if (store.currentConversation?.id === message.conversationId) {
      store.markConversationAsRead(message.conversationId);
    }

    // Send acknowledgments (don't ack our own messages)
    if (senderId !== store.currentUser?.id) {
      this.emit("ACK_DELIVERED", { messageId: message.id });
      setTimeout(() => {
        this.emit("ACK_READ", { messageId: message.id });
      }, 1000);
    }
  }

  private handleMessageDelivered(data: MessageDeliveredData) {
    const { clientMessageId, messageId } = data;
    const store = useChatStore.getState();
    store.updateMessageStatus(clientMessageId, messageId, "delivered");
  }

  private handleMessageFailed(data: MessageFailedData) {
    const { clientMessageId, error } = data;
    const store = useChatStore.getState();
    store.updateMessageStatus(clientMessageId, clientMessageId, "failed");
    store.showToast(`Message failed: ${error}`, "error");
  }

  private handleTypingIndicator(data: TypingIndicatorData) {
    const { conversationId, isTyping, userName } = data;
    const userId = data.userId || data.user?.userId || data.user?.id || data.user?.user_id || data.senderId;
    const store = useChatStore.getState();
    
    // Don't show typing indicator for current user
    if (userId === store.currentUser?.id) {
      console.log(`[TYPING] Ignoring own typing indicator from ${userId}`);
      return;
    }
    
    const displayName = store.getContactName(userId) || userName || data.user?.name || data.user?.username || userId;
    
    console.log(`[TYPING] ${displayName} (${userId}) is ${isTyping ? 'typing' : 'stopped typing'} in ${conversationId}`);
    
    store.updateConversationTyping(conversationId, displayName, isTyping);

    // Update current conversation typing users if it's the active conversation
    if (store.currentConversation?.id === conversationId) {
      const currentTyping = new Set(store.typingUsers);
      if (isTyping) {
        currentTyping.add(displayName);
      } else {
        currentTyping.delete(displayName);
      }
      store.setTypingUsers(currentTyping);
      console.log(`[TYPING] Updated current conversation typing users:`, Array.from(currentTyping));
    }
  }

  private handleMessageStarred(data: MessageStarredData) {
    const { messageId, starred } = data;
    const store = useChatStore.getState();
    
    if (starred) {
      store.toggleStarMessage(messageId);
    } else {
      store.toggleStarMessage(messageId);
    }
    
    store.updateMessage(messageId, { starred });
  }

  private handleUserOnline(data: UserOnlineData) {
    const { userId } = data;
    const store = useChatStore.getState();
    
    // Update user online status in conversations
    store.conversations.forEach(conv => {
      if (conv.members) {
        const member = conv.members.find(m => m.id === userId);
        if (member) {
          store.updateConversation(conv.id, {
            members: conv.members.map(m => 
              m.id === userId ? { ...m, isOnline: true } : m
            )
          });
        }
      }
    });
  }

  private handleUserOffline(data: UserOfflineData) {
    const { userId, lastSeen } = data;
    const store = useChatStore.getState();
    
    // Update user offline status in conversations
    store.conversations.forEach(conv => {
      if (conv.members) {
        const member = conv.members.find(m => m.id === userId);
        if (member) {
          store.updateConversation(conv.id, {
            members: conv.members.map(m => 
              m.id === userId ? { ...m, isOnline: false, lastSeen } : m
            )
          });
        }
      }
    });
  }

  // Helper methods
  private processConversationData(conv: SocketConversation) {
    const store = useChatStore.getState();
    
    const processedMembers = conv.members?.map((member: SocketMember) => {
      const memberUserId = member.userId || member.user_id;
      const memberName = store.getContactName(memberUserId);
      const memberAvatar = store.getContactAvatar(memberUserId);
      
      return {
        id: memberUserId,
        membershipId: member.id,
        conversationId: member.conversationId,
        role: member.role,
        name: memberName,
        avatar: memberAvatar,
        isOnline: Math.random() > 0.5, // TODO: Get real online status
        lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        isMuted: member.isMuted,
        joinedAt: member.joinedAt,
      };
    }) || [];
    
    let processedParticipants = conv.participants || [];
    if (conv.type === "DIRECT" && conv.members && conv.members.length > 0) {
      processedParticipants = conv.members.map((member: SocketMember) => member.userId || member.user_id);
    }
    
    // Process messages if they exist in the conversation
    let processedMessages: unknown[] = [];
    if (conv.messages && conv.messages.length > 0) {
      processedMessages = conv.messages.map((msg: SocketMessage) => {
        const senderId = msg.senderId || msg.sender?.userId || msg.sender?.id || msg.sender?.user_id;
        return {
          ...msg,
          senderId,
          senderName: store.getContactName(senderId) || msg.senderName || msg.sender?.username || "Unknown",
          sentAt: msg.sentAt || msg.createdAt || new Date(),
          status: msg.status || "delivered",
        };
      });
    }
    
    return {
      ...conv,
      unreadCount: conv.unreadCount || 0, // Use actual unread count from server
      isTyping: false,
      typingUsers: [],
      members: processedMembers,
      participants: processedParticipants,
      messages: processedMessages // Include processed messages
    };
  }

  private updateConversationLastMessage(conversationId: string, message: SocketMessage) {
    const store = useChatStore.getState();
    store.updateConversation(conversationId, {
      lastMessage: message.type === "PAYMENT"
        ? { content: message.displayMessage || message.content, isPayment: true }
        : message.content,
      lastMessageAt: message.sentAt,
    });
  }

  private startPresencePing() {
    this.presenceInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("PRESENCE_PING");
      } else {
        this.stopPresencePing();
      }
    }, 30000);
  }

  private stopPresencePing() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }

  // Public methods
  requestConversationsList() {
    if (this.socket && this.socket.connected) {
      console.log("[CHAT SOCKET] Requesting conversations list...");
      const store = useChatStore.getState();
      store.setIsLoadingConversations(true);
      this.socket.emit("REQUEST_CONVERSATIONS_LIST", {
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn("[CHAT SOCKET] Cannot request conversations - socket not connected");
      useChatStore.getState().setIsLoadingConversations(false);
    }
  }

  loadConversationMessages(conversationId: string) {
    if (this.socket && this.socket.connected) {
      console.log(`[CHAT SOCKET] Loading messages for conversation ${conversationId}`);
      const store = useChatStore.getState();
      store.setIsLoadingMessages(true);
      this.socket.emit("REQUEST_CONVERSATION_MESSAGES", {
        conversationId: conversationId,
        limit: 50,
        offset: 0,
      });
    } else {
      console.warn("[CHAT SOCKET] Cannot load messages - socket not connected");
      useChatStore.getState().setIsLoadingMessages(false);
    }
  }

  // Typing indicator methods
  startTyping(conversationId: string) {
    this.sendTyping(conversationId, true);
  }

  stopTyping(conversationId: string) {
    this.sendTyping(conversationId, false);
  }

  // Clear all typing indicators (useful when disconnecting)
  clearAllTypingIndicators() {
    const store = useChatStore.getState();
    store.setTypingUsers(new Set());
    // Clear conversation typing users
    store.conversations.forEach(conv => {
      const typingUsers = store.conversationTypingUsers.get(conv.id);
      if (typingUsers && typingUsers.size > 0) {
        typingUsers.clear();
      }
    });
  }

  createConversation(data: Record<string, unknown>) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("CREATE_CONVERSATION", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sendMessage(messageData: Record<string, unknown>) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("SEND_MESSAGE", messageData);
    }
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket && this.socket.connected) {
      console.log(`[SOCKET] Sending typing indicator: ${isTyping} for conversation ${conversationId}`);
      this.socket.emit("TYPING", {
        conversationId,
        isTyping,
      });
    }
  }

  starMessage(messageId: string, starred: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("STAR_MESSAGE", {
        messageId,
        starred,
      });
    }
  }

  addMembersToGroup(conversationId: string, memberIds: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("ADD_MEMBERS_TO_GROUP", {
        conversationId,
        memberIds,
      });
    }
  }

  removeMemberFromGroup(conversationId: string, memberId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("REMOVE_MEMBER_FROM_GROUP", {
        conversationId,
        memberId,
      });
    }
  }

  exitGroup(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("EXIT_GROUP", {
        conversationId,
      });
    }
  }

  emit(event: string, data: Record<string, unknown>) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    this.stopPresencePing();
    
    // Clear typing indicators
    this.clearAllTypingIndicators();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    const store = useChatStore.getState();
    store.setIsConnected(false);
    store.setConnectionStatus("Disconnected");
    store.setCurrentUser(null);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const chatSocketService = new ChatSocketService();
export default chatSocketService;