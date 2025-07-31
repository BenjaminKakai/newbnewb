"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";
import { useSocket } from "@/services/notificationSocket";
import { useStatusStore, StatusUser, StatusData } from "@/store/statusStore";
import NewChatModal from "./NewChatModal";
import StatusViewerModal from "./StatusViewerModal";
import StatusUploadModal from "./StatuUploadModal";
import { toast } from "react-hot-toast";
import { Bell } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useChatStore } from "@/store/chatStore";

interface Conversation {
  jid: string;
  name?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  starred?: boolean;
}

interface Notification {
  id: string;
  user_id: string;
  channel: string;
  user_email: string | null;
  user_phone: string;
  origin_service: string;
  template_id: string;
  entity_id: string;
  entity_type: string;
  type: string;
  payload: { name: string; time: string };
  body: string;
  status: string;
  delivered_at: string | null;
  attempts: number;
  read_receipt: boolean;
  priority: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  template: {
    id: string;
    template_code: string;
    title: string;
    language: string;
  };
}

interface RoomListProps {
  conversations: Conversation[];
  activeConversation: string;
  connected: boolean;
  onConversationSelect: (jid: string) => void;
}

const NotificationsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  position: { x: number; y: number };
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}> = ({
  isOpen,
  onClose,
  notifications,
  position,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto z-50"
      style={{ top: `${position.y}px`, left: `${position.x - 260}px` }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <button
          onClick={onMarkAllAsRead}
          className="text-sm text-[#2A8FEA] hover:text-blue-600"
        >
          Mark all as read
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 mb-2 rounded-lg ${
              notification.read_receipt ? "bg-gray-100" : "bg-blue-50"
            }`}
          >
            <p className="text-sm">{notification.body}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {new Date(notification.createdAt).toLocaleTimeString()}
              </span>
              {!notification.read_receipt && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-[#2A8FEA] hover:text-blue-600"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        ))
      )}
      <button
        onClick={onClose}
        className="w-full mt-3 text-center text-sm text-gray-500 hover:text-gray-700"
      >
        Close
      </button>
    </div>
  );
};

const StatusComponent: React.FC<{
  statusUsers: StatusUser[];
  onStatusClick: (user: StatusUser, index: number) => void;
  onAddStatusClick: () => void;
}> = React.memo(({ statusUsers, onStatusClick, onAddStatusClick }) => {
  return (
    <div className="text-[var(--foreground)] rounded-lg mb-4">
      <div className="flex justify-end cursor-pointer hover:underline items-center mb-4">
        <h2 className="text-sm">All Status</h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto cursor-pointer scrollbar-hide pb-2">
        <div className="flex flex-col items-center space-y-3 min-w-[6rem]">
          <button
            onClick={onAddStatusClick}
            className="relative w-24 h-24 rounded-2xl cursor-pointer bg-gray-300 flex flex-col items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="text-center mt-2">
              <div className="text-xs font-medium">Add Status</div>
            </div>
          </button>
        </div>

        {statusUsers.map((user, index) => (
          <div
            key={user.id}
            className="flex flex-col items-center space-y-3 min-w-[6rem]"
          >
            <div className="relative">
              <button
                onClick={() => onStatusClick(user, index)}
                className={`relative w-24 h-24 cursor-pointer overflow-hidden transition-all ${
                  user.statuses.some((s) => !s.isViewed) ? "" : ""
                }`}
                style={{
                  borderTopLeftRadius: "1rem",
                  borderTopRightRadius: "1rem",
                  borderBottomLeftRadius: "15px",
                  borderBottomRightRadius: "15px",
                }}
              >
                {user.statuses.length > 0 &&
                user.statuses[0].type === "image" &&
                user.statuses[0].imageUrl ? (
                  <img
                    src={user.statuses[0].imageUrl}
                    alt={`${user.name}'s status`}
                    className="w-full h-full object-cover"
                  />
                ) : user.statuses.length > 0 &&
                  user.statuses[0].type === "text" ? (
                  <div
                    className="w-full h-full flex items-center cursor-pointer justify-center text-xs font-medium p-3 text-center"
                    style={{
                      backgroundColor:
                        user.statuses[0].backgroundColor || "#3B82F6",
                      color: user.statuses[0].textColor || "#FFFFFF",
                    }}
                  >
                    {user.statuses[0].content.length > 25
                      ? user.statuses[0].content.substring(0, 25) + "..."
                      : user.statuses[0].content}
                  </div>
                ) : user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full cursor-pointer object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-semibold text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full border-4 border-[var(--background)] overflow-hidden z-10">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm font-medium text-center truncate max-w-24">
              {user.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

StatusComponent.displayName = "StatusComponent";

const RoomList: React.FC<RoomListProps> = ({
  conversations,
  activeConversation,
  connected,
  onConversationSelect,
}) => {
  const { user, accessToken } = useAuthStore();
  const { contacts, getContactName, getContactAvatar, fetchContacts } =
    useContactsStore();
  const { notifications, markAsRead, markAllAsRead } = useSocket();
  const { statusUsers, isLoadingStatuses, fetchStatuses, uploadStatus } =
    useStatusStore();
  const { messages } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showStatusUpload, setShowStatusUpload] = useState(false);
  const [selectedStatusUser, setSelectedStatusUser] =
    useState<StatusUser | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationPosition, setNotificationPosition] = useState({
    x: 0,
    y: 0,
  });

  const getUserIdFromJid = useCallback((jid: string) => jid.split("@")[0], []);
  // Function to determine if a user is a contact
  const isContact = useCallback(
    (jid: string) => {
      const userId = getUserIdFromJid(jid);
      return contacts.some((contact) => contact.contact_id === userId);
    },
    [contacts, getUserIdFromJid]
  );

  // Updated getAvatarColor to return random light colors
  const getAvatarColor = useCallback(() => {
    const lightColors = [
      "bg-blue-200",
      "bg-green-200",
      "bg-yellow-200",
      "bg-pink-200",
      "bg-purple-200",
      "bg-teal-200",
      "bg-orange-200",
    ];
    return lightColors[Math.floor(Math.random() * lightColors.length)];
  }, []);

  const handleMenuToggle = useCallback(
    (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({ x: rect.right - 120, y: rect.bottom + 5 });
      setMenuOpen(!menuOpen);
    },
    [menuOpen]
  );

  const handleMenuOptionClick = useCallback((option: string) => {
    if (option === "New Chat") {
      setShowNewChatModal(true);
    }
    setMenuOpen(false);
  }, []);

  const handleStartChat = useCallback(
    (jid: string) => {
      onConversationSelect(jid);
    },
    [onConversationSelect]
  );

  const handleBellClick = useCallback(
    (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setNotificationPosition({ x: rect.right, y: rect.bottom + 5 });
      setShowNotificationsModal(!showNotificationsModal);
    },
    [showNotificationsModal]
  );

  const filteredConversations = useMemo(() => {
    switch (activeTab) {
      case "Unread":
        return conversations.filter((conv) => conv.unreadCount > 0);
      case "Starred":
        return conversations.filter((conv) => conv.starred);
      default:
        return conversations;
    }
  }, [conversations, activeTab]);

  useEffect(() => {
    if (accessToken && user?.id) {
      fetchContacts();
    }
  }, [accessToken, user?.id]);

  useEffect(() => {
    if (accessToken) {
      fetchStatuses();
    }
  }, [accessToken]);

  const handleStatusClick = useCallback((user: StatusUser, index: number) => {
    setSelectedStatusUser(user);
    setSelectedUserIndex(index);
    setShowStatusViewer(true);
  }, []);

  const handleAddStatusClick = useCallback(() => {
    console.log("Add Status clicked, setting showStatusUpload to true");
    setShowStatusUpload(true);
  }, []);

  const handleStatusUpload = useCallback(
    async (statusData: StatusData) => {
      try {
        await uploadStatus(statusData);
        toast.success("Status uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload status");
      }
    },
    [uploadStatus]
  );

  const conversationItems = useMemo(() => {
    return filteredConversations.map((conv) => {
      const userId = getUserIdFromJid(conv.jid);
      const contactAvatar = getContactAvatar(userId);
      const displayAvatar = contactAvatar || conv.avatar;
      const displayName = getContactName(userId, user?.id) || userId;

      // Prioritize last message from state
      const conversationMessages = messages
        .filter(
          (msg) =>
            (msg.from === conv.jid &&
              msg.to ===
                user?.id + "@" + process.env.NEXT_PUBLIC_XMPP_DOMAIN) ||
            (msg.from ===
              user?.id + "@" + process.env.NEXT_PUBLIC_XMPP_DOMAIN &&
              msg.to === conv.jid)
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const lastMessageFromState = conversationMessages[0];
      const lastMessage = lastMessageFromState
        ? lastMessageFromState.isOwn
          ? `You: ${lastMessageFromState.text}`
          : lastMessageFromState.text
        : conv.lastMessage; // Fallback to conv.lastMessage (from MAM or API)

      const lastMessageTime = lastMessageFromState
        ? lastMessageFromState.timestamp
        : conv.lastMessageTime;

      return {
        ...conv,
        userId,
        displayAvatar,
        displayName,
        lastMessage,
        lastMessageTime,
        isContact: isContact(conv.jid),
      };
    });
  }, [
    filteredConversations,
    getUserIdFromJid,
    getContactAvatar,
    getContactName,
    user?.id,
    messages,
    isContact,
  ]);

  return (
    <div className="w-90 text-[var(--foreground)] bg-[var(--background)] shadow-Toaster shadow-lg flex flex-col">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Chats</h1>
          <div className="flex items-center space-x-3">
            <Bell
              className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={handleBellClick}
            />
            <button
              onClick={handleMenuToggle}
              className="p-2 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            className="absolute border border-gray-200 bg-[var(--background)] rounded-md shadow-lg py-2 w-32 z-50"
            style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
          >
            <button
              onClick={() => handleMenuOptionClick("New Chat")}
              className="w-full text-left px-4 py-2 text-sm text-[var(--foreground)] cursor-pointer"
            >
              New Chat
            </button>
            <button
              onClick={() => handleMenuOptionClick("Starred Messages")}
              className="w-full text-left px-4 py-2 text-sm text-[var(--foreground)] cursor-pointer"
            >
              Starred Messages
            </button>
            <button
              onClick={() => handleMenuOptionClick("Select Chats")}
              className="w-full text-left px-4 py-2 text-sm text-[var(--foreground)] cursor-pointer"
            >
              Select Chats
            </button>
          </div>
        )}
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={notifications}
          position={notificationPosition}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search Chats"
            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 text-black rounded-xl focus:ring-2 focus:ring-[#2A8FEA] focus:bg-white text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        {isLoadingStatuses ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2A8FEA]"></div>
          </div>
        ) : (
          <div className="mb-4">
            <StatusComponent
              statusUsers={statusUsers}
              onStatusClick={handleStatusClick}
              onAddStatusClick={handleAddStatusClick}
            />
          </div>
        )}
      </div>
      <div className="px-4 pb-3">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab("All")}
            className={`flex-1 px-6 py-1 rounded-full cursor-pointer text-sm font-medium ${
              activeTab === "All"
                ? "bg-[#2A8FEA] text-white"
                : "bg-transparent hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("Unread")}
            className={`flex-1 px-6 py-1 rounded-full cursor-pointer text-sm font-medium ${
              activeTab === "Unread"
                ? "bg-[#2A8FEA] text-white"
                : "bg-transparent hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab("Starred")}
            className={`flex-1 px-6 py-1 rounded-full cursor-pointer text-sm font-medium ${
              activeTab === "Starred"
                ? "bg-[#2A8FEA] text-white"
                : "bg-transparent hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Starred
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversationItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img
                src="/chats.svg"
                alt="No conversations"
                className="w-12 h-12"
              />
            </div>
            <p className="text-sm mb-3">
              {activeTab === "Unread"
                ? "No unread conversations"
                : activeTab === "Starred"
                ? "No starred conversations"
                : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            {conversationItems.map((conv) => (
              <div
                key={conv.jid}
                onClick={() => onConversationSelect(conv.jid)}
                className={`px-4 py-4 hover:rounded-lg cursor-pointer transition-colors ${
                  activeConversation === conv.jid
                    ? "bg-gray-100 rounded-lg"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    {/* MODIFIED AVATAR RENDERING */}
                    {conv.isContact &&
                    conv.displayAvatar &&
                    conv.displayAvatar.trim() &&
                    conv.displayAvatar !== "/chats.svg" ? (
                      // Show avatar for contacts with valid avatar
                      <img
                        src={conv.displayAvatar}
                        alt={conv.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      // Show initial with background color for:
                      // 1. Non-contacts
                      // 2. Contacts without avatars
                      // 3. Invalid avatars
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${getAvatarColor()}`}
                      >
                        <span className="text-white font-semibold text-lg">
                          {conv.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {conv.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate mb-1">
                          {conv.displayName}
                        </p>
                        <div className="flex items-center">
                          {conv.lastMessage.includes("You:") && (
                            <span className="text-sm mr-1">You:</span>
                          )}
                          {conv.lastMessage.includes("received") && (
                            <div className="w-4 h-4 rounded-full bg-[#2A8FEA] flex items-center justify-center mr-2">
                              <span className="text-white text-xs">Ksh </span>
                            </div>
                          )}
                          <p className="text-sm truncate">
                            {conv.lastMessage.replace("You:", "").trim()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <p className="text-xs mb-1">
                          {conv.lastMessageTime instanceof Date &&
                          !isNaN(conv.lastMessageTime.getTime())
                            ? conv.lastMessageTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Unknown time"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={handleStartChat}
        connected={connected}
      />
      <StatusViewerModal
        isOpen={showStatusViewer}
        onClose={() => setShowStatusViewer(false)}
        statusUser={selectedStatusUser}
        allStatusUsers={statusUsers}
        currentUserIndex={selectedUserIndex}
      />
      <StatusUploadModal
        isOpen={showStatusUpload}
        onClose={() => setShowStatusUpload(false)}
        onUpload={handleStatusUpload}
      />
    </div>
  );
};

export default RoomList;
