"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Strophe, $pres, $msg, $iq } from "strophe.js";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";
import {
  ChatInput,
  MessageList,
  ChatHeader,
  NewChatModal,
  RoomList,
} from "./components";
import UserInfo from "./components/UserInfo";
import SidebarNav from "@/components/SidebarNav";
import { useTheme } from "@/providers/ThemeProvider";

// Constants
const API_HOST = "http://xmpp-dev.wasaachat.com:8080/api/v1";
const BOSH_SERVICE = "http://xmpp-dev.wasaachat.com:5280/bosh";
const DOMAIN = "xmpp-dev.wasaachat.com";

// Utility Functions
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
  const hash = id.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return avatars[Math.abs(hash) % avatars.length];
};

const isValidBareJid = (jid: string): boolean => {
  const jidRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return jidRegex.test(jid);
};

// Types
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
}

const ChatPage: React.FC = () => {
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const { getContactName } = useContactsStore();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [recipientJid, setRecipientJid] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [readConversations, setReadConversations] = useState<Set<string>>(
    new Set()
  );
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [currentConversationDetails, setCurrentConversationDetails] =
    useState<Conversation | null>(null);
  const maxConnectionAttempts = 3;

  // Refs
  const connectionRef = useRef<any>(null);
  const connectionAttemptRef = useRef<boolean>(false);
  const mamHandlerRef = useRef<string | null>(null);

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

  // Load read conversations from localStorage
  useEffect(() => {
    if (currentUser?.id) {
      const savedReadConversations = localStorage.getItem(
        `readConversations_${currentUser.id}`
      );
      if (savedReadConversations) {
        setReadConversations(new Set(JSON.parse(savedReadConversations)));
      }
    }
  }, [currentUser?.id]);

  console.log("Token:", accessToken);

  const saveReadConversations = (readSet: Set<string>) => {
    if (currentUser?.id) {
      localStorage.setItem(
        `readConversations_${currentUser.id}`,
        JSON.stringify([...readSet])
      );
    }
  };

  const markConversationAsRead = (jid: string) => {
    const newReadSet = new Set(readConversations);
    newReadSet.add(jid);
    setReadConversations(newReadSet);
    saveReadConversations(newReadSet);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.jid === jid ? { ...conv, unreadCount: 0 } : conv
      )
    );
  };

  const addMessage = (message: {
    id: string;
    clientMessageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: "PAYMENT";
    sentAt: Date;
    status: "sent";
    isPayment: boolean;
  }) => {
    // Convert payment message to Message type used in ChatPage
    const newMessage: Message = {
      id: message.id,
      from: currentUser?.jid || "",
      to: message.conversationId,
      text: message.content,
      timestamp: message.sentAt,
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    updateConversationsList(
      message.conversationId,
      message.content,
      message.sentAt
    );
  };

  // Initialize XMPP connection and global MAM handler
  useEffect(() => {
    connectionRef.current = new Strophe.Connection(BOSH_SERVICE);
    connectionRef.current.xmlInput = (body: any) => console.log("RECV:", body);
    connectionRef.current.xmlOutput = (body: any) => console.log("SEND:", body);

    const mamNS = "urn:xmpp:mam:2";
    mamHandlerRef.current = connectionRef.current.addHandler(
      (msg: any) => {
        const result = msg.getElementsByTagName("result")[0];
        if (result) {
          const forwarded = result.getElementsByTagName("forwarded")[0];
          if (forwarded) {
            const message = forwarded.getElementsByTagName("message")[0];
            const body = message?.getElementsByTagName("body")[0];
            if (body) {
              const from = message.getAttribute("from");
              const to = message.getAttribute("to");
              const text = Strophe.getText(body);
              const delay = forwarded.getElementsByTagName("delay")[0];
              const timestamp = delay
                ? new Date(delay.getAttribute("stamp") || "")
                : new Date();
              const otherJid =
                from.split("/")[0] === currentUser?.jid
                  ? to.split("/")[0]
                  : from.split("/")[0];

              const historicalMessage: Message = {
                id: uuidv4(),
                from: from.split("/")[0],
                to: to.split("/")[0],
                text,
                timestamp,
                isOwn: from.split("/")[0] === currentUser?.jid,
              };

              setMessages((prev) => {
                if (
                  prev.some(
                    (m) =>
                      m.text === text &&
                      Math.abs(m.timestamp.getTime() - timestamp.getTime()) <
                        1000
                  )
                ) {
                  return prev;
                }
                return [...prev, historicalMessage].sort(
                  (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                );
              });

              updateConversationsList(
                otherJid,
                text,
                timestamp,
                otherJid !== activeConversation &&
                  !readConversations.has(otherJid)
              );
            }
          }
        }
        return true;
      },
      mamNS,
      "message"
    );

    return () => {
      if (connectionRef.current && connected) {
        connectionRef.current.deleteHandler(mamHandlerRef.current);
        connectionRef.current.disconnect();
      }
    };
  }, [connected, currentUser, activeConversation, readConversations]);

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
        null,
        null,
        null
      );
      fetchExistingConversations();
    }
  };

  const onMessage = (msg: any) => {
    const from = msg.getAttribute("from");
    const type = msg.getAttribute("type");
    const body = msg.getElementsByTagName("body")[0];

    if (type === "chat" && body) {
      const text = Strophe.getText(body);
      const fromJid = from.split("/")[0];

      const newMessage: Message = {
        id: uuidv4(),
        from: fromJid,
        to: currentUser?.jid || "",
        text,
        timestamp: new Date(),
        isOwn: fromJid === currentUser?.jid,
      };

      setMessages((prev) => [...prev, newMessage]);
      updateConversationsList(
        fromJid,
        text,
        new Date(),
        fromJid !== activeConversation && !readConversations.has(fromJid)
      );
      console.log(`Message from ${from}: ${text}`);
    }

    return true;
  };

  const updateConversationsList = (
    jid: string,
    lastMessage: string,
    timestamp: Date,
    incrementUnread: boolean = false
  ) => {
    setConversations((prev) => {
      const existingIndex = prev.findIndex((conv) => conv.jid === jid);
      const isRead = readConversations.has(jid);
      const userId = jid.split("@")[0];

      if (existingIndex >= 0) {
        const updated = [...prev];
        const currentUnread = updated[existingIndex].unreadCount;
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage,
          lastMessageTime: timestamp,
          unreadCount: isRead
            ? 0
            : incrementUnread
            ? currentUnread + 1
            : currentUnread,
          name: getContactName(userId, currentUser?.id),
        };
        return updated.sort(
          (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        );
      } else {
        const newConv: Conversation = {
          jid,
          name: getContactName(userId, currentUser?.id),
          lastMessage,
          lastMessageTime: timestamp,
          unreadCount: isRead ? 0 : incrementUnread ? 1 : 0,
          type: "CHAT",
        };
        return [newConv, ...prev];
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

  const fetchExistingConversations = async () => {
    if (!currentUser) return;

    setLoadingConversations(true);
    console.log("Fetching existing conversations...");
    try {
      await Promise.allSettled([
        fetchConversationsFromAPI(),
        fetchRecentMessagesMAM(),
        fetchRosterContacts(),
      ]).then(() => {
        setConversations((prev) =>
          prev.map((conv) =>
            readConversations.has(conv.jid) ? { ...conv, unreadCount: 0 } : conv
          )
        );
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConnectionError("Failed to fetch conversations");
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchConversationsFromAPI = async () => {
    try {
      const response = await axios.get(`${API_HOST}/users/${currentUser?.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Fetched conversations from API:", response.data);

      if (response.data && response.data.chats && response.data.chats.results) {
        const messages = response.data.chats.results;
        const conversationMap: { [jid: string]: Conversation } = {};

        messages.forEach((msg: any) => {
          const jid = msg.bare_peer;
          if (!isValidBareJid(jid)) return;

          const isRead = readConversations.has(jid);
          const timestamp = new Date(msg.created_at || msg.timestamp / 1000);
          const lastMessage = msg.txt || "";
          const isOwn = msg.xml.includes(`from='${currentUser?.jid}`);
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
              isOnline: msg.state?.String === "active" || false,
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
                      phoneNumber: msg.phone_number,
                      lastSeen: msg.last_seen,
                    },
                  ],
            };
          }
        });

        setConversations((prev) => {
          const existingMap = new Map(prev.map((conv) => [conv.jid, conv]));
          Object.values(conversationMap).forEach((newConv) => {
            if (existingMap.has(newConv.jid)) {
              const existing = existingMap.get(newConv.jid)!;
              if (newConv.lastMessageTime > existing.lastMessageTime) {
                existingMap.set(newConv.jid, {
                  ...existing,
                  lastMessage: newConv.lastMessage,
                  lastMessageTime: newConv.lastMessageTime,
                  unreadCount: readConversations.has(newConv.jid)
                    ? 0
                    : newConv.unreadCount,
                  isOnline: newConv.isOnline || existing.isOnline,
                  type: newConv.type,
                  members: newConv.members,
                  name: newConv.name || existing.name,
                });
              }
            } else {
              existingMap.set(newConv.jid, newConv);
            }
          });

          return Array.from(existingMap.values()).sort(
            (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
          );
        });

        const apiMessages: Message[] = messages.map((msg: any) => {
          let from = msg.bare_peer;
          let to = currentUser?.jid || "";
          const isOwn = msg.xml.includes(`from='${currentUser?.jid}`);

          if (isOwn) {
            from = currentUser?.jid || "";
            to = msg.bare_peer;
          }

          return {
            id: msg.origin_id || uuidv4(),
            from: from.split("/")[0],
            to: to.split("/")[0],
            text: msg.txt,
            timestamp: new Date(msg.created_at || msg.timestamp / 1000),
            isOwn,
          };
        });

        setMessages((prev) => {
          const combined = [...prev, ...apiMessages];
          const unique = combined.filter(
            (msg, index, self) =>
              index ===
              self.findIndex(
                (m) =>
                  m.text === msg.text &&
                  Math.abs(m.timestamp.getTime() - msg.timestamp.getTime()) <
                    1000
              )
          );
          return unique.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
        });
      } else {
        console.warn("No chats data found in API response");
      }
    } catch (error) {
      console.error("Failed to fetch conversations from API:", error);
    }
  };

  const fetchRecentMessagesMAM = (mamNS = "urn:xmpp:mam:2") => {
    if (!connected || !connectionRef.current) return;

    console.log(`Fetching recent messages via MAM with namespace: ${mamNS}`);
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
        console.log("MAM recent messages query successful");
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
        console.error("MAM recent messages query failed:", error);
        const condition = error.getAttribute("condition") || "unknown";
        if (condition === "improper-addressing" && mamNS === "urn:xmpp:mam:2") {
          console.log("Retrying MAM query with urn:xmpp:mam:1");
          fetchRecentMessagesMAM("urn:xmpp:mam:1");
        } else {
          setConnectionError(`Failed to fetch recent messages: ${condition}`);
        }
      }
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

  const fetchRosterContacts = () => {
    if (!connected || !connectionRef.current) return;

    console.log("Fetching roster contacts...");
    const iq = $iq({ type: "get", id: uuidv4() }).c("query", {
      xmlns: "jabber:iq:roster",
    });

    connectionRef.current.sendIQ(
      iq,
      (response: any) => {
        console.log("Roster fetch successful");
        const items = response.getElementsByTagName("item");

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const jid = item.getAttribute("jid");
          const userId = jid.split("@")[0];

          setConversations((prev) => {
            if (prev.some((conv) => conv.jid === jid)) {
              return prev;
            }
            const newConv: Conversation = {
              jid,
              name: getContactName(userId, currentUser?.id),
              lastMessage: `Contact: ${getContactName(userId, currentUser?.id)}`,
              lastMessageTime: new Date(),
              unreadCount: 0,
              type: "CHAT",
              members: [{ id: userId, name: getContactName(userId, currentUser?.id) }],
            };
            return [...prev, newConv];
          });
        }
      },
      (error: any) => {
        console.error("Roster fetch failed:", error);
      }
    );
  };

  const fetchMessageHistory = async (withJid: string) => {
    if (!connected || !connectionRef.current || !currentUser) {
      console.warn("Cannot fetch message history: not connected or no user");
      setLoadingHistory(false);
      return;
    }

    if (!isValidBareJid(withJid)) {
      console.error(`Invalid JID format: ${withJid}`);
      setConnectionError(`Invalid JID format: ${withJid}`);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);

    const results = await Promise.allSettled([
      new Promise((resolve) => {
        fetchMessageHistoryMAM(withJid);
        resolve(null);
      }),
      fetchMessageHistoryAPI(withJid),
    ]);

    const mamFailed = results[0].status === "rejected";
    const apiFailed = results[1].status === "rejected";

    if (mamFailed && apiFailed) {
      console.error("Both MAM and API history fetching failed");
      setConnectionError("Failed to fetch message history from both sources");
    } else if (mamFailed) {
      console.warn("MAM fetch failed, relying on API");
    }

    setLoadingHistory(false);
  };

  const fetchMessageHistoryMAM = (
    withJid: string,
    mamNS = "urn:xmpp:mam:2"
  ) => {
    if (!connected || !connectionRef.current || !currentUser) return;

    console.log(
      `Fetching MAM history for JID: ${withJid} with namespace: ${mamNS}`
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
      .t(withJid)
      .up()
      .up()
      .c("set", { xmlns: "http://jabber.org/protocol/rsm" })
      .c("max")
      .t("50");

    connectionRef.current.sendIQ(
      iq,
      (response: any) => {
        console.log("MAM query successful:", response);
        const rsm = response.getElementsByTagName("set")[0];
        const complete = response.getAttribute("complete") === "true";
        if (rsm && !complete) {
          const last = rsm.getElementsByTagName("last")[0];
          if (last) {
            fetchMessageHistoryMAMNext(withJid, last.textContent, mamNS);
          }
        }
      },
      (error: any) => {
        console.error("MAM query failed:", error);
        const condition = error.getAttribute("condition") || "unknown";
        if (condition === "improper-addressing" && mamNS === "urn:xmpp:mam:2") {
          console.log("Retrying MAM query with urn:xmpp:mam:1");
          fetchMessageHistoryMAM(withJid, "urn:xmpp:mam:1");
        } else {
          setConnectionError(`Failed to fetch message history: ${condition}`);
        }
      }
    );
  };

  const fetchMessageHistoryMAMNext = (
    withJid: string,
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
      .t(withJid)
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
        console.log("MAM history next page query successful");
        const rsm = response.getElementsByTagName("set")[0];
        const complete = response.getAttribute("complete") === "true";
        if (rsm && !complete) {
          const last = rsm.getElementsByTagName("last")[0];
          if (last) {
            fetchMessageHistoryMAMNext(withJid, last.textContent, mamNS);
          }
        }
      },
      (error: any) => {
        console.error("MAM history next page query failed:", error);
      }
    );
  };

  const fetchMessageHistoryAPI = async (withJid: string) => {
    if (!currentUser) return;

    try {
      const response = await axios.get(
        `${API_HOST}/user/${currentUser.id}/${withJid.split("@")[0]}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && response.data.messages) {
        const apiMessages: Message[] = response.data.messages.map(
          (msg: any) => ({
            id: msg.id || uuidv4(),
            from: msg.from,
            to: msg.to,
            text: msg.body || msg.text,
            timestamp: new Date(msg.timestamp),
            isOwn: msg.from === currentUser.jid,
          })
        );

        setMessages((prev) => {
          const combined = [...prev, ...apiMessages];
          const unique = combined.filter(
            (msg, index, self) =>
              index ===
              self.findIndex(
                (m) =>
                  m.text === msg.text &&
                  Math.abs(m.timestamp.getTime() - msg.timestamp.getTime()) <
                    1000
              )
          );
          return unique.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
        });
      }
    } catch (error) {
      console.error("Failed to fetch message history from API:", error);
    }
  };

  const fetchConversationDetails = async (jid: string) => {
    const userId = jid.split("@")[0];
    try {
      const response = await axios.get(
        `${API_HOST}/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = response.data;
      const isGroup = data.is_group || false;
      setCurrentConversationDetails({
        jid,
        name: getContactName(userId, currentUser?.id),
        avatar: data.avatar || getDummyAvatar(jid),
        type: isGroup ? "GROUP" : "CHAT",
        members: isGroup
          ? data.members?.map((m: any) => ({
              id: m.id,
              name: getContactName(m.id, currentUser?.id),
              avatar: m.avatar || getDummyAvatar(m.id),
              phoneNumber: m.phone_number,
              lastSeen: m.last_seen,
            }))
          : [
              {
                id: userId,
                name: getContactName(userId, currentUser?.id),
                avatar: data.avatar || getDummyAvatar(jid),
                phoneNumber: data.phone_number || "+254712345678",
                lastSeen: data.last_seen,
              },
            ],
        lastMessage: "",
        lastMessageTime: new Date(),
        unreadCount: 0,
      });
    } catch (error) {
      console.error("Failed to fetch conversation details:", error);
      setCurrentConversationDetails({
        jid,
        name: getContactName(userId, currentUser?.id),
        avatar: getDummyAvatar(jid),
        type: "CHAT",
        members: [
          {
            id: userId,
            name: getContactName(userId, currentUser?.id),
            avatar: getDummyAvatar(jid),
          },
        ],
        lastMessage: "",
        lastMessageTime: new Date(),
        unreadCount: 0,
      });
    }
  };

  const addGroupMember = (groupJid: string, userId: string) => {
    if (!connected || !connectionRef.current) return;
    const iq = $iq({ type: "set", to: groupJid, id: uuidv4() })
      .c("admin", { xmlns: "http://jabber.org/protocol/muc#admin" })
      .c("item", { jid: `${userId}@${DOMAIN}`, affiliation: "member" });
    connectionRef.current.sendIQ(
      iq,
      () => {
        console.log(`Added member ${userId} to group ${groupJid}`);
      },
      (error: any) => {
        console.error("Failed to add group member:", error);
      }
    );
  };

  const removeGroupMember = (groupJid: string, userId: string) => {
    if (!connected || !connectionRef.current) return;
    const iq = $iq({ type: "set", to: groupJid, id: uuidv4() })
      .c("admin", { xmlns: "http://jabber.org/protocol/muc#admin" })
      .c("item", { jid: `${userId}@${DOMAIN}`, affiliation: "none" });
    connectionRef.current.sendIQ(
      iq,
      () => {
        console.log(`Removed member ${userId} from group ${groupJid}`);
      },
      (error: any) => {
        console.error("Failed to remove group member:", error);
      }
    );
  };

  const exitGroup = (groupJid: string) => {
    if (!connected || !connectionRef.current) return;
    const pres = $pres({
      to: `${groupJid}/${currentUser?.id}`,
      type: "unavailable",
    });
    connectionRef.current.send(pres.tree());
    setConversations((prev) => prev.filter((conv) => conv.jid !== groupJid));
    if (activeConversation === groupJid) {
      setActiveConversation("");
      setCurrentConversationDetails(null);
    }
  };

  const startConversation = (jid: string) => {
    if (!isValidBareJid(jid)) {
      console.error(`Invalid JID format: ${jid}`);
      setConnectionError(`Invalid JID format: ${jid}`);
      return;
    }
    setRecipientJid(jid);
    setActiveConversation(jid);
    markConversationAsRead(jid);
    fetchMessageHistory(jid);
    fetchConversationDetails(jid);
  };

  const getActiveMessages = () => {
    if (!activeConversation) return [];

    return messages
      .filter(
        (msg) =>
          (msg.from === activeConversation && msg.to === currentUser?.jid) ||
          (msg.from === currentUser?.jid && msg.to === activeConversation)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const sendMessage = () => {
    if (
      !connected ||
      !messageText.trim() ||
      !recipientJid.trim() ||
      !currentUser
    ) {
      return;
    }

    const message = $msg({ to: recipientJid, type: "chat" })
      .c("body")
      .t(messageText);

    connectionRef.current.send(message.tree());

    const newMessage: Message = {
      id: uuidv4(),
      from: currentUser.jid,
      to: recipientJid,
      text: messageText,
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    updateConversationsList(recipientJid, messageText, new Date());

    if (activeConversation !== recipientJid) {
      startConversation(recipientJid);
    }

    setMessageText("");
    console.log(`Sent message to ${recipientJid}: ${messageText}`);
  };

  const disconnect = () => {
    if (connectionRef.current && connected) {
      connectionRef.current.disconnect();
    }
  };

  // Render loading state during auth check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bbg-[var(--background)] text-[var(--foreground)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-white text-sm">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  // Render connection error
  if (connectionError) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
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
            onClick={retryConnection}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Render main chat interface
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
 Flats  <SidebarNav onClose={() => {}} currentPath={pathname} />
      <div className="flex-1 flex ml-20">
        <RoomList
          conversations={conversations}
          activeConversation={activeConversation}
          loadingConversations={loadingConversations}
          connected={connected}
          onConversationSelect={startConversation}
          fetchExistingConversations={fetchExistingConversations}
        />
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                getDisplayName={(jid: string) => getContactName(jid.split("@")[0], currentUser?.id)}
                getAvatarColor={getAvatarColor}
                onCallClick={() => console.log("Voice call")}
                onVideoClick={() => console.log("Video call")}
                setShowUserInfoModal={setShowUserInfoModal}
              />
              <div className="flex-1 overflow-y-auto">
                <MessageList
                  messages={getActiveMessages()}
                  loadingHistory={loadingHistory}
                  activeConversation={activeConversation}
                />
              </div>
              <ChatInput
                messageText={messageText}
                setMessageText={setMessageText}
                onSendMessage={sendMessage}
                connected={connected}
                currentUserId={currentUser?.id}
                activeConversation={activeConversation}
                activeGroupJid={activeConversation}
                addMessage={addMessage}
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
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartChat={(jid) => {
          if (!isValidBareJid(jid)) {
            console.error(`Invalid JID format: ${jid}`);
            setConnectionError(`Invalid JID format: ${jid}`);
            return;
          }
          const userId = jid.split("@")[0];
          setConversations((prev) => {
            if (prev.some((conv) => conv.jid === jid)) {
              return prev;
            }
            const newConv: Conversation = {
              jid,
              name: getContactName(userId, currentUser?.id),
              lastMessage: "No messages yet",
              lastMessageTime: new Date(),
              unreadCount: 0,
              type: "CHAT",
              members: [
                {
                  id: userId,
                  name: getContactName(userId, currentUser?.id),
                  avatar: getDummyAvatar(jid),
                },
              ],
            };
            return [newConv, ...prev];
          });
          startConversation(jid);
        }}
        connected={connected}
      />
      {showUserInfoModal && currentConversationDetails && (
        <UserInfo
          conversation={currentConversationDetails}
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

export default ChatPage;