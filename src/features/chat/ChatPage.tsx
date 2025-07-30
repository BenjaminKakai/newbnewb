"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";
import { useChatStore } from "@/store/chatStore";
import {
  ChatInput,
  MessageList,
  ChatHeader,
  NewChatModal,
  RoomList,
  Message,
} from "./components";
import UserInfo from "./components/UserInfo";
import SidebarNav from "@/components/SidebarNav";
import { useTheme } from "@/providers/ThemeProvider";

const getAvatarColor = () => "bg-gray-500";

const ChatPage: React.FC = () => {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { getContactName } = useContactsStore();
  const {
    conversations,
    connected,
    connectionStatus,
    connectionError,
    currentConversationDetails,
    messages,
    startConversation,
    sendMessage,
    initializeConnection,
    disconnect,
    addConversation,
    removeConversation,
    markConversationAsRead,
  } = useChatStore();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [recipientJid, setRecipientJid] = useState("");
  const [activeConversation, setActiveConversation] = useState<string>("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      setIsCheckingAuth(true);
      if (!isAuthenticated || !user) {
        router.replace("/login");
        return;
      }
      const currentUser = user?.id
        ? {
            id: user.id,
            jid: `${user.id}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}`,
          }
        : null;
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
    getContactName,
  ]);

  const getActiveMessages = () => {
    if (!activeConversation) return [];
    return messages
      .filter(
        (msg) =>
          (msg.from === activeConversation &&
            msg.to === user?.id + "@" + process.env.NEXT_PUBLIC_XMPP_DOMAIN) ||
          (msg.from === user?.id + "@" + process.env.NEXT_PUBLIC_XMPP_DOMAIN &&
            msg.to === activeConversation)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !recipientJid.trim()) return;
    const currentUser = user?.id
      ? {
          id: user.id,
          jid: `${user.id}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}`,
        }
      : null;
    sendMessage(recipientJid, messageText, currentUser);
    setMessageText("");
    if (activeConversation !== recipientJid) {
      startConversation(recipientJid, getContactName);
    }
  };

  const addGroupMember = (groupJid: string, userId: string) => {
    // Implement group member addition if needed
    console.log(`Adding member ${userId} to group ${groupJid}`);
  };

  const removeGroupMember = (groupJid: string, userId: string) => {
    // Implement group member removal if needed
    console.log(`Removing member ${userId} from group ${groupJid}`);
  };

  const exitGroup = (groupJid: string) => {
    removeConversation(groupJid);
    if (activeConversation === groupJid) {
      setActiveConversation("");
    }
  };


  if (connectionError) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "dark:bg-[var(--background)]" : "bg-gray-100"
        } text-[var(--foreground)]`}
      >
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Connection Failed
          </h2>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <button
            onClick={() =>
              initializeConnection(
                user?.id
                  ? {
                      id: user.id,
                      jid: `${user.id}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}`,
                    }
                  : null,
                accessToken,
                getContactName
              )
            }
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex ${
        isDarkMode ? "dark:bg-[var(--background)]" : "bg-gray-100"
      } text-[var(--foreground)]`}
    >
      <SidebarNav onClose={() => {}} currentPath={pathname} />
      <div className="flex-1 flex flex-col ml-20 h-full">
        <div className="flex flex-1 h-[calc(100vh-4rem)]">
          <RoomList
            conversations={conversations}
            activeConversation={activeConversation}
            connected={connected}
            onConversationSelect={(jid) => {
              setRecipientJid(jid);
              setActiveConversation(jid);
              startConversation(jid, getContactName);
            }}
          />
          <div className="flex-1 flex flex-col h-full">
            {activeConversation ? (
              <>
                <ChatHeader
                  activeConversation={activeConversation}
                  conversationName={
                    getContactName(
                      activeConversation.split("@")[0],
                      user?.id
                    ) || activeConversation
                  }
                  getAvatarColor={getAvatarColor}
                  onCallClick={() => console.log("Voice call")}
                  onVideoClick={() => console.log("Video call")}
                  setShowUserInfoModal={setShowUserInfoModal}
                />
                <div className="flex-1 overflow-y-auto">
                  <MessageList
                    messages={getActiveMessages()}
                    loadingHistory={false} // Managed by store
                    activeConversation={activeConversation}
                  />
                </div>
                <ChatInput
                  messageText={messageText}
                  setMessageText={setMessageText}
                  onSendMessage={handleSendMessage}
                  connected={connected}
                  currentUserId={user?.id}
                  activeConversation={activeConversation}
                  activeGroupJid={activeConversation}
                  addMessage={(message) => {
                    const newMessage: Message = {
                      id: message.id,
                      from: user?.id
                        ? `${user.id}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}`
                        : "",
                      to: message.conversationId,
                      text: message.content,
                      timestamp: message.sentAt,
                      isOwn: true,
                    };
                    set((state) => ({
                      messages: [...state.messages, newMessage],
                    }));
                  }}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={(jid) => startConversation(jid, getContactName)}
        connected={connected}
      />
      {showUserInfoModal && currentConversationDetails && (
        <UserInfo
          conversation={currentConversationDetails}
          currentUserId={user?.id || ""}
          setShowUserInfoModal={setShowUserInfoModal}
          addGroupMember={addGroupMember}
          removeGroupMember={removeGroupMember}
          exitGroup={exitGroup}
          connection={null}
          connected={connected}
        />
      )}
    </div>
  );
};

export default ChatPage;
