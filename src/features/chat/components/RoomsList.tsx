import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import NewChatModal from "./NewChatModal";
import StatusViewerModal from "./StatusViewerModal";
import StatusUploadModal from "./StatuUploadModal";
import { toast } from "react-hot-toast";

interface Conversation {
  jid: string;
  name?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

interface Contact {
  id: string;
  name: string;
}

interface StatusUser {
  id: string;
  name: string;
  avatar?: string;
  statuses: StatusItem[];
}

interface StatusItem {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  views: number;
  isViewed: boolean;
}

interface StatusData {
  type: "text" | "image" | "video";
  content: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  image?: File;
}

interface RoomListProps {
  conversations: Conversation[];
  activeConversation: string;
  loadingConversations: boolean;
  connected: boolean;
  onConversationSelect: (jid: string) => void;
  fetchExistingConversations: () => void;
  contacts: Contact[];
}

const StatusComponent: React.FC<{
  statusUsers: StatusUser[];
  onStatusClick: (user: StatusUser, index: number) => void;
  onAddStatusClick: () => void;
}> = ({ statusUsers, onStatusClick, onAddStatusClick }) => {
  return (
    <div className="text-[var(--foreground)] rounded-lg mb-4">
      <div className="flex justify-end items-center mb-4">
        <h2 className="text-sm">All Status</h2>
      </div>

      <div className="flex space-x-6">
        {/* Add Status Section */}
        <div className="flex flex-col items-center space-y-3 min-w-0">
          <button
            onClick={onAddStatusClick}
            className="relative w-20 h-24 rounded-2xl bg-gray-300 flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
          </button>
          <div className="text-center">
            <div className="text-sm font-medium">Add Status</div>
          </div>
        </div>

        {/* Status Users Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {statusUsers.slice(0, 4).map((user, index) => (
            <div key={user.id} className="flex flex-col items-center space-y-3">
              {/* Container for card + avatar */}
              <div className="relative">
                <button
                  onClick={() => onStatusClick(user, index)}
                  className={`relative w-24 h-24 rounded-2xl overflow-hidden border-3 transition-all ${
                    user.statuses.some((s) => !s.isViewed)
                      ? "border-blue-400 ring-2 ring-blue-400/40"
                      : "border-gray-600"
                  }`}
                >
                  {/* Status Preview */}
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
                      className="w-full h-full flex items-center justify-center text-xs font-medium p-3 text-center"
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
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-semibold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* User Avatar Overlay - MOVED OUTSIDE BUTTON */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full border-3 border-gray-900 overflow-hidden z-10">
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

              {/* User Name */}
              <div className="text-sm font-medium text-center truncate max-w-24">
                {user.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoomList: React.FC<RoomListProps> = ({
  conversations,
  activeConversation,
  loadingConversations,
  connected,
  onConversationSelect,
  fetchExistingConversations,
  contacts,
}) => {
  const { user, accessToken } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [statusUsers, setStatusUsers] = useState<StatusUser[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [showStatusUpload, setShowStatusUpload] = useState(false);
  const [selectedStatusUser, setSelectedStatusUser] =
    useState<StatusUser | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  const getDisplayName = (jid: string) => {
    const username = jid.split("@")[0];
    const contact = contacts.find((c) => c.id === username);
    return contact
      ? contact.name
      : username.charAt(0).toUpperCase() + username.slice(1);
  };

  const getAvatarColor = () => "bg-gray-500";

  const handleMenuToggle = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right - 120, y: rect.bottom + 5 });
    setMenuOpen(!menuOpen);
  };

  const handleMenuOptionClick = (option: string) => {
    if (option === "New Chat") {
      setShowNewChatModal(true);
    }
    setMenuOpen(false);
  };

  const handleStartChat = (jid: string) => {
    onConversationSelect(jid);
  };

  const filteredConversations = () => {
    switch (activeTab) {
      case "Unread":
        return conversations.filter((conv) => conv.unreadCount > 0);
      case "Starred":
        return conversations.filter((conv) => false); // Placeholder
      default:
        return conversations;
    }
  };

  // Fetch statuses and map to StatusUser
  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const response = await fetch("http://138.68.190.213:38472/v1/status", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error("Failed to fetch statuses");
        const data = await response.json();
        const rawStatuses = data.data || [];

        // Group statuses by userId and map to StatusUser
        const statusUsersMap: { [key: string]: StatusUser } = {};
        rawStatuses.forEach((status: any) => {
          const userId = status.userId;
          const contact = contacts.find((c) => c.id === userId);
          const statusItem: StatusItem = {
            id: status.id,
            type: status.media.length > 0 ? status.media[0].type : "text",
            content: status.content,
            backgroundColor: "#3B82F6", // Default for text
            textColor: "#FFFFFF", // Default for text
            font: "font-sans", // Default for text
            imageUrl:
              status.media.length > 0 && status.media[0].type === "image"
                ? status.media[0].url
                : undefined,
            videoUrl:
              status.media.length > 0 && status.media[0].type === "video"
                ? status.media[0].url
                : undefined,
            timestamp: status.createdAt,
            views: status.views,
            isViewed: false, // Assume not viewed initially
          };

          if (!statusUsersMap[userId]) {
            statusUsersMap[userId] = {
              id: userId,
              name: contact?.name || userId,
              avatar: contact?.avatar,
              statuses: [],
            };
          }
          statusUsersMap[userId].statuses.push(statusItem);
        });

        const mappedStatuses: StatusUser[] = Object.values(statusUsersMap);

        // Add dummy statuses if none
        if (mappedStatuses.length === 0) {
          mappedStatuses.push(
            {
              id: "dummy1",
              name: contacts[0]?.name || "John Doe",
              avatar: contacts[0]?.avatar,
              statuses: [
                {
                  id: "dummy1-status1",
                  type: "text",
                  content: "Hello World!",
                  backgroundColor: "#3B82F6",
                  textColor: "#FFFFFF",
                  font: "font-sans",
                  timestamp: new Date().toISOString(),
                  views: 0,
                  isViewed: false,
                },
              ],
            },
            {
              id: "dummy2",
              name: contacts[1]?.name || "Jane Smith",
              avatar: contacts[1]?.avatar,
              statuses: [
                {
                  id: "dummy2-status1",
                  type: "image",
                  content: "",
                  imageUrl: "https://via.placeholder.com/400",
                  timestamp: new Date().toISOString(),
                  views: 0,
                  isViewed: false,
                },
              ],
            }
          );
        }
        setStatusUsers(mappedStatuses);
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
        toast.error("Failed to load statuses");
        // Add dummy statuses on error
        setStatusUsers([
          {
            id: "dummy1",
            name: contacts[0]?.name || "John Doe",
            avatar: contacts[0]?.avatar,
            statuses: [
              {
                id: "dummy1-status1",
                type: "text",
                content: "Hello World!",
                backgroundColor: "#3B82F6",
                textColor: "#FFFFFF",
                font: "font-sans",
                timestamp: new Date().toISOString(),
                views: 0,
                isViewed: false,
              },
            ],
          },
          {
            id: "dummy2",
            name: contacts[1]?.name || "Jane Smith",
            avatar: contacts[1]?.avatar,
            statuses: [
              {
                id: "dummy2-status1",
                type: "image",
                content: "",
                imageUrl: "https://via.placeholder.com/400",
                timestamp: new Date().toISOString(),
                views: 0,
                isViewed: false,
              },
            ],
          },
        ]);
      } finally {
        setIsLoadingStatuses(false);
      }
    };

    if (accessToken) {
      fetchStatuses();
    }
  }, [accessToken, contacts]);

  const handleStatusClick = (user: StatusUser, index: number) => {
    setSelectedStatusUser(user);
    setSelectedUserIndex(index);
    setShowStatusViewer(true);
  };

  const handleAddStatusClick = () => {
    setShowStatusUpload(true);
  };

  const handleStatusUpload = async (statusData: StatusData) => {
    try {
      const formData = new FormData();
      formData.append("type", statusData.type);
      if (statusData.type === "text") {
        formData.append("content", statusData.content);
        formData.append(
          "backgroundColor",
          statusData.backgroundColor || "#3B82F6"
        );
        formData.append("textColor", statusData.textColor || "#FFFFFF");
        formData.append("font", statusData.font || "font-sans");
      } else if (statusData.image) {
        formData.append("media", statusData.image);
      }

      const response = await fetch("http://138.68.190.213:38472/v1/status", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload status");
      toast.success("Status uploaded successfully");

      // Refetch statuses
      const fetchResponse = await fetch(
        "http://138.68.190.213:38472/v1/status",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await fetchResponse.json();
      const rawStatuses = data.data || [];
      const statusUsersMap: { [key: string]: StatusUser } = {};
      rawStatuses.forEach((status: any) => {
        const userId = status.userId;
        const contact = contacts.find((c) => c.id === userId);
        const statusItem: StatusItem = {
          id: status.id,
          type: status.media.length > 0 ? status.media[0].type : "text",
          content: status.content,
          backgroundColor: "#3B82F6",
          textColor: "#FFFFFF",
          font: "font-sans",
          imageUrl:
            status.media.length > 0 && status.media[0].type === "image"
              ? status.media[0].url
              : undefined,
          videoUrl:
            status.media.length > 0 && status.media[0].type === "video"
              ? status.media[0].url
              : undefined,
          timestamp: status.createdAt,
          views: status.views,
          isViewed: false,
        };

        if (!statusUsersMap[userId]) {
          statusUsersMap[userId] = {
            id: userId,
            name: contact?.name || userId,
            avatar: contact?.avatar,
            statuses: [],
          };
        }
        statusUsersMap[userId].statuses.push(statusItem);
      });
      setStatusUsers(Object.values(statusUsersMap));
    } catch (error) {
      console.error("Failed to upload status:", error);
      toast.error("Failed to upload status");
    }
  };

  return (
    <div className="w-90 bg-[var(--background)] text-[var(--foreground)] border-r border-gray-200 flex flex-col">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Chats</h1>
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:text-gray-700">
              <svg
                className="w-5 h-5"
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
            </button>
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
            className="absolute border border-gray-200 rounded-md shadow-lg py-2 w-32 z-50"
            style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
          >
            <button
              onClick={() => handleMenuOptionClick("New Chat")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              New Chat
            </button>
            <button
              onClick={() => handleMenuOptionClick("Starred Messages")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Starred Messages
            </button>
            <button
              onClick={() => handleMenuOptionClick("Select Chats")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Select Chats
            </button>
          </div>
        )}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search Chats"
            className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
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
        {/* Status Section */}
        {isLoadingStatuses ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
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
            className={`px-6 py-1 rounded-full text-sm font-medium ${
              activeTab === "All"
                ? "bg-blue-500 text-white"
                : "bg-transparent hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("Unread")}
            className={`px-6 py-1 rounded-full text-sm font-medium ${
              activeTab === "Unread"
                ? "bg-blue-500 text-white"
                : "bg-transparent hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab("Starred")}
            className={`px-6 py-1 rounded-full text-sm font-medium ${
              activeTab === "Starred"
                ? "bg-blue-500 text-white"
                : "bg-transparent hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Starred
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingConversations ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-sm">Loading conversations...</p>
          </div>
        ) : filteredConversations().length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img
                src="/chats.svg"
                alt="No conversations"
                className="w-12 h-12"
              />
            </div>
            <p className="text-sm mb-3">No conversations yet</p>
            {/* <button
              onClick={fetchExistingConversations}
              disabled={!connected}
              className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 text-sm font-medium"
            >
              Try to load conversations
            </button> */}
          </div>
        ) : (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            {filteredConversations().map((conv) => (
              <div
                key={conv.jid}
                onClick={() => onConversationSelect(conv.jid)}
                className={`px-4 py-4 hover:bg-gray-100 hover:rounded-lg cursor-pointer transition-colors ${
                  activeConversation === conv.jid
                    ? "bg-gray-100 rounded-lg"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor()}`}
                    >
                      {conv.avatar ? (
                        <img
                          src={conv.avatar}
                          alt={conv.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {(conv.name || getDisplayName(conv.jid))
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    {conv.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate mb-1">
                          {conv.name || getDisplayName(conv.jid)}
                        </p>
                        <div className="flex items-center">
                          {conv.lastMessage.includes("You:") && (
                            <span className="text-sm mr-1">You:</span>
                          )}
                          {conv.lastMessage.includes("received") && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-2">
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
                          {conv.lastMessageTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
