"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useGroupStore } from "@/store/groupStore";
import { useRouter, usePathname } from "next/navigation";
import { ChatInput, MessageList, ChatHeader } from "../chat/components";
import { GroupRoomList } from "../chat/components/GroupRoomsList";
import SidebarNav from "@/components/SidebarNav";
import { toast } from "react-hot-toast";
import { useTheme } from "@/providers/ThemeProvider";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, description: string) => Promise<void>;
  userId: string;
  accessToken: string;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  userId,
  accessToken,
}) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    setCreating(true);
    try {
      await onCreateGroup(groupName, description);
      toast.success("Group created successfully");
      setGroupName("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--background)]/50  flex items-center justify-center z-50">
      <div className="bg-[var(--background)] border border-gray-200 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
          Create New Group
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-200 text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter group name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter group description"
            rows={4}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={creating}
            className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {creating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupPage: React.FC = () => {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const {
    groupConversations,
    groupMessages,
    connected,
    connectionStatus,
    connectionError,
    activeGroupConversation,
    startGroupConversation,
    sendGroupMessage,
    createGroup,
    fetchExistingGroups,
    markGroupConversationAsRead,
    initializeConnection,
    disconnect,
  } = useGroupStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isDarkMode } = useTheme();
  const [messageText, setMessageText] = useState("");
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);

  const getContactName = (userId: string, currentUserId?: string) => {
    return userId === currentUserId ? "You" : userId;
  };

  const getAvatarColor = () => "bg-gray-500";

  const getDummyAvatar = (id: string) => {
    const avatars = [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1494790108755-2616b69fc7c9?w=40&h=40&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
    ];
    const hash = id
      .split("")
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & a, 0);
    return avatars[Math.abs(hash) % avatars.length];
  };

  const getDisplayName = (jid: string) => {
    const group = groupConversations.find((g) => g.jid === jid);
    return group?.name || jid.split("@")[0] || "Unnamed Group";
  };

  // Create currentUser object - same pattern as ChatPage
  const currentUser = useMemo(() => {
    if (!user?.id) return null;
    return {
      id: user.id,
      jid: `${user.id}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}`,
    };
  }, [user?.id]);

  // Authentication and connection initialization - same pattern as ChatPage
  useEffect(() => {
    const checkAuthStatus = () => {
      setIsCheckingAuth(true);
      if (!isAuthenticated || !user) {
        router.replace("/login");
        return;
      }
      
      // Initialize connection first
      initializeConnection(currentUser, accessToken, getContactName);
      setIsCheckingAuth(false);
    };
    
    checkAuthStatus();

    return () => {
      disconnect();
    };
  }, [
    isAuthenticated,
    user,
    accessToken,
    initializeConnection,
    disconnect,
    router,
    currentUser,
  ]);

  // Fetch existing groups - call immediately and also after connection
  useEffect(() => {
    if (currentUser && accessToken) {
      console.log("Fetching existing groups immediately...");
      // Call immediately regardless of connection status
      fetchExistingGroups(currentUser, accessToken, getContactName);
    }
  }, [currentUser, accessToken, fetchExistingGroups]);

  // Also fetch after connection is established
  useEffect(() => {
    if (connected && currentUser && accessToken) {
      console.log("Connection established, fetching existing groups again...");
      fetchExistingGroups(currentUser, accessToken, getContactName);
    }
  }, [connected, currentUser, accessToken, fetchExistingGroups]);

  // Handle group selection from URL
  useEffect(() => {
    const groupId = pathname.split("/groups/")[1];
    if (groupId && groupId !== activeGroupConversation.split("@")[0]) {
      const fullJid = `${groupId}@${process.env.NEXT_PUBLIC_XMPP_CONFERENCE_DOMAIN}`;
      startGroupConversation(fullJid, getContactName);
    }
  }, [pathname, activeGroupConversation, startGroupConversation]);

  const retryConnection = () => {
    if (currentUser && accessToken) {
      initializeConnection(currentUser, accessToken, getContactName);
    }
  };

  const handleSendMessage = () => {
    if (
      !connected ||
      !messageText.trim() ||
      !activeGroupConversation ||
      !currentUser
    ) {
      toast.error("Cannot send message: Not connected or no group selected");
      return;
    }
    sendGroupMessage(activeGroupConversation, messageText, currentUser);
    setMessageText("");
  };

  const handleCreateGroup = async (groupName: string, description: string) => {
    if (!currentUser || !accessToken) return;
    await createGroup(groupName, description, currentUser, accessToken);
  };

  const handleGroupSelect = (jid: string) => {
    const groupId = jid.split("@")[0]; // Extract group ID
    // router.push(`/groups/${groupId}`);
    startGroupConversation(jid, getContactName);
    markGroupConversationAsRead(jid);
  };

  // Render loading state during auth check
  if (isCheckingAuth) {
    return (
      <div className={`h-screen flex items-center justify-center ${
        isDarkMode ? "dark:bg-[var(--background)]" : "bg-gray-100"
      } text-[var(--foreground)]`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-white text-sm">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }


  // Main group chat interface
  return (
    <div
      className={`h-screen flex ${
        isDarkMode ? "dark:bg-[var(--background)]" : "bg-gray-100"
      } text-[var(--foreground)]`}
    >
      <SidebarNav onClose={() => {}} currentPath={pathname} />
      <div className="flex-1 flex flex-col ml-20 h-full">
        <div className="flex flex-1 h-[calc(100vh-4rem)]">
          <GroupRoomList
            groups={groupConversations}
            activeGroup={activeGroupConversation}
            onSelectGroup={handleGroupSelect}
            onNewGroup={() => setShowNewGroupModal(true)}
            getDisplayName={getDisplayName}
            getAvatarColor={getAvatarColor}
            getDummyAvatar={getDummyAvatar}
          />

          {/* Right: Chat Area */}
          <div className="flex-1 flex flex-col h-full">
            {activeGroupConversation ? (
              <>
                <ChatHeader
                  activeConversation={activeGroupConversation}
                  conversationName={getDisplayName(activeGroupConversation)}
                  getAvatarColor={getAvatarColor}
                  setShowUserInfoModal={setShowUserInfoModal}
                />
                <div className="flex-1 overflow-y-auto">
                  <MessageList
                    messages={groupMessages.filter(
                      (msg) => msg.to === activeGroupConversation
                    )}
                    loadingHistory={false} // Adjust based on your loading state
                    activeConversation={activeGroupConversation}
                  />
                </div>
                <ChatInput
                  messageText={messageText}
                  setMessageText={setMessageText}
                  onSend={handleSendMessage}
                  disabled={!connected || !activeGroupConversation}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-60 h-60 flex items-center justify-center mx-auto mb-4">
                    <img
                      src="/empty1.svg"
                      alt="Group Avatar"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Select a group to start chatting
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onCreateGroup={handleCreateGroup}
        userId={currentUser?.id || ""}
        accessToken={accessToken || ""}
      />
    </div>
  );
};

export default GroupPage;