import React, { useRef, useEffect } from 'react';
import { MessageSquare, Users, Star, CheckSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; right: number };
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, position }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    setShowNewChatModal,
    setNewChatType,
  } = useChatStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNewChat = () => {
    setNewChatType("DIRECT");
    setShowNewChatModal(true);
    onClose();
  };

  const handleNewGroup = () => {
    setNewChatType("GROUP");
    setShowNewChatModal(true);
    onClose();
  };

  const handleStarredMessages = () => {
    // TODO: Implement starred messages view
    console.log("Starred messages clicked");
    onClose();
  };

  const handleSelectChats = () => {
    // TODO: Implement multi-select mode
    console.log("Select chats clicked");
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px]"
      style={{
        top: position.top,
        right: position.right,
      }}
    >
      <button
        onClick={handleNewChat}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
      >
        <MessageSquare className="w-5 h-5 text-gray-700" />
        <span className="text-gray-900 font-medium">New chat</span>
      </button>
      
      <button
        onClick={handleNewGroup}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
      >
        <Users className="w-5 h-5 text-gray-700" />
        <span className="text-gray-900 font-medium">New group</span>
      </button>
      
      <button
        onClick={handleStarredMessages}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
      >
        <Star className="w-5 h-5 text-gray-700" />
        <span className="text-gray-900 font-medium">Starred messages</span>
      </button>
      
      <button
        onClick={handleSelectChats}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
      >
        <CheckSquare className="w-5 h-5 text-gray-700" />
        <span className="text-gray-900 font-medium">Select chats</span>
      </button>
    </div>
  );
};

export default DropdownMenu;