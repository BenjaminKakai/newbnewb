// Export all chat components for easy importing
export { default as Chat } from '../ChatPage';
export { default as ChatInput } from './ChatInput';
export { default as MessageList } from './MessageList';
export { default as ChatHeader } from './ChatHeader';
export { default as NewChatModal } from './NewChatModal';
export { default as RoomList } from '../components/RoomsList';

// Export shared types
export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

export interface User {
  id: string;
  jid: string;
}

export interface Conversation {
  jid: string;
  name?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}