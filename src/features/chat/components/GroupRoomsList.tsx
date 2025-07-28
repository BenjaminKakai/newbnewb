import React, { useState } from "react";
import { GroupConversation } from "@/store/groupStore";

interface GroupRoomListProps {
  groups: GroupConversation[];
  activeGroup: string;
  onSelectGroup: (jid: string) => void;
  onNewGroup: () => void;
  getAvatarColor: () => string;
  getDisplayName: (jid: string) => string;
  getDummyAvatar: (id: string) => string;
}

export const GroupRoomList: React.FC<GroupRoomListProps> = ({
  groups,
  activeGroup,
  onSelectGroup,
  onNewGroup,
  getAvatarColor,
  getDisplayName,
  getDummyAvatar,
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
    // Placeholder for other menu options
    if (option === "Starred Groups") {
      console.log("Show starred groups");
    }
    if (option === "Select Groups") {
      console.log("Select groups");
    }
    setMenuOpen(false);
  };

  // Ensure groups is defined before filtering
  const filteredGroups = (groups || []).filter((group) =>
    group.jid && typeof getDisplayName(group.jid) === "string"
      ? getDisplayName(group.jid)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : false
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
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              New Group
            </button>
            <button
              onClick={() => handleMenuOptionClick("Starred Groups")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
            No groups found
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.jid}
              onClick={() => group.jid && onSelectGroup(group.jid)}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-200  ${
                activeGroup === group.jid ? "bg-gray-50 " : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor()}`}
                style={{
                  backgroundImage: `url(${getDummyAvatar(group.jid)})`,
                  backgroundSize: "cover",
                }}
              >
                {!getDummyAvatar(group.jid) && (
                  <span className="text-white font-medium">
                    {getDisplayName(group.jid)?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-semibold text-gray-900">
                    {getDisplayName(group.jid)}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {group.lastMessageTime instanceof Date &&
                    !isNaN(group.lastMessageTime.getTime())
                      ? group.lastMessageTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown time"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-sm truncate">
                    {group.lastMessage || "No messages"}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    • {group.membersCount ?? 0}{" "}
                    {group.membersCount === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
              {/* {group.unreadCount && group.unreadCount > 0 && (
                <div className="ml-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {group.unreadCount}
                </div>
              )} */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
