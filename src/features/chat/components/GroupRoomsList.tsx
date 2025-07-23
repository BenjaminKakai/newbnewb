import React, { useState } from "react";
import { GroupConversation } from "@/features/group/GroupPage";

interface GroupRoomListProps {
  groupConversations: GroupConversation[];
  activeGroupJid: string;
  loadingGroups: boolean;
  connected: boolean;
  onGroupSelect: (jid: string) => void;
  onNewGroup: () => void;
  fetchExistingGroups: () => void;
  getAvatarColor: () => string;
  getDisplayName: (jid: string) => string;
}

export const GroupRoomList: React.FC<GroupRoomListProps> = ({
  groupConversations,
  activeGroupJid,
  loadingGroups,
  connected,
  onGroupSelect,
  onNewGroup,
  fetchExistingGroups,
  getAvatarColor,
  getDisplayName,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  const handleMenuToggle = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right - 120, y: rect.bottom + 5 });
    setMenuOpen(!menuOpen);
  };

  const handleMenuOptionClick = (option: string) => {
    if (option === "New Group") {
      onNewGroup();
    }
    setMenuOpen(false);
  };

  const filteredGroups = groupConversations.filter((group) =>
    getDisplayName(group.jid).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 flex flex-col bg-gray-100 dark:bg-[var(--background)]">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Groups</h1>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
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
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div
            className="absolute bg-[var(--background)] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-2 w-32 z-50"
            style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
          >
            <button
              onClick={() => handleMenuOptionClick("New Group")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700"
            >
              New Group
            </button>
            <button
              onClick={() => handleMenuOptionClick("Starred Groups")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700"
            >
              Starred Groups
            </button>
            <button
              onClick={() => handleMenuOptionClick("Select Groups")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Select Groups
            </button>
          </div>
        )}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search groups"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
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
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingGroups ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading groups...
            </p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-6 text-center">

            <p className="text-sm mb-3 text-gray-500 dark:text-gray-400">
              No groups yet
            </p>
            <button
              onClick={fetchExistingGroups}
              disabled={!connected}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:text-gray-400 dark:disabled:text-gray-500 text-sm font-medium"
            >
              Try to load groups
            </button>
          </div>
        ) : (
          <div>
            {filteredGroups.map((group) => (
              <div
                key={group.jid}
                onClick={() => onGroupSelect(group.jid)}
                className={`px-4 py-4 hover:bg-gray-50 hover:rounded-lg cursor-pointer transition-colors ${
                  activeGroupJid === group.jid
                    ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor()}`}
                    >
                      <span className="text-lg">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate mb-1">
                          {group.name}
                        </p>
                        <p className="text-sm truncate">
                          {group.lastMessage}
                        </p>
                      </div>
                      <div className="flex flex-col items-end ml-2">
                        <p className="text-xs mb-1">
                          {group.lastMessageTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {group.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                            {group.unreadCount > 9 ? "9+" : group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};