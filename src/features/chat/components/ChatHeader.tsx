"use client";

import React from "react";
import { Phone, Video } from "lucide-react";

interface ChatHeaderProps {
  activeConversation: string;
  getDisplayName: (jid: string) => string;
  getAvatarColor: (jid: string) => string;
  onCallClick?: () => void;
  onVideoClick?: () => void;
  setShowUserInfoModal: (show: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConversation,
  getDisplayName,
  getAvatarColor,
  onCallClick,
  onVideoClick,
  setShowUserInfoModal,
}) => {
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
    console.log("Contact info opened");
    setShowUserInfoModal(true);
  };

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
              <span>
                {getDisplayName(activeConversation).charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          {/* User info */}
          <div>
            <h2 className="text-lg font-semibold">
              {getDisplayName(activeConversation)}
            </h2>
            <p className="text-sm text-gray-500">Last seen 1min ago</p>
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