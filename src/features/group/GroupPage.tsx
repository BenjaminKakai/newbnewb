"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Strophe, $pres, $msg, $iq } from "strophe.js";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { ChatInput, MessageList, ChatHeader } from "../chat/components";
import UserInfo from "../chat/components/UserInfo";
import { GroupRoomList } from "../chat/components/GroupRoomsList";
import SidebarNav from "@/components/SidebarNav";
import { toast } from "react-hot-toast";

// Constants
const API_HOST = "http://xmpp-dev.wasaachat.com:8080/api/v1";
const BOSH_SERVICE = "http://xmpp-dev.wasaachat.com:5280/bosh";
const DOMAIN = "xmpp-dev.wasaachat.com";
const CONFERENCE_DOMAIN = "conference.xmpp-dev.wasaachat.com";

// Utility Functions
const isValidBareJid = (jid: string): boolean => {
  const jidRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return jidRegex.test(jid);
};

const getDisplayName = (
  jid: string,
  groupConversations: GroupConversation[]
) => {
  const group = groupConversations.find((g) => g.jid === jid);
  return group?.name || jid.split("@")[0] || "Unnamed Group";
};

const getAvatarColor = () => "bg-gray-500";

const getDummyAvatar = (id: string) => {
  return `https://ui-avatars.com/api/?name=${id}&background=6b7280&color=fff`;
};

// Types
export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  nickname: string;
}

export interface User {
  id: string;
  jid: string;
}

export interface GroupConversation {
  jid: string;
  name: string;
  description?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  memberCount: number;
  members: GroupMember[];
  type: "GROUP";
  avatar?: string;
  groupId: string;
}

export interface GroupMember {
  id: string;
  nickname: string;
  isOnline: boolean;
  role?: string;
  affiliation?: string;
}

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
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.style.setProperty("--background", "#292929");
      document.documentElement.style.setProperty("--foreground", "#ededed");
    } else {
      document.documentElement.style.setProperty("--background", "#ffffff");
      document.documentElement.style.setProperty("--foreground", "#171717");
    }
  }, [theme]);

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
    <div className="fixed inset-0 bg-[var(--background)]/50 border border-gray-600 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
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
            className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-blue-500"
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
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [activeGroupJid, setActiveGroupJid] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [groupConversations, setGroupConversations] = useState<
    GroupConversation[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [readGroups, setReadGroups] = useState<Set<string>>(new Set());
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 3;

  // Refs
  const connectionRef = useRef<any>(null);
  const connectionAttemptRef = useRef<boolean>(false);
  const mamHandlerRef = useRef<string | null>(null);
  const presenceHandlerRef = useRef<string | null>(null);

  // Authentication check
  useEffect(() => {
    const checkAuthStatus = () => {
      setIsCheckingAuth(true);
      if (!isAuthenticated || !user) {
        router.replace("/login");
        return;
      }
      setTimeout(() => setIsCheckingAuth(false), 100);
    };
    checkAuthStatus();
  }, [isAuthenticated, user, router]);

  const getCurrentUser = (): User | null => {
    if (!user?.id) return null;
    return {
      id: user.id,
      jid: `${user.id}@${DOMAIN}`,
    };
  };

  const currentUser = getCurrentUser();

  // Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.style.setProperty("--background", "#292929");
      document.documentElement.style.setProperty("--foreground", "#ededed");
    } else {
      document.documentElement.style.setProperty("--background", "#ffffff");
      document.documentElement.style.setProperty("--foreground", "#171717");
    }
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Load read groups
  useEffect(() => {
    if (currentUser?.id) {
      const savedReadGroups = localStorage.getItem(
        `readGroups_${currentUser.id}`
      );
      if (savedReadGroups) {
        setReadGroups(new Set(JSON.parse(savedReadGroups)));
      }
    }
  }, [currentUser?.id]);

  const saveReadGroups = (readSet: Set<string>) => {
    if (currentUser?.id) {
      localStorage.setItem(
        `readGroups_${currentUser.id}`,
        JSON.stringify([...readSet])
      );
    }
  };

  const markGroupAsRead = (jid: string) => {
    const newReadSet = new Set(readGroups);
    newReadSet.add(jid);
    setReadGroups(newReadSet);
    saveReadGroups(newReadSet);
    setGroupConversations((prev) =>
      prev.map((group) =>
        group.jid === jid ? { ...group, unreadCount: 0 } : group
      )
    );
  };

  useEffect(() => {
    xmppClient.updateCallbacks({
      onConnectionStatusChange: (status, connected) => {
        setConnectionStatus(status);
        setConnected(connected);
        if (!connected) {
          setConnectionError(`Connection status: ${status}`);
        } else {
          setConnectionError(null);
          fetchExistingGroups();
        }
      },
      onMessage: (message) => {
        if (message.type === "groupchat") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message].sort(
              (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
            );
          });
          updateGroupConversationsList(
            message.to,
            message.text,
            message.timestamp,
            message.to !== activeGroupJid
          );
        }
      },
      onPresence: (jid, presence) => {
        if (jid.includes(`@${CONFERENCE_DOMAIN}`)) {
          onPresence({ getAttribute: () => jid, getAttribute: (attr) => presence === "unavailable" ? "unavailable" : null });
        }
      },
    });
    return () => {
      xmppClient.disconnect();
    };
  }, []);

  // Connect to XMPP
  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser &&
      !connectionAttemptRef.current &&
      connectionAttempts < maxConnectionAttempts
    ) {
      connectionAttemptRef.current = true;
      connectToXMPP();
    }
  }, [isAuthenticated, currentUser, connectionAttempts]);

  const onConnect = (status: number) => {
    if (status === Strophe.Status.CONNECTING) {
      setConnectionStatus("Connecting...");
      setConnectionError(null);
      console.log("Strophe is connecting.");
    } else if (status === Strophe.Status.CONNFAIL) {
      setConnectionStatus("Connection failed");
      setConnectionError("Failed to connect to chat server. Retrying...");
      console.log("Strophe failed to connect.");
      setConnected(false);
      setLoading(false);
      if (connectionAttempts < maxConnectionAttempts) {
        setTimeout(() => {
          setConnectionAttempts((prev) => prev + 1);
          connectionAttemptRef.current = false;
        }, 3000);
      } else {
        setConnectionError(
          "Failed to connect after multiple attempts. Please try again later."
        );
        connectionAttemptRef.current = false;
      }
    } else if (status === Strophe.Status.DISCONNECTING) {
      setConnectionStatus("Disconnecting...");
      console.log("Strophe is disconnecting.");
    } else if (status === Strophe.Status.DISCONNECTED) {
      setConnectionStatus("Disconnected");
      console.log("Strophe is disconnected.");
      setConnected(false);
      setLoading(false);
      connectionAttemptRef.current = false;
    } else if (status === Strophe.Status.CONNECTED) {
      setConnectionStatus("Connected");
      setConnectionError(null);
      console.log("Strophe is connected.");
      setConnected(true);
      setLoading(false);
      setConnectionAttempts(0);
      connectionRef.current.send($pres().tree());
      connectionRef.current.addHandler(
        onMessage,
        null,
        "message",
        "groupchat",
        null,
        null
      );
      presenceHandlerRef.current = connectionRef.current.addHandler(
        onPresence,
        null,
        "presence",
        null,
        null,
        null
      );
      fetchExistingGroups();
    }
  };

  const onMessage = (msg: any) => {
    const from = msg.getAttribute("from");
    const type = msg.getAttribute("type");
    const body = msg.getElementsByTagName("body")[0];

    if (type === "groupchat" && body) {
      const text = Strophe.getText(body);
      const groupJid = from.split("/")[0];
      const nickname = from.split("/")[1] || "Unknown";
      const isOwn = nickname === currentUser?.id;

      if (!isValidBareJid(groupJid)) {
        console.error(`Invalid group JID: ${groupJid}`);
        return true;
      }

      const newMessage: Message = {
        id: msg.getAttribute("id") || uuidv4(),
        from,
        to: groupJid,
        text,
        timestamp: new Date(),
        isOwn,
        nickname,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
      });
      updateGroupConversationsList(
        groupJid,
        text,
        new Date(),
        !isOwn && groupJid !== activeGroupJid
      );
      console.log(`Group message from ${from}: ${text}`);
    }

    return true;
  };

  const onPresence = (presence: any) => {
    const from = presence.getAttribute("from");
    const type = presence.getAttribute("type") || "available";
    if (!from.includes(`@${CONFERENCE_DOMAIN}`)) return true;

    const groupJid = from.split("/")[0];
    const nickname = from.split("/")[1] || "Unknown";
    if (nickname === currentUser?.id) return true;

    if (!isValidBareJid(groupJid)) {
      console.error(`Invalid group JID in presence: ${groupJid}`);
      return true;
    }

    const xElement = presence.getElementsByTagNameNS(
      "http://jabber.org/protocol/muc#user",
      "x"
    )[0];
    let role, affiliation, realJid;

    if (xElement) {
      const item = xElement.getElementsByTagName("item")[0];
      if (item) {
        role = item.getAttribute("role");
        affiliation = item.getAttribute("affiliation");
        realJid = item.getAttribute("jid");
      }
    }

    const memberId = realJid ? realJid.split("@")[0] : nickname;
    const isOnline = type !== "unavailable";

    setGroupConversations((prev) =>
      prev.map((group) => {
        if (group.jid === groupJid) {
          const existingMemberIndex = group.members.findIndex(
            (m) => m.id === memberId
          );
          let updatedMembers = [...group.members];

          if (existingMemberIndex !== -1) {
            updatedMembers[existingMemberIndex] = {
              ...updatedMembers[existingMemberIndex],
              isOnline,
              role,
              affiliation,
              nickname,
            };
          } else if (isOnline) {
            updatedMembers.push({
              id: memberId,
              nickname,
              isOnline,
              role,
              affiliation,
            });
          }

          return {
            ...group,
            members: updatedMembers,
            memberCount: updatedMembers.length,
          };
        }
        return group;
      })
    );

    console.log(
      `Presence update in ${groupJid}: ${nickname} is ${
        isOnline ? "online" : "offline"
      }`
    );
    return true;
  };

  const updateGroupConversationsList = (
    jid: string,
    lastMessage: string,
    timestamp: Date,
    incrementUnread: boolean = false
  ) => {
    if (!isValidBareJid(jid)) {
      console.error(
        `Skipping updateGroupConversationsList due to invalid JID: ${jid}`
      );
      return;
    }
    setGroupConversations((prev) => {
      const existingIndex = prev.findIndex((group) => group.jid === jid);
      const isRead = readGroups.has(jid) && jid === activeGroupJid;

      if (existingIndex >= 0) {
        const updated = [...prev];
        const currentUnread = updated[existingIndex].unreadCount;
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: lastMessage || "No messages",
          lastMessageTime:
            timestamp instanceof Date && !isNaN(timestamp.getTime())
              ? timestamp
              : new Date(),
          unreadCount: isRead
            ? 0
            : incrementUnread
            ? currentUnread + 1
            : currentUnread,
        };
        return updated.sort(
          (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        );
      } else {
        const newGroup: GroupConversation = {
          jid,
          name: getDisplayName(jid, prev),
          lastMessage: lastMessage || "No messages",
          lastMessageTime:
            timestamp instanceof Date && !isNaN(timestamp.getTime())
              ? timestamp
              : new Date(),
          unreadCount: isRead ? 0 : incrementUnread ? 1 : 0,
          memberCount: 0,
          members: [],
          type: "GROUP",
          avatar: getDummyAvatar(jid),
          groupId: jid.split("@")[0],
        };
        return [newGroup, ...prev].sort(
          (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        );
      }
    });
  };

  const connectToXMPP = () => {
    if (!currentUser) {
      console.error("No authenticated user found");
      setConnectionError("No authenticated user found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setConnectionStatus("Connecting...");
    setConnectionError(null);

    const username = currentUser.id;
    const password = currentUser.id;

    console.log(`Connecting as: ${currentUser.jid}`);
    connectionRef.current.connect(currentUser.jid, password, onConnect);
  };

  const retryConnection = () => {
    if (connectionAttemptRef.current) return;
    setConnectionAttempts(0);
    connectionAttemptRef.current = true;
    connectToXMPP();
  };

  const fetchExistingGroups = async () => {
    if (!currentUser || !accessToken) return;

    setLoadingGroups(true);
    try {
      const response = await axios.get(
        `${API_HOST}/groups/user/${currentUser.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log("Fetched groups from API:", response.data);

      if (response.data && Array.isArray(response.data.results)) {
        const groups = response.data.results;
        const newGroups: GroupConversation[] = await Promise.all(
          groups
            .filter(
              (group: any) =>
                group && group.name && typeof group.name === "string"
            )
            .map(async (group: any) => {
              const groupJid = `${group.name}@${CONFERENCE_DOMAIN}`;
              if (!isValidBareJid(groupJid)) {
                console.error(`Invalid group JID: ${groupJid}`);
                return null;
              }
              const createdAt = group.created_at
                ? new Date(group.created_at)
                : new Date();
              if (isNaN(createdAt.getTime())) {
                console.warn(
                  `Invalid created_at for group ${group.name}: ${group.created_at}`
                );
                return null;
              }
              const members = await fetchGroupMembers(group.name);
              return {
                jid: groupJid,
                name: (
                  group.friendly_name ||
                  group.title ||
                  "Unnamed Group"
                ).replace("Unamed Group", "Unnamed Group"),
                description: group.description || "",
                lastMessage: group.last_chat_message?.txt || "Group created",
                lastMessageTime: createdAt,
                unreadCount: readGroups.has(groupJid) ? 0 : 0,
                memberCount: group.member_count ?? members.length,
                members,
                type: "GROUP",
                avatar: getDummyAvatar(groupJid),
                groupId: group.name,
              };
            })
        );

        const validGroups = newGroups.filter(
          (group): group is GroupConversation => group !== null
        );

        setGroupConversations((prev) => {
          const existingMap = new Map(prev.map((group) => [group.jid, group]));
          validGroups.forEach((newGroup) => {
            if (existingMap.has(newGroup.jid)) {
              const existing = existingMap.get(newGroup.jid)!;
              existingMap.set(newGroup.jid, {
                ...existing,
                name: newGroup.name,
                description: newGroup.description,
                lastMessage: newGroup.lastMessage,
                lastMessageTime: newGroup.lastMessageTime,
                unreadCount: readGroups.has(newGroup.jid)
                  ? existing.unreadCount
                  : newGroup.unreadCount,
                memberCount: newGroup.memberCount,
                members: newGroup.members,
                avatar: newGroup.avatar,
                groupId: newGroup.groupId,
              });
            } else {
              existingMap.set(newGroup.jid, newGroup);
            }
          });

          const updatedGroups = Array.from(existingMap.values()).sort(
            (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
          );

          console.log("Updated groupConversations:", updatedGroups);

          updatedGroups.forEach((group) => {
            joinGroup(group.jid);
          });

          return updatedGroups;
        });

        await fetchRecentMessagesMAM();
      } else {
        console.warn(
          "No groups data found in API response or invalid structure:",
          response.data
        );
      }
    } catch (error) {
      console.error("Failed to fetch groups from API:", error);
      toast.error("Failed to load groups. Please try again.");
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      const response = await axios.get(
        `${API_HOST}/groups/${groupId}/members`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results.map((member: any) => ({
          id: member.id || member.jid?.split("@")[0] || "unknown",
          nickname: member.nickname || member.name || member.id || "Unknown",
          isOnline: member.is_online || false,
          role: member.role || "none",
          affiliation: member.affiliation || "none",
        }));
      }
      console.warn(`No members found for group ${groupId}`);
      return [];
    } catch (error) {
      console.error(`Failed to fetch members for group ${groupId}:`, error);
      return [];
    }
  };

  const fetchRecentMessagesMAM = async (mamNS = "urn:xmpp:mam:2") => {
    if (!connected || !connectionRef.current) return;

    console.log(
      `Fetching recent group messages via MAM with namespace: ${mamNS}`
    );
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const iq = $iq({ type: "set", id: uuidv4() })
      .c("query", { xmlns: mamNS })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value")
      .t(mamNS)
      .up()
      .up()
      .c("field", { var: "start" })
      .c("value")
      .t(startDate.toISOString())
      .up()
      .up()
      .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
      .c("max")
      .t("50");

    connectionRef.current.sendIQ(
      iq,
      (response: any) => {
        console.log("MAM recent group messages query successful");
        const rsm = response.getElementsByTagName("set")[0];
        const complete = response.getAttribute("complete") === "true";
        if (rsm && !complete) {
          const last = rsm.getElementsByTagName("last")[0];
          if (last) {
            fetchRecentMessagesMAMNext(last.textContent, mamNS);
          }
        }
      },
      (error: any) => {
        console.error("MAM recent group messages query failed:", error);
        const condition = error.getAttribute("condition") || "unknown";
        if (condition === "improper-addressing" && mamNS === "urn:xmpp:mam:2") {
          console.log("Retrying MAM query with urn:xmpp:mam:1");
          fetchRecentMessagesMAM("urn:xmpp:mam:1");
        } else {
          setConnectionError(
            `Failed to fetch recent group messages: ${condition}`
          );
        }
      }
    );

    if (mamHandlerRef.current) {
      connectionRef.current.deleteHandler(mamHandlerRef.current);
    }

    mamHandlerRef.current = connectionRef.current.addHandler(
      (msg: any) => {
        const result = msg.getElementsByTagName("result")[0];
        if (result) {
          const forwarded = result.getElementsByTagName("forwarded")[0];
          if (forwarded) {
            const message = forwarded.getElementsByTagName("message")[0];
            const body = message?.getElementsByTagName("body")[0];

            if (body && message.getAttribute("type") === "groupchat") {
              const from = message.getAttribute("from");
              const groupJid = from.split("/")[0];
              const nickname = from.split("/")[1] || "Unknown";
              const text = Strophe.getText(body);
              const delay = forwarded.getElementsByTagName("delay")[0];
              const timestamp = delay
                ? new Date(delay.getAttribute("stamp") || "")
                : new Date();

              if (!isValidBareJid(groupJid)) {
                console.error(`Invalid group JID in MAM message: ${groupJid}`);
                return true;
              }

              console.log("Processing MAM message for group:", {
                groupJid,
                text,
                timestamp,
              });

              updateGroupConversationsList(groupJid, text, timestamp);
              const historicalMessage: Message = {
                id: message.getAttribute("id") || uuidv4(),
                from,
                to: groupJid,
                text,
                timestamp:
                  timestamp instanceof Date && !isNaN(timestamp.getTime())
                    ? timestamp
                    : new Date(),
                isOwn: nickname === currentUser?.id,
                nickname,
              };

              setMessages((prev) => {
                if (
                  prev.some(
                    (m) =>
                      m.id === historicalMessage.id ||
                      (m.text === text &&
                        Math.abs(
                          m.timestamp.getTime() -
                            historicalMessage.timestamp.getTime()
                        ) < 1000)
                  )
                ) {
                  return prev;
                }
                return [...prev, historicalMessage].sort(
                  (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                );
              });
            }
          }
        }
        return true;
      },
      mamNS,
      "message"
    );
  };

  const fetchRecentMessagesMAMNext = (lastId: string, mamNS: string) => {
    if (!connected || !connectionRef.current) return;

    const iq = $iq({ type: "set", id: uuidv4() })
      .c("query", { xmlns: mamNS })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value")
      .t(mamNS)
      .up()
      .up()
      .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
      .c("max")
      .t("50")
      .up()
      .c("after")
      .t(lastId);

    connectionRef.current.sendIQ(
      iq,
      (response: any) => {
        console.log("MAM next page query successful");
        const rsm = response.getElementsByTagName("set")[0];
        const complete = response.getAttribute("complete") === "true";
        if (rsm && !complete) {
          const last = rsm.getElementsByTagName("last")[0];
          if (last) {
            fetchRecentMessagesMAMNext(last.textContent, mamNS);
          }
        }
      },
      (error: any) => {
        console.error("MAM next page query failed:", error);
      }
    );
  };

  const fetchMessageHistory = async (groupJid: string) => {
    if (!connected || !currentUser || !accessToken) {
      console.warn(
        "Cannot fetch message history: not connected, no user, or no access token"
      );
      setLoadingHistory(false);
      return;
    }

    if (!isValidBareJid(groupJid)) {
      console.error(`Invalid group JID: ${groupJid}`);
      setConnectionError(`Invalid group JID: ${groupJid}`);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);
    try {
      const group = groupConversations.find((g) => g.jid === groupJid);
      if (!group || !group.groupId) {
        console.error(
          `Group not found or missing groupId for JID: ${groupJid}`
        );
        throw new Error("Group not found or invalid group ID");
      }
      const groupId = group.groupId;
      const response = await axios.get(
        `${API_HOST}/groups/user/${currentUser.id}/${groupId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log("Fetched group messages from API:", response.data);

      if (
        response.data &&
        response.data.results &&
        Array.isArray(response.data.results.results)
      ) {
        const apiMessages = response.data.results.results;
        const newMessages: Message[] = apiMessages
          .map((msg: any) => {
            if (!msg.id || !msg.username || !msg.txt || !msg.created_at) {
              console.warn("Skipping invalid message:", msg);
              return null;
            }
            const fromNickname =
              msg.user?.username || msg.username.split("/")[1] || "Unknown";
            const timestamp = new Date(msg.created_at);
            if (isNaN(timestamp.getTime())) {
              console.warn("Invalid message timestamp:", msg.created_at);
              return null;
            }
            return {
              id: msg.id,
              from: msg.username,
              to: groupJid,
              text: msg.txt,
              timestamp,
              isOwn: fromNickname === currentUser.id,
              nickname: fromNickname,
            };
          })
          .filter((msg: Message | null) => msg !== null);

        console.log("Processed messages:", newMessages);

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filteredMessages = newMessages.filter(
            (msg) => !existingIds.has(msg.id)
          );
          const updatedMessages = [...prev, ...filteredMessages].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          console.log("Updated messages state:", updatedMessages);
          return updatedMessages;
        });

        if (newMessages.length > 0) {
          const latestMessage = newMessages[newMessages.length - 1];
          updateGroupConversationsList(
            groupJid,
            latestMessage.text,
            latestMessage.timestamp,
            false
          );
        } else {
          if (response.data.friendly_name && group.name === "Unnamed Group") {
            setGroupConversations((prev) =>
              prev.map((g) =>
                g.jid === groupJid
                  ? {
                      ...g,
                      name: response.data.friendly_name.replace(
                        "Unamed Group",
                        "Unnamed Group"
                      ),
                      description:
                        response.data.description || g.description || "",
                      memberCount: response.data.member_count ?? g.memberCount,
                      lastMessage:
                        response.data.last_chat_message?.txt ||
                        g.lastMessage ||
                        "Group created",
                      lastMessageTime: response.data.created_at
                        ? new Date(response.data.created_at)
                        : g.lastMessageTime,
                    }
                  : g
              )
            );
          }
        }

        await fetchMessageHistoryMAM(groupJid);
      } else {
        console.warn(
          "No messages found in API response or invalid response structure:",
          response.data
        );
        if (response.data.friendly_name && group.name === "Unnamed Group") {
          setGroupConversations((prev) =>
            prev.map((g) =>
              g.jid === groupJid
                ? {
                    ...g,
                    name: response.data.friendly_name.replace(
                      "Unamed Group",
                      "Unnamed Group"
                    ),
                    description:
                      response.data.description || g.description || "",
                    memberCount: response.data.member_count ?? g.memberCount,
                    lastMessage:
                      response.data.last_chat_message?.txt ||
                      g.lastMessage ||
                      "Group created",
                    lastMessageTime: response.data.created_at
                      ? new Date(response.data.created_at)
                      : g.lastMessageTime,
                  }
                : g
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch group messages from API:", error);
      setConnectionError("Failed to load group messages. Please try again.");
      toast.error("Failed to load group messages.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchMessageHistoryMAM = (
    groupJid: string,
    mamNS = "urn:xmpp:mam:2"
  ) => {
    if (!connected || !connectionRef.current) return;

    console.log(
      `Fetching MAM history for group JID: ${groupJid} with namespace: ${mamNS}`
    );
    const iq = $iq({ type: "set", id: uuidv4() })
      .c("query", { xmlns: mamNS })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value")
      .t(mamNS)
      .up()
      .up()
      .c("field", { var: "with" })
      .c("value")
      .t(groupJid)
      .up()
      .up()
      .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
      .c("max")
      .t("50");

    connectionRef.current.sendIQ(
      iq,
      (response: any) => {
        console.log("MAM group query successful:", response);
        const rsm = response.getElementsByTagName("set")[0];
        const complete = response.getAttribute("complete") === "true";
        if (rsm && !complete) {
          const last = rsm.getElementsByTagName("last")[0];
          if (last) {
            fetchMessageHistoryMAMNext(groupJid, last.textContent, mamNS);
          }
        }
      },
      (error: any) => {
        console.error("MAM group query failed:", error);
        const condition = error.getAttribute("condition") || "unknown";
        if (condition === "improper-addressing" && mamNS === "urn:xmpp:mam:2") {
          console.log("Retrying MAM query with urn:xmpp:mam:1");
          fetchMessageHistoryMAM(groupJid, "urn:xmpp:mam:1");
        } else {
          setConnectionError(
            `Failed to fetch group message history: ${condition}`
          );
        }
      }
    );
  };

  const fetchMessageHistoryMAMNext = (
    groupJid: string,
    lastId: string,
    mamNS = "urn:xmpp:mam:2"
  ) => {
    if (!connected || !connectionRef.current) return;

    const iq = $iq({ type: "set", id: uuidv4() })
      .c("query", { xmlns: mamNS })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value")
      .t(mamNS)
      .up()
      .up()
      .c("field", { var: "with" })
      .c("value")
      .t(groupJid)
      .up()
      .up()
      .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
      .c("max")
      .t("50")
      .up()
      .c("after")
      .t(lastId);

    connectionRef.current.sendIQ(
      iq,
      (response: any) => {
        console.log("MAM group history next page query successful");
        const rsm = response.getElementsByTagName("set")[0];
        const complete = response.getAttribute("complete") === "true";
        if (rsm && !complete) {
          const last = rsm.getElementsByTagName("last")[0];
          if (last) {
            fetchMessageHistoryMAMNext(groupJid, last.textContent, mamNS);
          }
        }
      },
      (error: any) => {
        console.error("MAM group history next page query failed:", error);
      }
    );
  };

  const joinGroup = async (groupJid: string) => {
    if (!currentUser) {
      console.warn("Cannot join group: no user");
      setConnectionError("No authenticated user found");
      return;
    }
  
    if (!isValidBareJid(groupJid)) {
      console.error(`Invalid group JID: ${groupJid}`);
      setConnectionError(`Invalid group JID: ${groupJid}`);
      return;
    }
  
    const ensureConnected = async () => {
      if (
        connectionRef.current &&
        connectionRef.current.connected === true &&
        connectionRef.current.authenticated === true
      ) {
        return true;
      }
  
      if (connectionAttempts >= maxConnectionAttempts) {
        console.error("Max connection attempts reached");
        setConnectionError("Failed to connect after multiple attempts. Please try again later.");
        return false;
      }
  
      console.log("Connection not ready, attempting to connect...");
      setConnectionStatus("Connecting...");
      setConnectionError(null);
      connectionAttemptRef.current = true;
  
      try {
        await connectToXMPP();
        // Wait for connection to be established
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (
              connectionRef.current &&
              connectionRef.current.connected === true &&
              connectionRef.current.authenticated === true
            ) {
              clearInterval(checkInterval);
              setConnectionStatus("Connected");
              setConnected(true);
              setConnectionAttempts(0);
              connectionAttemptRef.current = false;
              resolve(true);
            }
          }, 500);
  
          setTimeout(() => {
            clearInterval(checkInterval);
            if (
              !connectionRef.current ||
              connectionRef.current.connected !== true ||
              connectionRef.current.authenticated !== true
            ) {
              console.error("Connection timeout");
              setConnectionError("Connection timeout. Retrying...");
              setConnectionAttempts((prev) => prev + 1);
              connectionAttemptRef.current = false;
              reject(false);
            }
          }, 10000); // 10-second timeout
        });
      } catch (error) {
        console.error("Connection attempt failed:", error);
        setConnectionError("Failed to connect to chat server. Retrying...");
        setConnectionAttempts((prev) => prev + 1);
        connectionAttemptRef.current = false;
        return false;
      }
    };
  
    const isConnected = await ensureConnected();
    if (!isConnected || !connectionRef.current) {
      console.warn("Cannot join group: connection not established");
      setConnectionError("Failed to establish connection to join group");
      return;
    }
  
    const groupId = groupJid.split("@")[0];
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14); // e.g., 20250723180943
    const fromJid = `${currentUser.id}@${DOMAIN}/${timestamp}`;
    const toJid = `${groupId}@${CONFERENCE_DOMAIN}/${currentUser.id}`;
  
    const presence = $pres({
      from: fromJid,
      to: toJid,
      xmlns: "jabber:client",
    }).c("x", { xmlns: "http://jabber.org/protocol/muc" });
  
    connectionRef.current.send(presence.tree());
    console.log(`Sent presence to join group: ${groupJid}, from: ${fromJid}, to: ${toJid}`);
  };

  const startGroupConversation = (groupJid: string) => {
    if (!isValidBareJid(groupJid)) {
      console.error(`Invalid group JID: ${groupJid}`);
      setConnectionError(`Invalid group JID: ${groupJid}`);
      return;
    }
    setActiveGroupJid(groupJid);
    markGroupAsRead(groupJid);
    fetchMessageHistory(groupJid);
    joinGroup(groupJid);
  };

  const sendMessage = () => {
    if (!connected || !messageText.trim() || !activeGroupJid || !currentUser) {
      toast.error("Cannot send message: Not connected or no group selected");
      return;
    }

    if (!isValidBareJid(activeGroupJid)) {
      console.error(`Invalid group JID: ${activeGroupJid}`);
      setConnectionError(`Invalid group JID: ${activeGroupJid}`);
      return;
    }

    const messageId = `msg_${Date.now()}`;
    const message = $msg({
      to: activeGroupJid,
      type: "groupchat",
      id: messageId,
    })
      .c("body")
      .t(messageText);

    connectionRef.current.send(message.tree());

    const newMessage: Message = {
      id: messageId,
      from: `${activeGroupJid}/${currentUser.id}`,
      to: activeGroupJid,
      text: messageText,
      timestamp: new Date(),
      isOwn: true,
      nickname: currentUser.id,
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMessage.id)) return prev;
      return [...prev, newMessage].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
    });
    updateGroupConversationsList(activeGroupJid, messageText, new Date());
    setMessageText("");
    console.log(`Sent group message to ${activeGroupJid}: ${messageText}`);
  };

  const addGroupMember = async (groupJid: string, memberId: string) => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        memberId
      )
    ) {
      toast.error("Invalid user ID. Must be a valid UUID.");
      return;
    }

    const group = groupConversations.find((g) => g.jid === groupJid);
    if (!group || !group.groupId) {
      toast.error("Invalid group ID.");
      return;
    }
    const groupId = group.groupId;
    try {
      await axios.post(
        `${API_HOST}/groups/${groupId}/add-member`,
        { ID: memberId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Member added successfully");
      const members = await fetchGroupMembers(groupId);
      setGroupConversations((prev) =>
        prev.map((group) =>
          group.jid === groupJid
            ? { ...group, members, memberCount: members.length }
            : group
        )
      );
    } catch (error) {
      console.error("Failed to add member:", error);
      toast.error("Failed to add member. Please try again.");
    }
  };

  const removeGroupMember = async (groupJid: string, memberId: string) => {
    const group = groupConversations.find((g) => g.jid === groupJid);
    if (!group || !group.groupId) {
      toast.error("Invalid group ID.");
      return;
    }
    const groupId = group.groupId;
    try {
      await axios.delete(
        `${API_HOST}/groups/${groupId}/remove-member/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Member removed successfully");
      const members = await fetchGroupMembers(groupId);
      setGroupConversations((prev) =>
        prev.map((group) =>
          group.jid === groupJid
            ? { ...group, members, memberCount: members.length }
            : group
        )
      );
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member. Please try again.");
    }
  };

  const exitGroup = (groupJid: string) => {
    if (!connected || !connectionRef.current || !currentUser) return;

    if (!isValidBareJid(groupJid)) {
      console.error(`Invalid group JID: ${groupJid}`);
      setConnectionError(`Invalid group JID: ${groupJid}`);
      return;
    }

    const presence = $pres({
      to: `${groupJid}/${currentUser.id}`,
      type: "unavailable",
    });
    connectionRef.current.send(presence.tree());

    setGroupConversations((prev) =>
      prev.filter((group) => group.jid !== groupJid)
    );
    if (activeGroupJid === groupJid) {
      setActiveGroupJid("");
    }
    console.log(`Left group: ${groupJid}`);
  };

  const handleCreateGroup = async (groupName: string, description: string) => {
    if (!currentUser || !accessToken) return;

    try {
      const response = await axios.post(
        `${API_HOST}/groups`,
        {
          title: groupName,
          description: description,
          ID: currentUser.id,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.name) {
        const groupJid = `${response.data.name}@${CONFERENCE_DOMAIN}`;
        if (!isValidBareJid(groupJid)) {
          console.error(`Invalid group JID created: ${groupJid}`);
          throw new Error(`Invalid group JID: ${groupJid}`);
        }
        const createdAt = response.data.created_at
          ? new Date(response.data.created_at)
          : new Date();
        const members = await fetchGroupMembers(response.data.name);
        setGroupConversations((prev) => {
          if (prev.some((group) => group.jid === groupJid)) {
            return prev;
          }
          const newGroup: GroupConversation = {
            jid: groupJid,
            name: (response.data.friendly_name || groupName).replace(
              "Unamed Group",
              "Unnamed Group"
            ),
            description: response.data.description || description,
            lastMessage: "Group created",
            lastMessageTime: isNaN(createdAt.getTime())
              ? new Date()
              : createdAt,
            unreadCount: 0,
            memberCount: response.data.member_count ?? members.length,
            members,
            type: "GROUP",
            avatar: getDummyAvatar(groupJid),
            groupId: response.data.name,
          };
          return [newGroup, ...prev].sort(
            (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
          );
        });
        joinGroup(groupJid);
        startGroupConversation(groupJid);
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      throw error;
    }
  };

  const disconnect = () => {
    if (connectionRef.current && connected) {
      groupConversations.forEach((group) => {
        const presence = $pres({
          to: `${group.jid}/${currentUser?.id}`,
          type: "unavailable",
        });
        connectionRef.current.send(presence.tree());
      });
      if (mamHandlerRef.current) {
        connectionRef.current.deleteHandler(mamHandlerRef.current);
      }
      if (presenceHandlerRef.current) {
        connectionRef.current.deleteHandler(presenceHandlerRef.current);
      }
      connectionRef.current.disconnect();
    }
  };

  // Render loading state during auth check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-white text-sm">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[var(--background)] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {connectionError}
          </p>
          <button
            onClick={retryConnection}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const currentGroupDetails = groupConversations.find(
    (group) => group.jid === activeGroupJid
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
      <SidebarNav onClose={() => {}} currentPath={pathname} />
      <div className="flex-1 flex ml-20">
        <GroupRoomList
          groupConversations={groupConversations}
          activeGroupJid={activeGroupJid}
          loadingGroups={loadingGroups}
          connected={connected}
          onGroupSelect={startGroupConversation}
          onNewGroup={() => setShowNewGroupModal(true)}
          fetchExistingGroups={fetchExistingGroups}
          getAvatarColor={getAvatarColor}
          getDisplayName={(jid) => getDisplayName(jid, groupConversations)}
        />
        <div className="flex-1 flex flex-col">
          {activeGroupJid ? (
            <>
              <ChatHeader
                activeConversation={activeGroupJid}
                getDisplayName={(jid) =>
                  getDisplayName(jid, groupConversations)
                }
                getAvatarColor={getAvatarColor}
                onCallClick={() => console.log("Group call not implemented")}
                onVideoClick={() =>
                  console.log("Group video call not implemented")
                }
                onInfoClick={() => setShowUserInfoModal(true)}
              />
              <div className="flex-1 overflow-y-auto">
                <MessageList
                  messages={messages.filter((msg) => msg.to === activeGroupJid)}
                  loadingHistory={loadingHistory}
                  activeConversation={activeGroupJid}
                  getNickname={(msg: Message) => msg.nickname}
                />
              </div>
              <ChatInput
                messageText={messageText}
                setMessageText={setMessageText}
                onSendMessage={sendMessage}
                connected={connected}
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
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onCreateGroup={handleCreateGroup}
        userId={currentUser?.id || ""}
        accessToken={accessToken || ""}
      />
      {showUserInfoModal && currentGroupDetails && (
        <UserInfo
          conversation={currentGroupDetails}
          currentUserId={currentUser?.id || ""}
          setShowUserInfoModal={setShowUserInfoModal}
          addGroupMember={addGroupMember}
          removeGroupMember={removeGroupMember}
          exitGroup={exitGroup}
          connection={connectionRef.current}
          connected={connected}
        />
      )}
    </div>
  );
};

export default GroupPage;
