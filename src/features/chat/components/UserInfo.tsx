"use client";

import React, { useState } from 'react';
import { X, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConversationMember {
  id: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  lastSeen?: string;
}

interface Conversation {
  jid: string;
  name?: string;
  avatar?: string;
  type?: "CHAT" | "GROUP";
  members?: ConversationMember[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface UserInfoProps {
  conversation: Conversation;
  currentUserId: string;
  setShowUserInfoModal: (show: boolean) => void;
  addGroupMember: (groupJid: string, userId: string) => void;
  removeGroupMember: (groupJid: string, userId: string) => void;
  exitGroup: (groupJid: string) => void;
  connection: any;
  connected: boolean;
}

const UserInfo: React.FC<UserInfoProps> = ({
  conversation,
  currentUserId,
  setShowUserInfoModal,
  addGroupMember,
  removeGroupMember,
  exitGroup,
  connection,
  connected,
}) => {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberInput, setAddMemberInput] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);

  const isGroupChat = conversation.type === "GROUP";

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const handleAddMember = () => {
    if (!addMemberInput.trim()) {
      toast.error("User ID is required");
      return;
    }
    const cleanUserId = addMemberInput.replaceAll("-", "");
    if (!/^[0-9a-f]{32}$/.test(cleanUserId)) {
      toast.error("Invalid user ID. Must be a 32-character hexadecimal string.");
      return;
    }
    if (!connected) {
      toast.error("Not connected to chat server");
      return;
    }
    addGroupMember(conversation.jid, cleanUserId);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.jid === conversation.jid
          ? {
              ...conv,
              members: [
                ...(conv.members || []),
                { id: cleanUserId, name: cleanUserId, avatar: getDummyAvatar(cleanUserId) },
              ],
            }
          : conv
      )
    );
    setAddMemberInput("");
    setShowAddMemberModal(false);
    toast.success("Member added successfully");
  };

  const handleRemoveMember = (memberId: string) => {
    if (!connected) {
      toast.error("Not connected to chat server");
      return;
    }
    if (confirm("Are you sure you want to remove this member?")) {
      removeGroupMember(conversation.jid, memberId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.jid === conversation.jid
            ? {
                ...conv,
                members: conv.members?.filter((m) => m.id !== memberId) || [],
              }
            : conv
        )
      );
      toast.success("Member removed successfully");
    }
  };

  const handleExitGroup = () => {
    if (!connected) {
      toast.error("Not connected to chat server");
      return;
    }
    if (confirmExit) {
      exitGroup(conversation.jid);
      setShowUserInfoModal(false);
      setConfirmExit(false);
      toast.success("Left group successfully");
    } else {
      setConfirmExit(true);
      setTimeout(() => setConfirmExit(false), 3000);
    }
  };

  const handleClose = () => {
    setShowUserInfoModal(false);
    setConfirmExit(false);
    setShowAddMemberModal(false);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Sliding Panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-[var(--background)] text-[var(--foreground)] shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isGroupChat ? "Group Info" : "Contact Info"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20">
          {/* Profile Section */}
          <div className="p-6 text-center border-b border-gray-50 dark:border-gray-700">
            <div className="relative inline-block mb-4">
              <img
                src={conversation.avatar || getDummyAvatar(conversation.jid)}
                alt={conversation.name || conversation.jid}
                className="w-24 h-24 rounded-full object-cover mx-auto"
              />
            </div>
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-1">
              {conversation.name || conversation.jid.split('@')[0]}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              {isGroupChat
                ? `${conversation.members?.length || 0} members`
                : conversation.members?.[0]?.phoneNumber || "+254712345678"}
            </p>
            {!isGroupChat && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Last seen {formatLastSeen(conversation.members?.[0]?.lastSeen)}
              </p>
            )}
          </div>

          {/* Group Participants */}
          {isGroupChat && (
            <div className="p-4 border-b border-gray-50 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-[var(--foreground)]">Participants</h4>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="text-blue-500 text-sm hover:text-blue-600 flex items-center"
                  disabled={!connected}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Member
                </button>
              </div>
              <div className="space-y-3">
                {conversation.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <img
                      src={member.avatar || getDummyAvatar(member.id)}
                      alt={member.name || member.id}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {member.name || member.id.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.phoneNumber || "No phone number"}
                      </p>
                    </div>
                    {member.id !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                        disabled={!connected}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exit Group */}
          {isGroupChat && (
            <div className="p-4">
              <button
                onClick={handleExitGroup}
                className={`w-full flex items-center justify-center space-x-2 p-2 rounded-lg transition-colors ${
                  confirmExit ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                disabled={!connected}
              >
                <LogOut className="w-5 h-5" />
                <span>{confirmExit ? 'Confirm Exit Group' : 'Exit Group'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && isGroupChat && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-60">
          <div className="rounded-lg p-6 w-full max-w-md bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Add Member to Group</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={addMemberInput}
                onChange={(e) => setAddMemberInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter user ID"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={!connected}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserInfo;