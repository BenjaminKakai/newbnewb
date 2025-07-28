import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Strophe, $iq, $pres } from "strophe.js";
import { xmppClient } from "@/services/xmppClient";

const API_HOST = process.env.NEXT_PUBLIC_XMPP_API_HOST;
const DOMAIN = process.env.NEXT_PUBLIC_XMPP_DOMAIN;
const CONFERENCE_DOMAIN = process.env.NEXT_PUBLIC_XMPP_CONFERENCE_DOMAIN;

interface ConversationMember {
  id: string;
  name?: string;
  avatar?: string;
  phoneNumber?: string;
  lastSeen?: string;
}

export interface GroupConversation {
  jid: string;
  name?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  type: "GROUP";
  members?: ConversationMember[];
  starred?: boolean;
  groupId?: string;
  description?: string;
  membersCount?: number;
}

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  nickname?: string;
}

interface User {
  id: string;
  jid: string;
}

interface GroupStore {
  groupConversations: GroupConversation[];
  readGroupConversations: string[];
  groupMessages: Message[];
  connected: boolean;
  connectionStatus: string;
  connectionError: string | null;
  activeGroupConversation: string;
  currentUser: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setGroupConversations: (conversations: GroupConversation[]) => void;
  updateGroupConversation: (
    jid: string,
    updates: Partial<GroupConversation>
  ) => void;
  addGroupConversation: (conversation: GroupConversation) => void;
  removeGroupConversation: (jid: string) => void;
  markGroupConversationAsRead: (jid: string) => void;
  toggleStarredGroupConversation: (jid: string) => void;
  clearGroupConversations: () => void;
  initializeConnection: (
    user: User | null,
    accessToken: string | null,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => void;
  cleanupConnection: () => void;
  disconnect: () => void;
  sendGroupMessage: (
    groupJid: string,
    messageText: string,
    currentUser: User | null
  ) => void;
  joinGroup: (groupJid: string, currentUser: User | null) => void;
  leaveGroup: (groupJid: string, currentUser: User | null) => void;
  createGroup: (
    groupName: string,
    description: string,
    currentUser: User | null,
    accessToken: string | null,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => Promise<void>;
  fetchExistingGroups: (
    currentUser: User | null,
    accessToken: string | null,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => Promise<void>;
  startGroupConversation: (
    jid: string,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => void;
  refreshGroups: () => Promise<void>;
}

let hasInitialized = false;

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => {
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;

      const isValidBareJid = (jid: string): boolean => {
        const jidRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        return jidRegex.test(jid);
      };

      const ensureDate = (value: any): Date => {
        if (value instanceof Date) return value;
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? new Date() : date;
        }
        return new Date();
      };

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

      const updateGroupConversationsList = (
        jid: string,
        lastMessage: string,
        timestamp: Date,
        incrementUnread: boolean = false,
        getContactName: (userId: string, currentUserId?: string) => string,
        currentUserId?: string,
        nickname?: string
      ) => {
        const state = get();
        const userId = jid.split("@")[0];
        const existingConv = state.groupConversations.find(
          (conv) => conv.jid === jid
        );
        const isRead = state.readGroupConversations.includes(jid);

        if (existingConv) {
          set((state) => ({
            groupConversations: state.groupConversations.map((conv) =>
              conv.jid === jid
                ? {
                    ...conv,
                    lastMessage: nickname
                      ? `${nickname}: ${lastMessage}`
                      : lastMessage,
                    lastMessageTime: ensureDate(timestamp),
                    unreadCount: isRead
                      ? 0
                      : incrementUnread
                      ? (conv.unreadCount || 0) + 1
                      : conv.unreadCount || 0,
                    name: conv.name || getContactName(userId, currentUserId),
                    type: "GROUP" as const,
                  }
                : conv
            ).sort(
              (a, b) =>
                b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
            ),
          }));
        } else {
          const newConversation: GroupConversation = {
            jid,
            name: getContactName(userId, currentUserId),
            lastMessage: nickname
              ? `${nickname}: ${lastMessage}`
              : lastMessage,
            lastMessageTime: ensureDate(timestamp),
            unreadCount: isRead ? 0 : incrementUnread ? 1 : 0,
            type: "GROUP" as const,
            avatar: getDummyAvatar(jid),
            groupId: userId,
            description: "",
            starred: false,
          };

          set((state) => ({
            groupConversations: [
              newConversation,
              ...state.groupConversations,
            ].sort(
              (a, b) =>
                b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
            ),
          }));
        }
      };

      const fetchGroupConversationsFromAPI = async (
        currentUser: User | null,
        accessToken: string | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!API_HOST || !currentUser || !accessToken) {
          console.warn("Missing API_HOST, currentUser, or accessToken");
          return;
        }

        set({ isLoading: true });

        try {
          console.log("Fetching groups for user:", currentUser.id);

          const response = await axios.get(
            `${API_HOST}/groups/user/${currentUser.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              timeout: 10000, // 10 second timeout
            }
          );

          console.log("Groups API response:", response.data);

          if (response.data && Array.isArray(response.data.results)) {
            const groups = response.data.results;
            const newGroups: GroupConversation[] = groups
              .filter((group: any) => {
                if (!group || !group.name || typeof group.name !== "string") {
                  console.warn("Invalid group data:", group);
                  return false;
                }
                return true;
              })
              .map((group: any) => {
                const groupJid = `${group.name}@${CONFERENCE_DOMAIN}`;
                
                if (!isValidBareJid(groupJid)) {
                  console.error(`Invalid group JID: ${groupJid}`);
                  return null;
                }

                const createdAt = group.created_at
                  ? ensureDate(group.created_at)
                  : new Date();
                
                const lastMessage = group.last_chat_message?.txt || "Group created";
                const lastMessageTime = group.last_chat_message?.created_at
                  ? ensureDate(group.last_chat_message.created_at)
                  : createdAt;

                return {
                  jid: groupJid,
                  name: group.friendly_name || group.title || "Unnamed Group",
                  description: group.description || "",
                  lastMessage,
                  lastMessageTime,
                  unreadCount: get().readGroupConversations.includes(groupJid)
                    ? 0
                    : 0,
                  type: "GROUP" as const,
                  avatar: getDummyAvatar(groupJid),
                  groupId: group.name,
                  starred: false,
                  members: group.members || [
                    {
                      id: group.last_chat_message?.user?.id || currentUser.id,
                      name: getContactName(
                        group.last_chat_message?.user?.id || currentUser.id,
                        currentUser.id
                      ),
                      avatar:
                        group.last_chat_message?.user?.profile_picture ||
                        getDummyAvatar(
                          group.last_chat_message?.user?.id || currentUser.id
                        ),
                      phoneNumber: group.last_chat_message?.user?.phone_number,
                    },
                  ],
                };
              })
              .filter((group): group is GroupConversation => group !== null);

            console.log("Processed groups:", newGroups);

            if (newGroups.length > 0) {
              set((state) => {
                const existingMap = new Map(
                  state.groupConversations.map((conv) => [conv.jid, conv])
                );

                newGroups.forEach((newGroup) => {
                  if (existingMap.has(newGroup.jid)) {
                    const existing = existingMap.get(newGroup.jid)!;
                    existingMap.set(newGroup.jid, {
                      ...existing,
                      name: newGroup.name,
                      description: newGroup.description,
                      lastMessage: newGroup.lastMessage,
                      lastMessageTime: newGroup.lastMessageTime,
                      avatar: newGroup.avatar,
                      groupId: newGroup.groupId,
                      members: newGroup.members || existing.members,
                    });
                  } else {
                    existingMap.set(newGroup.jid, newGroup);
                  }
                });

                const updatedConversations = Array.from(
                  existingMap.values()
                ).sort(
                  (a, b) =>
                    b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
                );

                return { 
                  groupConversations: updatedConversations,
                  isLoading: false 
                };
              });

              // Join groups and fetch messages after state is updated
              setTimeout(() => {
                newGroups.forEach((group) => {
                  if (currentUser && xmppClient.isConnected()) {
                    xmppClient.joinGroup(group.jid, currentUser.id);
                    fetchMAMMessages(group.jid, currentUser);
                  }
                });
              }, 1000);
            } else {
              set({ isLoading: false });
              console.log("No groups found or all groups were invalid");
            }
          } else {
            set({ isLoading: false });
            console.log("No results in API response");
          }
        } catch (error) {
          console.error("Failed to fetch groups from API:", error);
          
          if (axios.isAxiosError(error)) {
            console.error("API Error Status:", error.response?.status);
            console.error("API Error Data:", error.response?.data);
            console.error("API Error Headers:", error.response?.headers);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.statusText || 
                               "Failed to fetch groups";
            
            set({ 
              connectionError: errorMessage,
              isLoading: false 
            });
          } else {
            set({ 
              connectionError: "Network error while fetching groups",
              isLoading: false 
            });
          }
        }
      };

      const fetchGroupMessageHistoryAPI = async (
        groupJid: string,
        currentUser: User | null
      ) => {
        if (!currentUser || !API_HOST) return;

        const userId = groupJid.split("@")[0];
        const endpoint = `${API_HOST}/groups/user/${currentUser.id}/${userId}`;

        try {
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${get().accessToken}` },
            timeout: 10000,
          });

          let apiMessages: Message[] = [];
          if (response.data?.results?.results) {
            apiMessages = response.data.results.results
              .map((msg: any) => {
                if (!msg.id || !msg.username || !msg.txt || !msg.created_at)
                  return null;
                
                const fromNickname =
                  msg.user?.username || msg.username.split("/")[1] || "Unknown";
                const timestamp = ensureDate(msg.created_at);
                
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
          }

          if (apiMessages.length > 0) {
            set((state) => ({
              groupMessages: [...state.groupMessages, ...apiMessages]
                .filter(
                  (msg, index, self) =>
                    index ===
                    self.findIndex(
                      (m) =>
                        m.text === msg.text &&
                        Math.abs(
                          m.timestamp.getTime() - msg.timestamp.getTime()
                        ) < 1000
                    )
                )
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
            }));
          }

          // Update group info if available
          if (response.data?.results) {
            const groupData = response.data.results;
            set((state) => ({
              groupConversations: state.groupConversations.map((conv) =>
                conv.jid === groupJid
                  ? {
                      ...conv,
                      name:
                        groupData.friendly_name ||
                        groupData.title ||
                        conv.name ||
                        "Unnamed Group",
                      description: groupData.description || conv.description,
                      lastMessage:
                        groupData.last_chat_message?.txt ||
                        conv.lastMessage ||
                        "Group created",
                      lastMessageTime: groupData.created_at
                        ? ensureDate(groupData.created_at)
                        : conv.lastMessageTime,
                    }
                  : conv
              ),
            }));
          }
        } catch (error) {
          console.error(
            "Failed to fetch group message history from API:",
            error
          );
        }
      };

      const fetchMAMMessages = (groupJid: string, currentUser: User | null) => {
        if (!currentUser || !xmppClient.isConnected()) return;

        const iq = $iq({ type: "set", id: `mam_${uuidv4()}` })
          .c("query", { xmlns: "urn:xmpp:mam:2" })
          .c("x", { xmlns: "http://jabber.org/protocol/xdata", type: "submit" })
          .c("field", { var: "FORM_TYPE", type: "hidden" })
          .c("value")
          .t("urn:xmpp:mam:2")
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

        xmppClient.sendIQ(
          iq.tree(),
          (response: any) => {
            console.log("MAM query successful for group:", groupJid);
          },
          (error: any) => {
            console.error("MAM query failed for group:", groupJid, error);
          }
        );
      };

      return {
        groupConversations: [],
        readGroupConversations: [],
        groupMessages: [],
        connected: false,
        connectionStatus: "Disconnected",
        connectionError: null,
        activeGroupConversation: "",
        currentUser: null,
        accessToken: null,
        isLoading: false,

        setGroupConversations: (conversations) =>
          set({
            groupConversations: conversations.map((conv) => ({
              ...conv,
              lastMessageTime: ensureDate(conv.lastMessageTime),
              starred: conv.starred ?? false,
              unreadCount: conv.unreadCount ?? 0,
            })),
          }),

        updateGroupConversation: (jid, updates) =>
          set((state) => ({
            groupConversations: state.groupConversations.map((conv) =>
              conv.jid === jid
                ? {
                    ...conv,
                    ...updates,
                    lastMessageTime: ensureDate(
                      updates.lastMessageTime || conv.lastMessageTime
                    ),
                  }
                : conv
            ),
          })),

        addGroupConversation: (conversation) =>
          set((state) => ({
            groupConversations: [
              {
                ...conversation,
                lastMessageTime: ensureDate(conversation.lastMessageTime),
                starred: conversation.starred ?? false,
                unreadCount: conversation.unreadCount ?? 0,
              },
              ...state.groupConversations,
            ].sort(
              (a, b) =>
                b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
            ),
          })),

        removeGroupConversation: (jid) =>
          set((state) => ({
            groupConversations: state.groupConversations.filter(
              (conv) => conv.jid !== jid
            ),
          })),

        markGroupConversationAsRead: (jid) =>
          set((state) => ({
            readGroupConversations: [
              ...new Set([...state.readGroupConversations, jid]),
            ],
            groupConversations: state.groupConversations.map((conv) =>
              conv.jid === jid ? { ...conv, unreadCount: 0 } : conv
            ),
          })),

        toggleStarredGroupConversation: (jid) =>
          set((state) => ({
            groupConversations: state.groupConversations.map((conv) =>
              conv.jid === jid ? { ...conv, starred: !conv.starred } : conv
            ),
          })),

        clearGroupConversations: () =>
          set({
            groupConversations: [],
            readGroupConversations: [],
            groupMessages: [],
          }),

        initializeConnection: (
          user: User | null,
          accessToken: string | null,
          getContactName: (userId: string, currentUserId?: string) => string
        ) => {
          if (!DOMAIN || !user || !accessToken) {
            set({
              connectionError: "Missing XMPP configuration or user data",
              connectionStatus: "Disconnected",
            });
            return;
          }

          console.log("Initializing group store connection for user:", user.id);
          set({ 
            currentUser: user, 
            accessToken,
            connectionError: null 
          });

          // Fetch groups immediately if not connected to XMPP yet
          fetchGroupConversationsFromAPI(user, accessToken, getContactName);

          xmppClient.connect(user.jid, user.id, (status) => {
            if (status === Strophe.Status.CONNECTING) {
              set({ connectionStatus: "Connecting...", connectionError: null });
            } else if (status === Strophe.Status.CONNFAIL) {
              set({
                connectionStatus: "Connection failed",
                connectionError: "Failed to connect. Retrying...",
                connected: false,
              });
              if (connectionAttempts < maxConnectionAttempts) {
                setTimeout(() => {
                  connectionAttempts++;
                  xmppClient.connect(user.jid, user.id, arguments.callee);
                }, 3000);
              } else {
                set({
                  connectionError: "Failed to connect after multiple attempts.",
                  connectionStatus: "Disconnected",
                });
              }
            } else if (status === Strophe.Status.DISCONNECTING) {
              set({ connectionStatus: "Disconnecting..." });
            } else if (status === Strophe.Status.DISCONNECTED) {
              set({ connectionStatus: "Disconnected", connected: false });
            } else if (status === Strophe.Status.CONNECTED) {
              set({
                connectionStatus: "Connected",
                connectionError: null,
                connected: true,
              });
              
              xmppClient.setConnected(true);
              xmppClient.send($pres().tree());

              // Add group message handler
              xmppClient.addGroupMessageHandler((msg: any) => {
                const from = msg.getAttribute("from");
                const type = msg.getAttribute("type");
                const body = msg.getElementsByTagName("body")[0];

                if (type === "groupchat" && body) {
                  const text = Strophe.getText(body);
                  const groupJid = from.split("/")[0];
                  const nickname = from.split("/")[1] || "Unknown";
                  const isOwn = nickname === user?.id;

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

                  set((state) => ({
                    groupMessages: [...state.groupMessages, newMessage]
                      .filter(
                        (msg, index, self) =>
                          index ===
                          self.findIndex(
                            (m) =>
                              m.text === msg.text &&
                              Math.abs(
                                m.timestamp.getTime() - msg.timestamp.getTime()
                              ) < 1000
                          )
                      )
                      .sort(
                        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                      ),
                  }));
                  
                  updateGroupConversationsList(
                    groupJid,
                    text,
                    new Date(),
                    !isOwn &&
                      groupJid !== get().activeGroupConversation &&
                      !get().readGroupConversations.includes(groupJid),
                    getContactName,
                    user?.id,
                    nickname
                  );
                }
                return true;
              });

              // Add MAM handler for historical messages
              xmppClient.addMAMHandler((msg: any) => {
                const result = msg.getElementsByTagName("result")[0];
                if (result) {
                  const forwarded = result.getElementsByTagName("forwarded")[0];
                  if (forwarded) {
                    const message =
                      forwarded.getElementsByTagName("message")[0];
                    const body = message?.getElementsByTagName("body")[0];
                    if (body) {
                      const from = message.getAttribute("from");
                      const to = message.getAttribute("to");
                      const text = Strophe.getText(body);
                      const delay = forwarded.getElementsByTagName("delay")[0];
                      const timestamp = ensureDate(
                        delay ? delay.getAttribute("stamp") : new Date()
                      );
                      const isGroup = from.includes("@conference.");
                      if (!isGroup) return true;
                      
                      const groupJid = from.split("/")[0];
                      const nickname = from.split("/")[1] || "Unknown";

                      const historicalMessage: Message = {
                        id: message.getAttribute("id") || uuidv4(),
                        from,
                        to: groupJid,
                        text,
                        timestamp,
                        isOwn: nickname === user?.id,
                        nickname,
                      };

                      set((state) => ({
                        groupMessages: [
                          ...state.groupMessages,
                          historicalMessage,
                        ]
                          .filter(
                            (msg, index, self) =>
                              index ===
                              self.findIndex(
                                (m) =>
                                  m.text === msg.text &&
                                  Math.abs(
                                    m.timestamp.getTime() -
                                      msg.timestamp.getTime()
                                  ) < 1000
                              )
                          )
                          .sort(
                            (a, b) =>
                              a.timestamp.getTime() - b.timestamp.getTime()
                          ),
                      }));

                      updateGroupConversationsList(
                        groupJid,
                        text,
                        timestamp,
                        groupJid !== get().activeGroupConversation &&
                          !get().readGroupConversations.includes(groupJid),
                        getContactName,
                        user?.id,
                        nickname
                      );
                    }
                  }
                }
                return true;
              });

              // Add presence handler
              xmppClient.addPresenceHandler((presence: any) => {
                const from = presence.getAttribute("from");
                const type = presence.getAttribute("type") || "available";
                if (from.includes(`@${CONFERENCE_DOMAIN}`)) {
                  const groupJid = from.split("/")[0];
                  if (!isValidBareJid(groupJid)) {
                    console.error(`Invalid group JID in presence: ${groupJid}`);
                    return true;
                  }
                  console.log(`Presence update in ${groupJid}: ${type}`);
                }
                return true;
              });

              // Fetch groups again after connection is established
              fetchGroupConversationsFromAPI(
                user,
                accessToken,
                getContactName
              ).catch((error) => {
                console.error("Error fetching group conversations:", error);
                set({ connectionError: "Failed to fetch group conversations" });
              });
            }
          });
        },

        cleanupConnection: () => {
          const state = get();
          state.groupConversations.forEach((group) => {
            if (group.jid && state.currentUser) {
              xmppClient.leaveGroup(group.jid, state.currentUser.id);
            }
          });
          xmppClient.removeHandlers();
          xmppClient.disconnect();
        },

        disconnect: () => {
          const state = get();
          state.groupConversations.forEach((group) => {
            if (group.jid && state.currentUser) {
              xmppClient.leaveGroup(group.jid, state.currentUser.id);
            }
          });
          xmppClient.removeHandlers();
          xmppClient.disconnect();
          set({
            connected: false,
            connectionStatus: "Disconnected",
            connectionError: null,
          });
        },

        sendGroupMessage: (
          groupJid: string,
          messageText: string,
          currentUser: User | null
        ) => {
          if (
            !xmppClient.isConnected() ||
            !messageText.trim() ||
            !groupJid.trim() ||
            !currentUser
          )
            return;

          const messageId = `msg_${Date.now()}`;
          xmppClient.sendGroupMessage(groupJid, messageText, messageId);
          
          const newMessage: Message = {
            id: messageId,
            from: `${groupJid}/${currentUser.id}`,
            to: groupJid,
            text: messageText,
            timestamp: new Date(),
            isOwn: true,
            nickname: currentUser.id,
          };

          set((state) => ({
            groupMessages: [...state.groupMessages, newMessage]
              .filter(
                (msg, index, self) =>
                  index ===
                  self.findIndex(
                    (m) =>
                      m.text === msg.text &&
                      Math.abs(
                        m.timestamp.getTime() - msg.timestamp.getTime()
                      ) < 1000
                  )
              )
              .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
          }));
          
          updateGroupConversationsList(
            groupJid,
            messageText,
            new Date(),
            false,
            (userId: string) => userId, // Simple fallback
            currentUser.id,
            currentUser.id
          );
        },
        joinGroup: (groupJid: string, currentUser: User | null) => {
          if (!currentUser || !isValidBareJid(groupJid)) {
            set({ connectionError: `Invalid group JID: ${groupJid}` });
            return;
          }
          xmppClient.joinGroup(groupJid, currentUser.id);
        },
        leaveGroup: (groupJid: string, currentUser: User | null) => {
          if (!currentUser || !isValidBareJid(groupJid)) {
            set({ connectionError: `Invalid group JID: ${groupJid}` });
            return;
          }
          xmppClient.leaveGroup(groupJid, currentUser.id);
          set((state) => ({
            groupConversations: state.groupConversations.filter(
              (conv) => conv.jid !== groupJid
            ),
            groupMessages: state.groupMessages.filter(
              (msg) => msg.to !== groupJid
            ),
            activeGroupConversation:
              state.activeGroupConversation === groupJid
                ? ""
                : state.activeGroupConversation,
          }));
        },
        createGroup: async (
          groupName: string,
          description: string,
          currentUser: User | null,
          accessToken: string | null
        ) => {
          if (!currentUser || !accessToken || !API_HOST) {
            set({ connectionError: "Missing user or access token" });
            return;
          }

          try {
            const response = await axios.post(
              `${API_HOST}/groups`,
              {
                title: groupName,
                description,
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
                throw new Error(`Invalid group JID: ${groupJid}`);
              }
              const createdAt = response.data.created_at
                ? ensureDate(response.data.created_at)
                : new Date();
              const newGroup: GroupConversation = {
                jid: groupJid,
                name: response.data.friendly_name || groupName,
                description: response.data.description || description,
                lastMessage: "Group created",
                lastMessageTime: createdAt,
                unreadCount: 0,
                type: "GROUP" as const,
                avatar: getDummyAvatar(groupJid),
                groupId: response.data.name,
                members: [
                  {
                    id: currentUser.id,
                    name: getContactName(currentUser.id, currentUser.id),
                    avatar: getDummyAvatar(currentUser.jid),
                  },
                ],
              };
              set((state) => ({
                groupConversations: [
                  newGroup,
                  ...state.groupConversations,
                ].sort(
                  (a, b) =>
                    b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
                ),
              }));
              xmppClient.joinGroup(groupJid, currentUser.id);
              get().startGroupConversation(groupJid, getContactName);
            }
          } catch (error) {
            console.error("Failed to create group:", error);
            set({ connectionError: "Failed to create group" });
            throw error;
          }
        },
        fetchExistingGroups: async (
          currentUser: User | null,
          accessToken: string | null,
          getContactName: (userId: string, currentUserId?: string) => string
        ) => {
          await fetchGroupConversationsFromAPI(
            currentUser,
            accessToken,
            getContactName
          );
        },
        startGroupConversation: (
          jid: string,
          getContactName: (userId: string, currentUserId?: string) => string
        ) => {
          if (!isValidBareJid(jid)) {
            set({ connectionError: `Invalid JID format: ${jid}` });
            return;
          }

          const state = get();
          const userId = jid.split("@")[0];
          if (!state.groupConversations.some((conv) => conv.jid === jid)) {
            set((state) => ({
              groupConversations: [
                {
                  jid,
                  name: getContactName(userId, state.currentUser?.id),
                  lastMessage: "Group created",
                  lastMessageTime: new Date(),
                  unreadCount: 0,
                  type: "GROUP" as const,
                  members: [
                    {
                      id: userId,
                      name: getContactName(userId, state.currentUser?.id),
                      avatar: getDummyAvatar(jid),
                    },
                  ],
                  groupId: userId,
                  description: "",
                },
                ...state.groupConversations,
              ].sort(
                (a, b) =>
                  b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
              ),
            }));
          }

          set({ activeGroupConversation: jid });
          state.markGroupConversationAsRead(jid);
          fetchGroupMessageHistoryAPI(jid, state.currentUser);
          fetchMAMMessages(jid, state.currentUser);
          if (state.currentUser) {
            state.joinGroup(jid, state.currentUser);
          }
        },
      };
    },
    {
      name: "group-storage",
      partialize: (state) => ({
        groupConversations: state.groupConversations,
        readGroupConversations: state.readGroupConversations,
        groupMessages: state.groupMessages,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.groupMessages = state.groupMessages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          state.groupConversations = state.groupConversations.map((conv) => ({
            ...conv,
            lastMessageTime: new Date(conv.lastMessageTime),
          }));
        }
      },
    }
  )
);
