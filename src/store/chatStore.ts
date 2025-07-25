import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Strophe, $iq, $pres } from "strophe.js";
import { xmppClient } from "@/services/xmppClient";

const API_HOST = process.env.NEXT_PUBLIC_XMPP_API_HOST;
const DOMAIN = process.env.NEXT_PUBLIC_XMPP_DOMAIN;

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
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  type?: "CHAT" | "GROUP";
  members?: ConversationMember[];
  starred?: boolean;
}

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

interface User {
  id: string;
  jid: string;
}

interface ChatStore {
  conversations: Conversation[];
  readConversations: string[];
  messages: Message[];
  connected: boolean;
  connectionStatus: string;
  connectionError: string | null;
  currentConversationDetails: Conversation | null;
  activeConversation: string;
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (jid: string, updates: Partial<Conversation>) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (jid: string) => void;
  markConversationAsRead: (jid: string) => void;
  toggleStarredConversation: (jid: string) => void;
  clearConversations: () => void;
  initializeConnection: (
    user: User | null,
    accessToken: string | null,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => void;
  disconnect: () => void;
  sendMessage: (
    recipientJid: string,
    messageText: string,
    currentUser: User | null
  ) => void;
  fetchConversationDetails: (
    jid: string,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => void;
  startConversation: (
    jid: string,
    getContactName: (userId: string, currentUserId?: string) => string
  ) => void;
}

export const useChatStore = create<ChatStore>()(
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
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;
      };

      const updateConversationsList = (
        jid: string,
        lastMessage: string,
        timestamp: Date,
        incrementUnread: boolean = false,
        getContactName: (userId: string, currentUserId?: string) => string,
        currentUserId?: string
      ) => {
        const state = get();
        const userId = jid.split("@")[0];
        const existingConv = state.conversations.find(
          (conv) => conv.jid === jid
        );
        const isRead = state.readConversations.includes(jid);

        if (existingConv) {
          state.updateConversation(jid, {
            lastMessage,
            lastMessageTime: ensureDate(timestamp),
            unreadCount: isRead
              ? 0
              : incrementUnread
              ? existingConv.unreadCount + 1
              : existingConv.unreadCount,
            name: getContactName(userId, currentUserId),
          });
        } else {
          state.addConversation({
            jid,
            name: getContactName(userId, currentUserId),
            lastMessage,
            lastMessageTime: ensureDate(timestamp),
            unreadCount: isRead ? 0 : incrementUnread ? 1 : 0,
            type: "CHAT",
          });
        }
      };

      const fetchConversationsFromAPI = async (
        currentUser: User | null,
        accessToken: string | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!API_HOST || !currentUser) return;

        try {
          const response = await axios.get(
            `${API_HOST}/users/${currentUser.id}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (response.data?.chats?.results) {
            const messages = response.data.chats.results;
            const conversationMap: { [jid: string]: Conversation } = {};

            messages.forEach((msg: any) => {
              const jid = msg.bare_peer;
              if (!isValidBareJid(jid)) return;

              const isRead = get().readConversations.includes(jid);

              const timestampValue =
                msg.created_at ||
                (msg.timestamp ? msg.timestamp * 1000 : Date.now());
              const timestamp = new Date(timestampValue);
              const lastMessage = msg.txt || "";
              const isOwn = msg.xml?.includes(`from='${currentUser?.jid}`);
              const isGroup = msg.is_group || false;
              const userId = jid.split("@")[0];

              if (
                !conversationMap[jid] ||
                conversationMap[jid].lastMessageTime < timestamp
              ) {
                conversationMap[jid] = {
                  jid,
                  name: getContactName(userId, currentUser?.id),
                  avatar: msg.avatar,
                  lastMessage: isOwn ? `You: ${lastMessage}` : lastMessage,
                  lastMessageTime: timestamp,
                  unreadCount: isRead
                    ? 0
                    : conversationMap[jid]?.unreadCount + 1 || 1,
                  isOnline: msg.state?.String === "active",
                  type: isGroup ? "GROUP" : "CHAT",
                  members: isGroup
                    ? msg.members?.map((m: any) => ({
                        id: m.id,
                        name: getContactName(m.id, currentUser?.id),
                        avatar: m.avatar,
                        phoneNumber: m.phone_number,
                        lastSeen: m.last_seen,
                      }))
                    : [
                        {
                          id: userId,
                          name: getContactName(userId, currentUser?.id),
                          avatar: msg.avatar,
                        },
                      ],
                };
              }
            });

            const updatedConversations = Object.values(conversationMap).sort(
              (a, b) =>
                b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
            );
            set({ conversations: updatedConversations });

            const apiMessages: Message[] = messages.map((msg: any) => {
              let from = msg.bare_peer;
              let to = currentUser?.jid || "";
              if (msg.xml?.includes(`from='${currentUser?.jid}`)) {
                from = currentUser?.jid || "";
                to = msg.bare_peer;
              }
              return {
                id: msg.origin_id || uuidv4(),
                from: from.split("/")[0],
                to: to.split("/")[0],
                text: msg.txt || "",
                timestamp: ensureDate(msg.created_at || msg.timestamp * 1000),
                isOwn: msg.xml?.includes(`from='${currentUser?.jid}`),
              };
            });

            set((state) => {
              const updatedMessages = [...state.messages, ...apiMessages]
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
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              return { messages: updatedMessages };
            });
          }
        } catch (error) {
          console.error("Failed to fetch conversations from API:", error);
          set({ connectionError: "Failed to fetch conversations" });
        }
      };

      const fetchRecentMessagesMAM = (
        mamNS = "urn:xmpp:mam:2",
        currentUser: User | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!xmppClient.isConnected()) return;

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

        xmppClient.sendIQ(
          iq,
          (response: any) => {
            const rsm = response.getElementsByTagName("set")[0];
            const complete = response.getAttribute("complete") === "true";
            if (rsm && !complete) {
              const last = rsm.getElementsByTagName("last")[0];
              if (last) {
                fetchRecentMessagesMAMNext(
                  last.textContent,
                  mamNS,
                  currentUser,
                  getContactName
                );
              }
            }
          },
          (error: any) => {
            console.error("MAM recent messages query failed:", error);
            if (
              error.getAttribute("condition") === "improper-addressing" &&
              mamNS === "urn:xmpp:mam:2"
            ) {
              fetchRecentMessagesMAM(
                "urn:xmpp:mam:1",
                currentUser,
                getContactName
              );
            } else {
              set({
                connectionError: `Failed to fetch recent messages: ${
                  error.getAttribute("condition") || "unknown"
                }`,
              });
            }
          }
        );
      };

      const fetchRecentMessagesMAMNext = (
        lastId: string,
        mamNS: string,
        currentUser: User | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!xmppClient.isConnected()) return;

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

        xmppClient.sendIQ(
          iq,
          (response: any) => {
            const rsm = response.getElementsByTagName("set")[0];
            const complete = response.getAttribute("complete") === "true";
            if (rsm && !complete) {
              const last = rsm.getElementsByTagName("last")[0];
              if (last) {
                fetchRecentMessagesMAMNext(
                  last.textContent,
                  mamNS,
                  currentUser,
                  getContactName
                );
              }
            }
          },
          (error: any) => {
            console.error("MAM next page query failed:", error);
          }
        );
      };

      const fetchRosterContacts = (
        currentUser: User | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!xmppClient.isConnected()) return;

        const iq = $iq({ type: "get", id: uuidv4() }).c("query", {
          xmlns: "jabber:iq:roster",
        });

        xmppClient.sendIQ(
          iq,
          (response: any) => {
            const items = response.getElementsByTagName("item");
            for (let i = 0; i < items.length; i++) {
              const jid = items[i].getAttribute("jid");
              const userId = jid.split("@")[0];
              if (!get().conversations.some((conv) => conv.jid === jid)) {
                get().addConversation({
                  jid,
                  name: getContactName(userId, currentUser?.id),
                  lastMessage: `Contact: ${getContactName(
                    userId,
                    currentUser?.id
                  )}`,
                  lastMessageTime: new Date(),
                  unreadCount: 0,
                  type: "CHAT",
                  members: [
                    {
                      id: userId,
                      name: getContactName(userId, currentUser?.id),
                    },
                  ],
                });
              }
            }
          },
          (error: any) => {
            console.error("Roster fetch failed:", error);
          }
        );
      };

      const fetchMessageHistory = async (
        withJid: string,
        currentUser: User | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!xmppClient.isConnected() || !currentUser) return;
        if (!isValidBareJid(withJid)) {
          set({ connectionError: `Invalid JID format: ${withJid}` });
          return;
        }

        await Promise.allSettled([
          new Promise((resolve) => {
            fetchMessageHistoryMAM(
              withJid,
              "urn:xmpp:mam:2",
              currentUser,
              getContactName
            );
            resolve(null);
          }),
          fetchMessageHistoryAPI(withJid, currentUser),
        ]);
      };

      const fetchMessageHistoryMAM = (
        withJid: string,
        mamNS = "urn:xmpp:mam:2",
        currentUser: User | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!xmppClient.isConnected()) return;

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
          .t(withJid)
          .up()
          .up()
          .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
          .c("max")
          .t("50");

        xmppClient.sendIQ(
          iq,
          (response: any) => {
            const rsm = response.getElementsByTagName("set")[0];
            const complete = response.getAttribute("complete") === "true";
            if (rsm && !complete) {
              const last = rsm.getElementsByTagName("last")[0];
              if (last) {
                fetchMessageHistoryMAMNext(
                  withJid,
                  last.textContent,
                  mamNS,
                  currentUser,
                  getContactName
                );
              }
            }
          },
          (error: any) => {
            if (
              error.getAttribute("condition") === "improper-addressing" &&
              mamNS === "urn:xmpp:mam:2"
            ) {
              fetchMessageHistoryMAM(
                withJid,
                "urn:xmpp:mam:1",
                currentUser,
                getContactName
              );
            } else {
              set({
                connectionError: `Failed to fetch message history: ${
                  error.getAttribute("condition") || "unknown"
                }`,
              });
            }
          }
        );
      };

      const fetchMessageHistoryMAMNext = (
        withJid: string,
        lastId: string,
        mamNS: string,
        currentUser: User | null,
        getContactName: (userId: string, currentUserId?: string) => string
      ) => {
        if (!xmppClient.isConnected()) return;

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
          .t(withJid)
          .up()
          .up()
          .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
          .c("max")
          .t("50")
          .up()
          .c("after")
          .t(lastId);

        xmppClient.sendIQ(
          iq,
          (response: any) => {
            const rsm = response.getElementsByTagName("set")[0];
            const complete = response.getAttribute("complete") === "true";
            if (rsm && !complete) {
              const last = rsm.getElementsByTagName("last")[0];
              if (last) {
                fetchMessageHistoryMAMNext(
                  withJid,
                  last.textContent,
                  mamNS,
                  currentUser,
                  getContactName
                );
              }
            }
          },
          (error: any) => {
            console.error("MAM history next page query failed:", error);
          }
        );
      };

      const fetchMessageHistoryAPI = async (
        withJid: string,
        currentUser: User | null
      ) => {
        if (!currentUser || !API_HOST) return;

        try {
          const response = await axios.get(
            `${API_HOST}/user/${currentUser.id}/${withJid.split("@")[0]}`,
            {
              headers: { Authorization: `Bearer ${get().accessToken}` },
            }
          );

          if (response.data?.messages) {
            const apiMessages: Message[] = response.data.messages.map(
              (msg: any) => ({
                id: msg.id || uuidv4(),
                from: msg.from,
                to: msg.to,
                text: msg.body || msg.text,
                timestamp: ensureDate(msg.timestamp),
                isOwn: msg.from === currentUser.jid,
              })
            );

            set((state) => ({
              messages: [...state.messages, ...apiMessages]
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
        } catch (error) {
          console.error("Failed to fetch message history from API:", error);
        }
      };

      return {
        conversations: [],
        readConversations: [],
        messages: [],
        connected: false,
        connectionStatus: "Disconnected",
        connectionError: null,
        currentConversationDetails: null,
        activeConversation: "",
        accessToken: null,
        setConversations: (conversations) =>
          set({
            conversations: conversations.map((conv) => ({
              ...conv,
              lastMessageTime: ensureDate(conv.lastMessageTime),
              starred: conv.starred ?? false,
            })),
          }),
        updateConversation: (jid, updates) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
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
        addConversation: (conversation) =>
          set((state) => ({
            conversations: [
              {
                ...conversation,
                lastMessageTime: ensureDate(conversation.lastMessageTime),
                starred: conversation.starred ?? false,
              },
              ...state.conversations,
            ].sort(
              (a, b) =>
                b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
            ),
          })),
        removeConversation: (jid) =>
          set((state) => ({
            conversations: state.conversations.filter(
              (conv) => conv.jid !== jid
            ),
          })),
        markConversationAsRead: (jid) =>
          set((state) => ({
            readConversations: [...new Set([...state.readConversations, jid])],
            conversations: state.conversations.map((conv) =>
              conv.jid === jid ? { ...conv, unreadCount: 0 } : conv
            ),
          })),
        toggleStarredConversation: (jid) =>
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.jid === jid ? { ...conv, starred: !conv.starred } : conv
            ),
          })),
        clearConversations: () =>
          set({ conversations: [], readConversations: [], messages: [] }),
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

          set({ accessToken });

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
                  xmppClient.connect(user.jid, user.id, this);
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

              xmppClient.addMessageHandler((msg: any) => {
                const from = msg.getAttribute("from");
                const type = msg.getAttribute("type");
                const body = msg.getElementsByTagName("body")[0];

                if (type === "chat" && body) {
                  const text = Strophe.getText(body);
                  const fromJid = from.split("/")[0];
                  const newMessage: Message = {
                    id: uuidv4(),
                    from: fromJid,
                    to: user?.jid || "",
                    text,
                    timestamp: new Date(),
                    isOwn: fromJid === user?.jid,
                  };

                  set((state) => ({
                    messages: [...state.messages, newMessage],
                  }));
                  updateConversationsList(
                    fromJid,
                    text,
                    new Date(),
                    fromJid !== get().activeConversation &&
                      !get().readConversations.includes(fromJid),
                    getContactName,
                    user?.id
                  );
                }
                return true;
              });

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
                      const otherJid =
                        from.split("/")[0] === user?.jid
                          ? to.split("/")[0]
                          : from.split("/")[0];

                      const historicalMessage: Message = {
                        id: uuidv4(),
                        from: from.split("/")[0],
                        to: to.split("/")[0],
                        text,
                        timestamp,
                        isOwn: from.split("/")[0] === user?.jid,
                      };

                      set((state) => ({
                        messages: [...state.messages, historicalMessage]
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

                      updateConversationsList(
                        otherJid,
                        text,
                        timestamp,
                        otherJid !== get().activeConversation &&
                          !get().readConversations.includes(otherJid),
                        getContactName,
                        user?.id
                      );
                    }
                  }
                }
                return true;
              });

              Promise.allSettled([
                fetchConversationsFromAPI(user, accessToken, getContactName),
                fetchRecentMessagesMAM("urn:xmpp:mam:2", user, getContactName),
                fetchRosterContacts(user, getContactName),
              ]).catch((error) => {
                console.error("Error fetching conversations:", error);
                set({ connectionError: "Failed to fetch conversations" });
              });
            }
          });
        },
        disconnect: () => {
          xmppClient.removeHandlers();
          xmppClient.disconnect();
          set({
            connected: false,
            connectionStatus: "Disconnected",
            connectionError: null,
          });
        },
        sendMessage: (
          recipientJid: string,
          messageText: string,
          currentUser: User | null
        ) => {
          if (
            !xmppClient.isConnected() ||
            !messageText.trim() ||
            !recipientJid.trim() ||
            !currentUser
          )
            return;

          xmppClient.sendMessage(recipientJid, messageText);
          const newMessage: Message = {
            id: uuidv4(),
            from: currentUser.jid,
            to: recipientJid,
            text: messageText,
            timestamp: new Date(),
            isOwn: true,
          };

          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
          updateConversationsList(
            recipientJid,
            messageText,
            new Date(),
            false,
            getContactName,
            currentUser.id
          );
        },
        fetchConversationDetails: async (
          jid: string,
          getContactName: (userId: string, currentUserId?: string) => string
        ) => {
          if (!API_HOST) return;

          const userId = jid.split("@")[0];
          try {
            const response = await axios.get(`${API_HOST}/users/${userId}`, {
              headers: { Authorization: `Bearer ${get().accessToken}` },
            });
            const data = response.data;
            const isGroup = data.is_group || false;
            set({
              currentConversationDetails: {
                jid,
                name: getContactName(userId, get().currentUser?.id),
                avatar: data.avatar || getDummyAvatar(jid),
                type: isGroup ? "GROUP" : "CHAT",
                members: isGroup
                  ? data.members?.map((m: any) => ({
                      id: m.id,
                      name: getContactName(m.id, get().currentUser?.id),
                      avatar: m.avatar || getDummyAvatar(m.id),
                      phoneNumber: m.phone_number,
                      lastSeen: m.last_seen,
                    }))
                  : [
                      {
                        id: userId,
                        name: getContactName(userId, get().currentUser?.id),
                        avatar: data.avatar || getDummyAvatar(jid),
                        phoneNumber: data.phone_number || "+254712345678",
                        lastSeen: data.last_seen,
                      },
                    ],
                lastMessage: "",
                lastMessageTime: new Date(),
                unreadCount: 0,
              },
            });
          } catch (error) {
            console.error("Failed to fetch conversation details:", error);
            set({
              currentConversationDetails: {
                jid,
                name: getContactName(userId, get().currentUser?.id),
                avatar: getDummyAvatar(jid),
                type: "CHAT",
                members: [
                  {
                    id: userId,
                    name: getContactName(userId, get().currentUser?.id),
                    avatar: getDummyAvatar(jid),
                  },
                ],
                lastMessage: "",
                lastMessageTime: new Date(),
                unreadCount: 0,
              },
            });
          }
        },
        startConversation: (
          jid: string,
          getContactName: (userId: string, currentUserId?: string) => string
        ) => {
          if (!isValidBareJid(jid)) {
            set({ connectionError: `Invalid JID format: ${jid}` });
            return;
          }

          const state = get();
          const userId = jid.split("@")[0];
          if (!state.conversations.some((conv) => conv.jid === jid)) {
            state.addConversation({
              jid,
              name: getContactName(userId, state.currentUser?.id),
              lastMessage: "No messages yet",
              lastMessageTime: new Date(),
              unreadCount: 0,
              type: "CHAT",
              members: [
                {
                  id: userId,
                  name: getContactName(userId, state.currentUser?.id),
                  avatar: getDummyAvatar(jid),
                },
              ],
            });
          }

          set({ activeConversation: jid });
          state.markConversationAsRead(jid);
          fetchMessageHistory(jid, state.currentUser, getContactName);
          state.fetchConversationDetails(jid, getContactName);
        },
      };
    },
    {
      name: "chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
        readConversations: state.readConversations,
        messages: state.messages,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.messages = state.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          state.conversations = state.conversations.map((conv) => ({
            ...conv,
            lastMessageTime: new Date(conv.lastMessageTime),
          }));
        }
      },
    }
  )
);

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