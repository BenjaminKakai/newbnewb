// features/chat/hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import socketService from '@/services/chatSocket';

// Types
interface UseChatOptions {
  autoConnect?: boolean;
}

interface SendMessageOptions {
  type?: 'text' | 'file' | 'payment';
  file?: File;
  amount?: string;
  replyToId?: string;
}

interface ForwardMessageOptions {
  targetConversationIds?: string[];
  targetUserIds?: string[];
}

interface ReplyMessage {
  id: string;
  content: string;
  senderName: string;
  type?: string;
}

interface GroupOptions {
  name: string;
  participants: string[];
  description?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderName?: string;
  type: string;
  timestamp: string;
  senderId: string;
  isTyping?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { autoConnect = true } = options;
  
  // Get state and actions from Zustand store
  const {
    // Auth state
    user,
    accessToken,
    
    // Room state
    rooms,
    archivedRooms,
    currentRoom,
    chatHistories,
    starredMessages,
    pinnedMessages,
    isLoading,
    selectedMessages,
    activeTab,
    
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // Actions
    setCurrentRoom,
    resetUnreadCount,
    setActiveTab,
    clearSelectedMessages,
    selectMessage,
    deselectMessage,
    archiveRoom,
    pinRoom,
    blockRoom,
    starMessage,
    pinMessage,
    deleteMessage,
    markAllMessagesAsRead,
    setConnected,
    setConnecting,
    setError,
  } = useChatStore();
  
  // Local state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ReplyMessage | null>(null);
  
  // Typing timeout reference
  const typingTimeoutRef = useRef<number | null>(null);
  
  // Connect to socket
  const connect = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setError("User or access token is missing");
      return false;
    }
    
    try {
      setConnecting(true);
      console.log("Connecting to chat socket...");
      await socketService.connect(accessToken, user.id);
      setConnected(true);
      setError(null);
      
      console.log("Socket connected successfully, requesting conversations list...");
      
      // Request conversations list after connection
      setTimeout(() => {
        socketService.requestConversationsList();
      }, 1000);
      
      return true;
    } catch (err) {
      console.error("Failed to connect to chat socket:", err);
      setError("Failed to connect to chat server");
      return false;
    } finally {
      setConnecting(false);
    }
  }, [user, accessToken, setConnecting, setConnected, setError]);
  
  // Refresh rooms from server
  const refreshRooms = useCallback(() => {
    if (!user?.id || !isConnected) {
      console.log("Cannot refresh rooms: not connected or no user ID");
      return;
    }
    
    console.log("Refreshing conversations for user:", user.id);
    socketService.requestConversationsList();
  }, [user, isConnected]);
  
  // Disconnect socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setConnected(false);
  }, [setConnected]);
  
  // Switch to a room
  const switchRoom = useCallback((roomId: string) => {
    // Clear selection mode when switching rooms
    setSelectionMode(false);
    clearSelectedMessages();
    setReplyToMessage(null);
    
    // Find room in both active and archived
    const room = [...rooms, ...archivedRooms].find(r => r.id === roomId);
    if (!room) {
      console.error(`Room ${roomId} not found`);
      return;
    }
    
    console.log(`Switching to room: ${roomId}`);
    
    // If already in a room, leave it first
    if (currentRoom) {
      console.log(`Leaving current room: ${currentRoom.id}`);
      socketService.leaveConversation(currentRoom.id);
    }
    
    // Set current room in store
    setCurrentRoom(room);
    
    // Join the conversation
    socketService.joinConversation(roomId);
    
    // Request messages for this conversation
    socketService.requestConversationMessages(roomId);
    
    // Reset unread count
    resetUnreadCount(roomId);
    
    // Set messages from chat history if available
    if (chatHistories[roomId]) {
      setMessages(chatHistories[roomId]);
    } else {
      setMessages([]);
    }
    
    setIsTyping(false);
  }, [rooms, archivedRooms, currentRoom, chatHistories, setCurrentRoom, resetUnreadCount, clearSelectedMessages]);
  
  // Send a message
  const sendMessage = useCallback(async (content: string, options: SendMessageOptions = {}) => {
    if (!currentRoom) {
      setError("No active chat room");
      return false;
    }
    
    if (!content.trim() && !options.file) {
      return false;
    }
    
    try {
      const { type = 'TEXT', file, amount, replyToId } = options;
      
      // If it's a file message, upload the file first
      if (type === 'file' && file) {
        console.log("Sending file message...");
        
        // File upload logic would go here
        const success = socketService.sendMessage(currentRoom.id, `File: ${file.name}`, "FILE", { replyToId });
        return success;
      }
      
      // If it's a payment message
      if (type === 'payment' && amount) {
        console.log("Sending payment message...");
        const message = `Sent KSH ${amount}`;
        const success = socketService.sendMessage(currentRoom.id, message, "PAYMENT", { replyToId });
        return success;
      }
      
      // Regular text message
      console.log(`Sending text message to ${currentRoom.id}: ${content}`);
      const success = socketService.sendMessage(currentRoom.id, content, "TEXT", { replyToId });
      
      if (success) {
        console.log("Message sent successfully");
        // Clear reply after sending
        setReplyToMessage(null);
      } else {
        console.error("Failed to send message via socket service");
        setError("Failed to send message");
      }
      
      return success;
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
      return false;
    }
  }, [currentRoom, setError]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!currentRoom) return;
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    socketService.sendTypingIndicator(currentRoom.id, true);
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTypingIndicator(currentRoom.id, false);
      typingTimeoutRef.current = null;
    }, 3000);
  }, [currentRoom]);
  
  // Create a new chat
  const createChat = useCallback(async (recipientId: string, isGroup = false, groupOptions?: GroupOptions) => {
    if (!isConnected) {
      console.log("Not connected, attempting to connect first...");
      const connected = await connect();
      if (!connected) {
        console.error("Failed to connect before creating chat");
        return false;
      }
    }
    
    try {
      let success = false;
      
      if (isGroup) {
        // Create a group conversation
        if (!groupOptions?.name || !groupOptions?.participants || groupOptions.participants.length === 0) {
          console.error("Cannot create group chat: missing name or participants");
          setError("Missing group name or participants");
          return false;
        }
        
        console.log(`Creating group conversation "${groupOptions.name}" with participants:`, groupOptions.participants);
        success = socketService.createGroupConversation(
          groupOptions.name,
          groupOptions.participants,
          groupOptions.description
        );
      } else {
        // Create a direct conversation
        if (!recipientId) {
          console.error("Cannot create direct chat: missing recipient ID");
          setError("Missing recipient ID");
          return false;
        }
        
        console.log(`Creating direct conversation with ${recipientId}`);
        success = socketService.createDirectConversation(recipientId);
      }
      
      if (success) {
        console.log("Chat creation request sent successfully");
        setError(null);
        
        setTimeout(() => {
          console.log("Chat creation should be processed by now");
        }, 500);
      } else {
        console.error("Failed to send chat creation request");
        setError("Failed to create chat");
        return false;
      }
      
      return success;
    } catch (err) {
      console.error("Failed to create chat:", err);
      setError("Failed to create chat");
      return false;
    }
  }, [isConnected, connect, setError]);

  // ENHANCED FEATURES

  // Archive/Unarchive conversation
  const archiveConversation = useCallback((roomId: string, archived: boolean = true) => {
    if (!isConnected) {
      console.error("Cannot archive conversation: not connected");
      return false;
    }

    console.log(`${archived ? 'Archiving' : 'Unarchiving'} conversation: ${roomId}`);
    
    // Update local state immediately for responsive UI
    archiveRoom(roomId, archived);
    
    // Send to server for persistence
    return socketService.archiveConversation(roomId, archived);
  }, [isConnected, archiveRoom]);

  // Pin/Unpin conversation
  const pinConversation = useCallback((roomId: string, pinned: boolean = true) => {
    if (!isConnected) {
      console.error("Cannot pin conversation: not connected");
      return false;
    }

    console.log(`${pinned ? 'Pinning' : 'Unpinning'} conversation: ${roomId}`);
    
    // Update local state immediately for responsive UI
    pinRoom(roomId, pinned);
    
    // Send to server for persistence
    return socketService.pinConversation(roomId, pinned);
  }, [isConnected, pinRoom]);

  // Block/Unblock conversation
  const blockConversation = useCallback((roomId: string, blocked: boolean = true) => {
    if (!isConnected) {
      console.error("Cannot block conversation: not connected");
      return false;
    }

    console.log(`${blocked ? 'Blocking' : 'Unblocking'} conversation: ${roomId}`);
    
    // Update local state immediately for responsive UI
    blockRoom(roomId, blocked);
    
    // Send to server for persistence
    return socketService.blockConversation(roomId, blocked);
  }, [isConnected, blockRoom]);

  // Delete conversation
  const deleteConversation = useCallback((roomId: string) => {
    if (!isConnected) {
      console.error("Cannot delete conversation: not connected");
      return false;
    }

    console.log(`Deleting conversation: ${roomId}`);
    return socketService.deleteConversation(roomId);
  }, [isConnected]);

  // Star/Unstar message
  const starMessageAction = useCallback((messageId: string, starred: boolean = true) => {
    if (!isConnected || !currentRoom) {
      console.error("Cannot star message: not connected or no current room");
      return false;
    }

    console.log(`${starred ? 'Starring' : 'Unstarring'} message: ${messageId}`);
    
    // Update local state immediately for responsive UI
    starMessage(messageId, currentRoom.id, starred);
    
    // Send to server for persistence
    return socketService.starMessage(messageId, starred);
  }, [isConnected, currentRoom, starMessage]);

  // Pin/Unpin message
  const pinMessageAction = useCallback((messageId: string, pinned: boolean = true) => {
    if (!isConnected || !currentRoom) {
      console.error("Cannot pin message: not connected or no current room");
      return false;
    }

    console.log(`${pinned ? 'Pinning' : 'Unpinning'} message: ${messageId}`);
    
    // Update local state immediately for responsive UI
    pinMessage(messageId, currentRoom.id, pinned);
    
    // Send to server for persistence
    return socketService.pinMessage(messageId, pinned);
  }, [isConnected, currentRoom, pinMessage]);

  // Delete message
  const deleteMessageAction = useCallback((messageId: string, deleteForEveryone: boolean = false) => {
    if (!isConnected || !currentRoom) {
      console.error("Cannot delete message: not connected or no current room");
      return false;
    }

    console.log(`Deleting message: ${messageId}, deleteForEveryone: ${deleteForEveryone}`);
    
    // Update local state immediately for responsive UI
    deleteMessage(currentRoom.id, messageId, deleteForEveryone);
    
    // Send to server for persistence
    return socketService.deleteMessage(messageId, deleteForEveryone);
  }, [isConnected, currentRoom, deleteMessage]);

  // Forward message
  const forwardMessage = useCallback((messageId: string, options: ForwardMessageOptions = {}) => {
    if (!isConnected) {
      console.error("Cannot forward message: not connected");
      return false;
    }

    const { targetConversationIds = [], targetUserIds = [] } = options;
    
    if (targetConversationIds.length === 0 && targetUserIds.length === 0) {
      console.error("No targets specified for forwarding");
      return false;
    }

    console.log(`Forwarding message: ${messageId}`);
    return socketService.forwardMessage(messageId, targetConversationIds, targetUserIds);
  }, [isConnected]);

  // Mark all messages as read
  const markAllMessagesAsReadAction = useCallback((roomId?: string) => {
    const targetRoomId = roomId || currentRoom?.id;
    if (!targetRoomId) {
      console.error("No room specified for marking messages as read");
      return false;
    }

    if (!isConnected) {
      console.error("Cannot mark messages as read: not connected");
      return false;
    }

    console.log(`Marking all messages as read in room: ${targetRoomId}`);
    
    // Update local state immediately for responsive UI
    markAllMessagesAsRead(targetRoomId);
    
    // Send to server for persistence
    return socketService.markAllMessagesAsRead(targetRoomId);
  }, [isConnected, currentRoom, markAllMessagesAsRead]);

  // Get starred messages
  const getStarredMessages = useCallback((limit: number = 100, offset: number = 0) => {
    if (!isConnected) {
      console.error("Cannot get starred messages: not connected");
      return false;
    }

    console.log("Getting starred messages");
    return socketService.getStarredMessages(limit, offset);
  }, [isConnected]);

  // Get archived conversations
  const getArchivedConversations = useCallback(() => {
    if (!isConnected) {
      console.error("Cannot get archived conversations: not connected");
      return false;
    }

    console.log("Getting archived conversations");
    return socketService.getArchivedConversations();
  }, [isConnected]);

  // Group management functions

  // Update group info
  const updateGroupInfo = useCallback((roomId: string, name: string, description?: string) => {
    if (!isConnected) {
      console.error("Cannot update group info: not connected");
      return false;
    }

    console.log(`Updating group info for ${roomId}: ${name}`);
    return socketService.updateConversationInfo(roomId, name, description);
  }, [isConnected]);

  // Add participants to group
  const addParticipants = useCallback((roomId: string, participantIds: string[]) => {
    if (!isConnected) {
      console.error("Cannot add participants: not connected");
      return false;
    }

    console.log(`Adding participants to ${roomId}:`, participantIds);
    return socketService.addParticipants(roomId, participantIds);
  }, [isConnected]);

  // Remove participant from group
  const removeParticipant = useCallback((roomId: string, participantId: string) => {
    if (!isConnected) {
      console.error("Cannot remove participant: not connected");
      return false;
    }

    console.log(`Removing participant ${participantId} from ${roomId}`);
    return socketService.removeParticipant(roomId, participantId);
  }, [isConnected]);

  // Make participant admin
  const makeAdmin = useCallback((roomId: string, participantId: string) => {
    if (!isConnected) {
      console.error("Cannot make admin: not connected");
      return false;
    }

    console.log(`Making ${participantId} admin in ${roomId}`);
    return socketService.changeParticipantRole(roomId, participantId, 'admin');
  }, [isConnected]);

  // Tab management
  const switchTab = useCallback((tab: 'all' | 'archived' | 'starred' | 'unread' | 'groups') => {
    setActiveTab(tab);
    
    // Load appropriate data based on tab
    switch (tab) {
      case 'starred':
        getStarredMessages();
        break;
      case 'archived':
        getArchivedConversations();
        break;
      case 'all':
      case 'unread':
      case 'groups':
      default:
        // These use existing data
        break;
    }
  }, [setActiveTab, getStarredMessages, getArchivedConversations]);

  // Message selection functionality
  const toggleMessageSelection = useCallback((messageId: string) => {
    if (selectedMessages.includes(messageId)) {
      deselectMessage(messageId);
    } else {
      selectMessage(messageId);
    }
    
    // Auto-enable selection mode if not already enabled
    if (!selectionMode) {
      setSelectionMode(true);
    }
  }, [selectedMessages, selectionMode, selectMessage, deselectMessage]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Exiting selection mode, clear selections
      clearSelectedMessages();
    }
  }, [selectionMode, clearSelectedMessages]);

  const clearSelections = useCallback(() => {
    clearSelectedMessages();
    setSelectionMode(false);
  }, [clearSelectedMessages]);

  // Bulk operations on selected messages
  const deleteSelectedMessages = useCallback((deleteForEveryone: boolean = false) => {
    if (selectedMessages.length === 0) return false;

    selectedMessages.forEach(messageId => {
      deleteMessageAction(messageId, deleteForEveryone);
    });

    clearSelections();
    return true;
  }, [selectedMessages, deleteMessageAction, clearSelections]);

  const starSelectedMessages = useCallback((starred: boolean = true) => {
    if (selectedMessages.length === 0) return false;

    selectedMessages.forEach(messageId => {
      starMessageAction(messageId, starred);
    });

    clearSelections();
    return true;
  }, [selectedMessages, starMessageAction, clearSelections]);

  const forwardSelectedMessages = useCallback((options: ForwardMessageOptions = {}) => {
    if (selectedMessages.length === 0) return false;

    selectedMessages.forEach(messageId => {
      forwardMessage(messageId, options);
    });

    clearSelections();
    return true;
  }, [selectedMessages, forwardMessage, clearSelections]);

  // Copy message content to clipboard
  const copyMessage = useCallback(async (messageId: string) => {
    if (!currentRoom || !chatHistories[currentRoom.id]) {
      return false;
    }

    const message = chatHistories[currentRoom.id].find(msg => msg.id === messageId);
    if (!message) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(message.content);
      console.log("Message copied to clipboard");
      return true;
    } catch (err) {
      console.error("Failed to copy message:", err);
      return false;
    }
  }, [currentRoom, chatHistories]);

  // Search in messages
  const searchMessages = useCallback((query: string, roomId?: string) => {
    const targetRoomId = roomId || currentRoom?.id;
    if (!targetRoomId || !chatHistories[targetRoomId]) {
      return [];
    }

    const messages = chatHistories[targetRoomId];
    const searchQuery = query.toLowerCase();

    return messages.filter(message => 
      message.content.toLowerCase().includes(searchQuery) ||
      message.senderName?.toLowerCase().includes(searchQuery)
    );
  }, [currentRoom, chatHistories]);

  // Get room by ID (including archived)
  const getRoomById = useCallback((roomId: string) => {
    return [...rooms, ...archivedRooms].find(room => room.id === roomId);
  }, [rooms, archivedRooms]);

  // Reply functionality
  const setReplyTo = useCallback((message: ReplyMessage) => {
    setReplyToMessage(message);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyToMessage(null);
  }, []);

  // Jump to message (for pinned messages)
  const jumpToMessage = useCallback((messageId: string) => {
    // This would scroll to the message in the chat
    // Implementation depends on your UI structure
    console.log(`Jumping to message: ${messageId}`);
    
    // You could dispatch an action to highlight the message
    // or scroll to it in the message list
  }, []);
  
  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting && user && accessToken) {
      console.log("Auto-connecting to chat socket...");
      connect();
    }
    
    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [autoConnect, isConnected, isConnecting, accessToken, connect]);
  
  // Update messages when chat history changes
  useEffect(() => {
    if (currentRoom && chatHistories[currentRoom.id]) {
      setMessages(chatHistories[currentRoom.id]);
    }
  }, [currentRoom, chatHistories]);
  
  // Update isTyping when current room changes
  useEffect(() => {
    if (currentRoom?.isTyping !== undefined) {
      setIsTyping(currentRoom.isTyping);
    } else {
      setIsTyping(false);
    }
  }, [currentRoom]);

  // Auto-clear selections when room changes
  useEffect(() => {
    if (selectedMessages.length > 0) {
      clearSelectedMessages();
      setSelectionMode(false);
    }
    setReplyToMessage(null);
  }, [currentRoom?.id, selectedMessages.length, clearSelectedMessages]);
  
  return {
    // Basic chat functionality
    isConnected,
    isConnecting,
    error,
    rooms,
    archivedRooms,
    currentRoom,
    messages,
    isTyping,
    isLoading,
    connect,
    disconnect,
    switchRoom,
    sendMessage,
    sendTypingIndicator,
    createChat,
    refreshRooms,

    // Enhanced features
    archiveConversation,
    pinConversation,
    blockConversation,
    deleteConversation,
    starMessage: starMessageAction,
    pinMessage: pinMessageAction,
    deleteMessage: deleteMessageAction,
    forwardMessage,
    markAllMessagesAsRead: markAllMessagesAsReadAction,
    getStarredMessages,
    getArchivedConversations,
    
    // Group management
    updateGroupInfo,
    addParticipants,
    removeParticipant,
    makeAdmin,
    
    // Tab management
    activeTab,
    switchTab,
    starredMessages,
    pinnedMessages,

    // Message selection
    selectionMode,
    selectedMessages,
    toggleMessageSelection,
    toggleSelectionMode,
    clearSelections,
    deleteSelectedMessages,
    starSelectedMessages,
    forwardSelectedMessages,

    // Reply functionality
    replyToMessage,
    setReplyTo,
    cancelReply,
    jumpToMessage,

    // Utility functions
    copyMessage,
    searchMessages,
    getRoomById,
  };
}