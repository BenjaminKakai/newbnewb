
"use client";

import React from "react";
import { Phone, Video } from "lucide-react";
import { useContactsStore } from "@/store/contactsStore";

interface ChatHeaderProps {
  activeConversation: string;
  conversationName: string;
  getAvatarColor: (jid: string) => string;
  onCallClick?: () => void;
  onVideoClick?: () => void;
  setShowUserInfoModal: (show: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  conversationName,
  getAvatarColor,
  onCallClick,
  onVideoClick,
  setShowUserInfoModal,
}) => {
  const { getContactAvatar } = useContactsStore();

  if (!activeConversation) {
    return null;
  }

  const handleCall = () => {
    console.log("Voice call initiated");
    onCallClick?.();
  };

  const handleVideoCall = () => {
    console.log("Video call initiated");
    onVideoClick?.();
  };

  const handleInfo = () => {
    console.log("Group info opened");
    setShowUserInfoModal(true);
  };

  // Extract user ID from JID (e.g., groupId@conference.xmpp-dev.wasaachat.com)
  const getUserIdFromJid = (jid: string) => jid.split("@")[0];
  const userId = getUserIdFromJid(activeConversation);
  const contactAvatar = getContactAvatar(userId); // Fetch avatar from contactsStore
  const displayAvatar = contactAvatar; // Use contact avatar if available

  return (
    <div className="bg-gray-100 dark:bg-[var(--background)] border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={handleInfo}
        >
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                activeConversation
              )}`}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={conversationName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{conversationName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          {/* Group info */}
          <div>
            <h2 className="text-lg font-semibold">{conversationName}</h2>
            <p className="text-sm text-gray-500">Group chat</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCall}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Voice call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={handleVideoCall}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Video call"
          >
            <Video size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;