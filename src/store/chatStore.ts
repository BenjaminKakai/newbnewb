import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  name: string;
  phone_number?: string;
  email?: string;
  is_blocked: boolean;
  is_favourite: boolean;
  is_reported: boolean;
  is_muted: boolean;
  is_archived: boolean;
  contact: {
    id: string;
    phone_number: string;
    email?: string;
    profile_picture?: string;
    about?: string;
  };
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  displayMessage?: string;
  type: "TEXT" | "PAYMENT" | "IMAGE" | "FILE" | "VOICE";
  sentAt: string | Date;
  status?: "sending" | "delivered" | "read" | "failed";
  starred?: boolean;
  deleted?: boolean;
  isPayment?: boolean;
  paymentDirection?: "sent" | "received";
  paymentAmount?: number;
  clientMessageId?: string;
}

interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string;
  members?: Array<{ 
    id: string; 
    name: string; 
    avatar?: string; 
    isOnline?: boolean; 
    lastSeen?: string;
    role?: "admin" | "member";
  }>;
  participants?: string[];
  lastMessage?: string | { content: string; isPayment: boolean };
  lastMessageAt?: string | Date;
  archived?: boolean;
  description?: string;
  avatarUrl?: string;
  unreadCount?: number;
  isTyping?: boolean;
  typingUsers?: string[];
  messages?: Message[]; // Add messages array to conversation
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ChatState {
  // Connection state
  isConnected: boolean;
  connectionStatus: string;
  
  // Current user
  currentUser: { id: string; name?: string } | null;
  
  // Loading states
  isLoadingContacts: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  
  // Contacts
  contacts: Contact[];
  contactsMap: Map<string, Contact>;
  
  // Conversations
  conversations: Conversation[];
  archivedConversations: Conversation[];
  currentConversation: Conversation | null;
  currentTab: "all" | "unread" | "groups" | "archived" | "starred";
  
  // Messages
  messages: Map<string, Message[]>;
  starredMessages: Message[];
  starredMessageIds: Set<string>;
  
  // UI state
  messageInput: string;
  searchQuery: string;
  typingUsers: Set<string>;
  conversationTypingUsers: Map<string, Set<string>>;
  toasts: ToastMessage[];
  
  // Modals
  showNewChatModal: boolean;
  showGroupInfoModal: boolean;
  showAddMembersModal: boolean;
  showEmojiPicker: boolean;
  showWalletModal: boolean;
  showUserInfoModal: boolean;
  
  // Form states
  newChatType: "DIRECT" | "GROUP";
  directChatUserId: string;
  groupChatName: string;
  groupChatMembers: string;
  addMembersInput: string;
}

interface ChatActions {
  // Connection actions
  setConnectionStatus: (status: string) => void;
  setIsConnected: (connected: boolean) => void;
  
  // Current user actions
  setCurrentUser: (user: { id: string; name?: string } | null) => void;
  
  // Loading actions
  setIsLoadingContacts: (loading: boolean) => void;
  setIsLoadingConversations: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  
  // Contact actions
  setContacts: (contacts: Contact[]) => void;
  setContactsMap: (map: Map<string, Contact>) => void;
  
  // Conversation actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  moveConversationToTop: (conversationId: string) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setCurrentTab: (tab: "all" | "unread" | "groups" | "archived" | "starred") => void;
  markConversationAsRead: (conversationId: string) => void;
  
  // Message actions
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  updateMessageStatus: (clientMessageId: string, messageId: string, status: Message['status']) => void;
  toggleStarMessage: (messageId: string) => void;
  loadStarredMessages: () => void;
  saveStarredMessages: () => void;
  
  // UI actions
  setMessageInput: (input: string) => void;
  setSearchQuery: (query: string) => void;
  setTypingUsers: (users: Set<string>) => void;
  updateConversationTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  
  // Toast actions
  showToast: (message: string, type?: "success" | "error" | "warning" | "info") => void;
  removeToast: (id: string) => void;
  
  // Modal actions
  setShowNewChatModal: (show: boolean) => void;
  setShowGroupInfoModal: (show: boolean) => void;
  setShowAddMembersModal: (show: boolean) => void;
  setShowEmojiPicker: (show: boolean) => void;
  setShowWalletModal: (show: boolean) => void;
  setShowUserInfoModal: (show: boolean) => void;
  
  // Form actions
  setNewChatType: (type: "DIRECT" | "GROUP") => void;
  setDirectChatUserId: (userId: string) => void;
  setGroupChatName: (name: string) => void;
  setGroupChatMembers: (members: string) => void;
  setAddMembersInput: (input: string) => void;
  
  // Helper actions
  getContactName: (userId: string, currentUserId?: string) => string;
  getContactAvatar: (userId: string) => string;
  getConversationDisplayName: (conversation: Conversation, currentUserId?: string) => string;
  getFilteredConversations: () => Conversation[];
}

type ChatStore = ChatState & ChatActions;

// Helper function to load starred messages from localStorage
const loadStarredMessagesFromStorage = (): Set<string> => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('starred-messages');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    }
  } catch (error) {
    console.error('Failed to load starred messages from storage:', error);
  }
  return new Set();
};

// Helper function to save starred messages to localStorage
const saveStarredMessagesToStorage = (starredIds: Set<string>) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('starred-messages', JSON.stringify(Array.from(starredIds)));
    }
  } catch (error) {
    console.error('Failed to save starred messages to storage:', error);
  }
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isConnected: false,
      connectionStatus: "Disconnected",
      currentUser: null,
      isLoadingContacts: false,
      isLoadingConversations: false,
      isLoadingMessages: false,
      contacts: [],
      contactsMap: new Map(),
      conversations: [],
      archivedConversations: [],
      currentConversation: null,
      currentTab: "all",
      messages: new Map(),
      starredMessages: [],
      starredMessageIds: loadStarredMessagesFromStorage(), // Load from storage on init
      messageInput: "",
      searchQuery: "",
      typingUsers: new Set(),
      conversationTypingUsers: new Map(),
      toasts: [],
      showNewChatModal: false,
      showGroupInfoModal: false,
      showAddMembersModal: false,
      showEmojiPicker: false,
      showWalletModal: false,
      showUserInfoModal: false,
      newChatType: "DIRECT",
      directChatUserId: "",
      groupChatName: "",
      groupChatMembers: "",
      addMembersInput: "",

      // Connection actions
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setIsConnected: (connected) => set({ isConnected: connected }),

      // Current user actions
      setCurrentUser: (user) => set({ currentUser: user }),

      // Loading actions
      setIsLoadingContacts: (loading) => set({ isLoadingContacts: loading }),
      setIsLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
      setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

      // Contact actions
      setContacts: (contacts) => set({ contacts }),
      setContactsMap: (map) => set({ contactsMap: map }),

      // Conversation actions
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations]
      })),
      updateConversation: (conversationId, updates) => set((state) => ({
        conversations: state.conversations.map(conv => 
          conv.id === conversationId ? { ...conv, ...updates } : conv
        )
      })),
      
      moveConversationToTop: (conversationId) => set((state) => {
        const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
        if (conversationIndex > 0) { // Only move if not already at top
          const updatedConversations = [...state.conversations];
          const [conversation] = updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);
          
          console.log(`[STORE] Moved conversation ${conversationId} to top`);
          return { conversations: updatedConversations };
        }
        return {}; // No change needed
      }),
      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      markConversationAsRead: (conversationId) => set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      })),

      // Message actions
      setMessages: (conversationId, messages) => set((state) => {
        const newMessages = new Map(state.messages);
        
        // Update starred status for messages based on starredMessageIds
        const updatedMessages = messages.map(msg => ({
          ...msg,
          starred: state.starredMessageIds.has(msg.id)
        }));
        
        newMessages.set(conversationId, updatedMessages);
        console.log(`[STORE] Set ${updatedMessages.length} messages for conversation ${conversationId}`);
        
        return { messages: newMessages, isLoadingMessages: false };
      }),
      
      addMessage: (message) => set((state) => {
        const newMessages = new Map(state.messages);
        const convMessages = newMessages.get(message.conversationId) || [];
        
        // Set starred status based on starredMessageIds
        const messageWithStarred = {
          ...message,
          starred: state.starredMessageIds.has(message.id)
        };
        
        // Check if message already exists to prevent duplicates
        const existingMessageIndex = convMessages.findIndex(m => m.id === message.id);
        if (existingMessageIndex >= 0) {
          // Update existing message
          const updatedMessages = [...convMessages];
          updatedMessages[existingMessageIndex] = messageWithStarred;
          newMessages.set(message.conversationId, updatedMessages);
        } else {
          // Add new message
          newMessages.set(message.conversationId, [...convMessages, messageWithStarred]);
        }
        
        // Update the conversation's last message and move it to top
        const updatedConversations = [...state.conversations];
        const conversationIndex = updatedConversations.findIndex(conv => conv.id === message.conversationId);
        
        if (conversationIndex >= 0) {
          const conversation = updatedConversations[conversationIndex];
          
          // Format message for display in room list
          let displayMessage = message.content || "Message";
          if (message.type === "PAYMENT") {
            displayMessage = "💰 Payment";
          } else if (message.type === "IMAGE") {
            displayMessage = "📷 Photo";
          } else if (message.type === "FILE") {
            displayMessage = "📄 File";
          } else if (message.type === "VOICE") {
            displayMessage = "🎤 Voice message";
          } else if (displayMessage.length > 50) {
            displayMessage = displayMessage.substring(0, 50) + "...";
          }
          
          // Update conversation with new last message info
          const updatedConversation = {
            ...conversation,
            lastMessage: displayMessage,
            lastMessageAt: message.sentAt,
          };
          
          // Remove conversation from current position and add to top
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(updatedConversation);
          
          console.log(`[STORE] Updated conversation ${message.conversationId} lastMessage: "${displayMessage}"`);
        }
        
        console.log(`[STORE] Added/updated message ${message.id} in conversation ${message.conversationId}`);
        
        return { 
          messages: newMessages,
          conversations: updatedConversations
        };
      }),
      
      updateMessage: (messageId, updates) => set((state) => {
        const newMessages = new Map(state.messages);
        for (const [convId, msgs] of newMessages.entries()) {
          const updatedMsgs = msgs.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );
          newMessages.set(convId, updatedMsgs);
        }
        return { messages: newMessages };
      }),
      
      updateMessageStatus: (clientMessageId, messageId, status) => set((state) => {
        const newMessages = new Map(state.messages);
        let updatedMessage = null;
        let conversationId = null;
        
        for (const [convId, msgs] of newMessages.entries()) {
          const updatedMsgs = msgs.map(msg => {
            if (msg.id === clientMessageId || msg.clientMessageId === clientMessageId) {
              updatedMessage = { ...msg, id: messageId, status };
              conversationId = convId;
              return updatedMessage;
            }
            return msg;
          });
          newMessages.set(convId, updatedMsgs);
        }
        
        // Update conversation's last message if this was the most recent message
        let updatedConversations = state.conversations;
        if (updatedMessage && conversationId) {
          const conversation = state.conversations.find(conv => conv.id === conversationId);
          if (conversation) {
            const conversationMessages = newMessages.get(conversationId) || [];
            const isLatestMessage = conversationMessages[conversationMessages.length - 1]?.id === messageId;
            
            if (isLatestMessage) {
              // Format message for display in room list
              let displayMessage = updatedMessage.content || "Message";
              if (updatedMessage.type === "PAYMENT") {
                displayMessage = "💰 Payment";
              } else if (updatedMessage.type === "IMAGE") {
                displayMessage = "📷 Photo";
              } else if (updatedMessage.type === "FILE") {
                displayMessage = "📄 File";
              } else if (updatedMessage.type === "VOICE") {
                displayMessage = "🎤 Voice message";
              } else if (displayMessage.length > 50) {
                displayMessage = displayMessage.substring(0, 50) + "...";
              }
              
              updatedConversations = state.conversations.map(conv =>
                conv.id === conversationId
                  ? { 
                      ...conv, 
                      lastMessage: displayMessage,
                      lastMessageAt: updatedMessage.sentAt
                    }
                  : conv
              );
              
              console.log(`[STORE] Updated conversation ${conversationId} lastMessage on status change: "${displayMessage}"`);
            }
          }
        }
        
        console.log(`[STORE] Updated message status: ${clientMessageId} -> ${messageId} (${status})`);
        
        return { 
          messages: newMessages,
          conversations: updatedConversations
        };
      }),
      
      toggleStarMessage: (messageId) => set((state) => {
        const newStarredIds = new Set(state.starredMessageIds);
        const isCurrentlyStarred = newStarredIds.has(messageId);
        
        if (isCurrentlyStarred) {
          newStarredIds.delete(messageId);
        } else {
          newStarredIds.add(messageId);
        }
        
        console.log(`[STORE] ${isCurrentlyStarred ? 'Unstarring' : 'Starring'} message ${messageId}`);
        
        // Update the actual message objects
        const newMessages = new Map(state.messages);
        let messageFound = false;
        
        for (const [convId, msgs] of newMessages.entries()) {
          const updatedMsgs = msgs.map(msg => {
            if (msg.id === messageId) {
              messageFound = true;
              return { ...msg, starred: !isCurrentlyStarred };
            }
            return msg;
          });
          if (messageFound) {
            newMessages.set(convId, updatedMsgs);
            break; // Exit early since we found the message
          }
        }
        
        // Save to localStorage asynchronously to prevent blocking
        setTimeout(() => {
          saveStarredMessagesToStorage(newStarredIds);
        }, 0);
        
        return { 
          starredMessageIds: newStarredIds,
          messages: newMessages
        };
      }),
      
      loadStarredMessages: () => {
        const state = get();
        const starredIds = loadStarredMessagesFromStorage();
        
        // Only update if the starred IDs have actually changed
        const currentIds = state.starredMessageIds;
        const idsChanged = starredIds.size !== currentIds.size || 
          Array.from(starredIds).some(id => !currentIds.has(id));
        
        if (!idsChanged) {
          console.log('[STORE] Starred IDs unchanged, skipping update');
          return;
        }
        
        console.log('[STORE] Loading starred messages from storage, count:', starredIds.size);
        
        // Update message objects to reflect loaded starred status
        const newMessages = new Map(state.messages);
        let messagesChanged = false;
        
        for (const [convId, msgs] of newMessages.entries()) {
          const updatedMsgs = msgs.map(msg => {
            const shouldBeStarred = starredIds.has(msg.id);
            if (msg.starred !== shouldBeStarred) {
              messagesChanged = true;
              return { ...msg, starred: shouldBeStarred };
            }
            return msg;
          });
          newMessages.set(convId, updatedMsgs);
        }
        
        // Only update state if something actually changed
        if (idsChanged || messagesChanged) {
          set({ 
            starredMessageIds: starredIds,
            ...(messagesChanged ? { messages: newMessages } : {})
          });
        }
      },
      
      saveStarredMessages: () => {
        try {
          const state = get();
          console.log('[STORE] Saving starred messages to localStorage, count:', state.starredMessageIds.size);
          saveStarredMessagesToStorage(state.starredMessageIds);
        } catch (error) {
          console.error('[STORE] Failed to save starred messages:', error);
        }
      },

      // UI actions
      setMessageInput: (input) => set({ messageInput: input }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setTypingUsers: (users) => set({ typingUsers: users }),
      updateConversationTyping: (conversationId, userId, isTyping) => set((state) => {
        const newMap = new Map(state.conversationTypingUsers);
        const convTypingUsers = newMap.get(conversationId) || new Set();
        
        if (isTyping) {
          convTypingUsers.add(userId);
        } else {
          convTypingUsers.delete(userId);
        }
        
        newMap.set(conversationId, convTypingUsers);
        return { conversationTypingUsers: newMap };
      }),

      // Toast actions
      showToast: (message, type = "info") => set((state) => {
        const id = Date.now().toString();
        const newToast: ToastMessage = { id, message, type };
        return { toasts: [...state.toasts, newToast] };
      }),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(toast => toast.id !== id)
      })),

      // Modal actions
      setShowNewChatModal: (show) => set({ showNewChatModal: show }),
      setShowGroupInfoModal: (show) => set({ showGroupInfoModal: show }),
      setShowAddMembersModal: (show) => set({ showAddMembersModal: show }),
      setShowEmojiPicker: (show) => set({ showEmojiPicker: show }),
      setShowWalletModal: (show) => set({ showWalletModal: show }),
      setShowUserInfoModal: (show) => set({ showUserInfoModal: show }),

      // Form actions
      setNewChatType: (type) => set({ newChatType: type }),
      setDirectChatUserId: (userId) => set({ directChatUserId: userId }),
      setGroupChatName: (name) => set({ groupChatName: name }),
      setGroupChatMembers: (members) => set({ groupChatMembers: members }),
      setAddMembersInput: (input) => set({ addMembersInput: input }),

      // Helper actions
      getContactName: (userId, currentUserId) => {
        const state = get();
        if (userId === currentUserId) return "You";
        
        const contact = state.contactsMap.get(userId);
        if (contact?.name) return contact.name;
        
        const alternativeContact = state.contacts.find(c => 
          c.contact_id === userId || c.id === userId || c.user_id === userId
        );
        
        if (alternativeContact) return alternativeContact.name;
        return `User ${userId.slice(-6)}`;
      },

      getContactAvatar: (userId) => {
        const state = get();
        const contact = state.contactsMap.get(userId);
        if (contact?.contact?.profile_picture) {
          return contact.contact.profile_picture;
        }
        
        // Return null when no profile picture is available
        // This allows the UI to show initials instead
        return null;
      },

      getConversationDisplayName: (conversation, currentUserId) => {
        const state = get();
        
        if (conversation.type === "GROUP") {
          return conversation.name || "Group Chat";
        }
        
        // For DIRECT conversations, find the OTHER user
        if (conversation.members && conversation.members.length > 0) {
          const otherMember = conversation.members.find(member => member.id !== currentUserId);
          if (otherMember) {
            return state.getContactName(otherMember.id, currentUserId);
          }
        }
        
        if (conversation.participants && conversation.participants.length > 0) {
          const otherParticipant = conversation.participants.find(id => id !== currentUserId);
          if (otherParticipant) {
            return state.getContactName(otherParticipant, currentUserId);
          }
        }
        
        return "Direct Chat";
      },

      getFilteredConversations: () => {
        const state = get();
        switch (state.currentTab) {
          case "unread":
            return state.conversations.filter(conv => conv.unreadCount && conv.unreadCount > 0);
          case "groups":
            return state.conversations.filter(conv => conv.type === "GROUP");
          case "archived":
            return state.archivedConversations;
          default:
            return state.conversations;
        }
      },
    }),
    {
      name: 'chat-store',
    }
  )
);