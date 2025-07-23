import { Strophe, $pres, $msg, $iq } from "strophe.js";
import { v4 as uuidv4 } from "uuid";

// Types
export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  type?: string; // Add type to distinguish chat/groupchat
}

export interface Conversation {
  jid: string;
  name?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  type?: "CHAT" | "GROUP";
}

export interface XMPPClientConfig {
  domain: string;
  boshService: string;
  debug?: boolean;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface XMPPClientCallbacks {
  onConnectionStatusChange?: (status: string, connected: boolean) => void;
  onMessage?: (message: Message) => void;
  onPresence?: (jid: string, presence: string) => void;
  onError?: (error: string) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: () => void;
  onConversation?: (conversation: Conversation) => void; 
}

export class XMPPClient {
  private connection: any;
  private config: XMPPClientConfig;
  private callbacks: XMPPClientCallbacks;
  private currentUser: { id: string; jid: string } | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  constructor(config: XMPPClientConfig, callbacks: XMPPClientCallbacks = {}) {
    this.config = {
      autoReconnect: true,
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      debug: false,
      ...config,
    };
    this.callbacks = callbacks;
    this.initializeConnection();
  }

  private initializeConnection() {
    this.connection = new Strophe.Connection(this.config.boshService);

    if (this.config.debug) {
      this.connection.xmlInput = (body: any) => {
        console.log("XMPP RECV:", body);
        if (body.getAttribute("type") === "terminate") {
          console.error(`XMPP Terminate: condition=${body.getAttribute("condition")}`);
        }
      };
      this.connection.xmlOutput = (body: any) => {
        console.log("XMPP SEND:", body);
      };
    }
  }

  private onConnect = (status: number) => {
    const statusMap: { [key: number]: string } = {
      [Strophe.Status.CONNECTING]: "Connecting...",
      [Strophe.Status.CONNFAIL]: "Connection failed",
      [Strophe.Status.AUTHENTICATING]: "Authenticating...",
      [Strophe.Status.AUTHFAIL]: "Authentication failed",
      [Strophe.Status.DISCONNECTING]: "Disconnecting...",
      [Strophe.Status.DISCONNECTED]: "Disconnected",
      [Strophe.Status.CONNECTED]: "Connected",
      [Strophe.Status.ATTACHED]: "Attached",
      [Strophe.Status.REDIRECT]: "Redirect",
      [Strophe.Status.CONNTIMEOUT]: "Connection timeout",
      [Strophe.Status.ERROR]: "Error",
    };

    const statusText = statusMap[status] || "Unknown";
    console.log(`XMPP Status: ${statusText}`);

    this.callbacks.onConnectionStatusChange?.(statusText, status === Strophe.Status.CONNECTED);

    switch (status) {
      case Strophe.Status.CONNECTED:
        this.handleConnected();
        break;
      case Strophe.Status.DISCONNECTED:
      case Strophe.Status.CONNFAIL:
      case Strophe.Status.AUTHFAIL:
      case Strophe.Status.CONNTIMEOUT:
      case Strophe.Status.ERROR:
        this.handleDisconnected(status);
        break;
    }
  };

  private handleConnected() {
    this.connected = true;
    this.reconnectAttempts = 0; // Reset reconnect attempts on success
    this.isReconnecting = false;

    // Send initial presence
    this.connection.send($pres().tree());

    // Add message handler
    this.connection.addHandler(this.onMessage, null, "message", null, null, null);

    // Add presence handler
    this.connection.addHandler(this.onPresence, null, "presence", null, null, null);

    if (this.reconnectAttempts > 0) {
      this.callbacks.onReconnected?.();
    }

    console.log("XMPP: Successfully connected and handlers added");
  }

  private handleDisconnected(status: number) {
    this.connected = false;

    if (status === Strophe.Status.AUTHFAIL) {
      this.callbacks.onError?.(`Authentication failed for JID: ${this.currentUser?.jid}`);
      console.error(`XMPP: Authentication failed for JID: ${this.currentUser?.jid}`);
    } else if (status === Strophe.Status.CONNFAIL) {
      this.callbacks.onError?.(`Connection failed for JID: ${this.currentUser?.jid}, condition: item-not-found`);
      console.error(`XMPP: Connection failed for JID: ${this.currentUser?.jid}, condition: item-not-found`);
    }

    if (this.config.autoReconnect && !this.isReconnecting) {
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.log("XMPP: Max reconnection attempts reached");
      this.callbacks.onError?.("Max reconnection attempts reached");
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff: 3s, 6s, 12s, 24s, 48s
    const delay = (this.config.reconnectDelay || 3000) * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `XMPP: Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} after ${delay}ms`
    );
    this.callbacks.onReconnecting?.(this.reconnectAttempts);

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUser) {
        this.connect(this.currentUser.id, this.currentUser.id);
      }
    }, delay);
  }

  private onMessage = (msg: any): boolean => {
    const from = msg.getAttribute("from");
    const type = msg.getAttribute("type");
    const body = msg.getElementsByTagName("body")[0];

    if ((type === "chat" || type === "groupchat") && body) {
      const text = Strophe.getText(body);
      const fromJid = from.split("/")[0]; // Remove resource for bare JID
      const timestamp = msg.getElementsByTagName("delay")[0]
        ? new Date(msg.getElementsByTagName("delay")[0].getAttribute("stamp"))
        : new Date();

      const message: Message = {
        id: msg.getAttribute("id") || uuidv4(),
        from: fromJid,
        to: this.currentUser?.jid || "",
        text: text,
        timestamp: timestamp,
        isOwn: fromJid === this.currentUser?.jid,
        type: type,
      };

      this.callbacks.onMessage?.(message);
      console.log(`XMPP: Message received from ${fromJid} (type: ${type}): ${text}`);
    }

    return true; // Keep handler active
  };

  private onPresence = (pres: any): boolean => {
    const from = pres.getAttribute("from");
    const type = pres.getAttribute("type");
    const show = pres.getElementsByTagName("show")[0];
    const status = pres.getElementsByTagName("status")[0];

    const fromJid = from?.split("/")[0];
    let presence = "available";

    if (type === "unavailable") {
      presence = "unavailable";
    } else if (show) {
      presence = Strophe.getText(show);
    }

    this.callbacks.onPresence?.(fromJid, presence);
    console.log(`XMPP: Presence update from ${fromJid}: ${presence}`);

    return true; // Keep handler active
  };

  // Public Methods
  public connect(userId: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!userId || !password) {
        reject(new Error("User ID and password are required"));
        return;
      }

      const jid = `${userId}@${this.config.domain}`; // Use raw ID with hyphens

      this.currentUser = {
        id: userId,
        jid: jid,
      };

      console.log(`XMPP: Connecting as ${jid}`);

      // Set up one-time callback for connection result
      const originalCallback = this.callbacks.onConnectionStatusChange;
      this.callbacks.onConnectionStatusChange = (status, connected) => {
        originalCallback?.(status, connected);

        if (connected) {
          resolve(true);
        } else if (
          status.includes("failed") ||
          status.includes("timeout") ||
          status.includes("Error") ||
          status.includes("Authentication")
        ) {
          reject(new Error(`Connection failed: ${status}`));
        }
      };

      this.connection.connect(jid, password, this.onConnect);
    });
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.config.autoReconnect = false; // Disable auto-reconnect for manual disconnect
    this.isReconnecting = false;

    if (this.connection && this.connected) {
      this.connection.disconnect();
    }

    this.connected = false;
    this.currentUser = null;
    this.reconnectAttempts = 0;
  }

  public sendMessage(toJid: string, messageText: string, type: "chat" | "groupchat" = "chat"): Message | null {
    if (!this.connected || !this.currentUser) {
      console.error("XMPP: Cannot send message - not connected");
      return null;
    }

    if (!messageText.trim() || !toJid.trim()) {
      console.error("XMPP: Cannot send empty message or to empty JID");
      return null;
    }

    const message = $msg({
      to: toJid,
      type: type,
      id: uuidv4(),
    }).c("body").t(messageText);

    this.connection.send(message.tree());

    const sentMessage: Message = {
      id: message.attrs.id,
      from: this.currentUser.jid,
      to: toJid,
      text: messageText,
      timestamp: new Date(),
      isOwn: true,
      type: type,
    };

    console.log(`XMPP: Message sent to ${toJid} (type: ${type}): ${messageText}`);
    return sentMessage;
  }

  public fetchMessageHistory(withJid: string): void {
    if (!this.connected) {
      console.warn("XMPP: Cannot fetch history - not connected");
      return;
    }

    console.log(`XMPP: Fetching message history with ${withJid}`);

    // MAM query stanza
    const mamNS = "urn:xmpp:mam:2";
    const iq = $iq({
      type: "set",
      id: uuidv4(),
    })
      .c("query", { xmlns: mamNS })
      .c("x", { xmlns: "jabber:x:data", type: "submit" })
      .c("field", { var: "FORM_TYPE", type: "hidden" })
      .c("value")
      .t(mamNS)
      .up()
      .up()
      .c("field", { var: "with" })
      .c("value")
      .t(withJid);

    this.connection.sendIQ(
      iq,
      (response: any) => {
        console.log("XMPP: MAM query successful");
      },
      (error: any) => {
        console.error("XMPP: MAM query failed:", error);
        this.callbacks.onError?.("Failed to fetch message history");
      }
    );

    // Add MAM result handler
    this.connection.addHandler(
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
              const type = message.getAttribute("type") || "chat";

              // Extract timestamp from delay element
              const delay = forwarded.getElementsByTagName("delay")[0];
              const timestamp = delay
                ? new Date(delay.getAttribute("stamp") || "")
                : new Date();

              const historicalMessage: Message = {
                id: message.getAttribute("id") || uuidv4(),
                from: from.split("/")[0],
                to: to.split("/")[0],
                text,
                timestamp,
                isOwn: from.split("/")[0] === this.currentUser?.jid,
                type,
              };

              this.callbacks.onMessage?.(historicalMessage);
            }
          }
        }
        return true;
      },
      mamNS,
      "message"
    );
  }

  public fetchRecentMessages(days: number = 7, onConversation?: (conversation: Conversation) => void): void {
    if (!this.connected) {
      console.warn("XMPP: Cannot fetch recent messages - not connected");
      return;
    }

    console.log(`XMPP: Fetching recent messages from last ${days} days`);

    const mamNS = "urn:xmpp:mam:2";
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const iq = $iq({
      type: "set",
      id: uuidv4(),
    })
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
      .t("100"); // Limit to 100 messages to avoid overload

    this.connection.sendIQ(
      iq,
      (response: any) => {
        console.log("XMPP: Recent messages query successful");
        const results = response.getElementsByTagName("result");
        const conversations: { [jid: string]: Conversation } = {};

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const forwarded = result.getElementsByTagName("forwarded")[0];
          if (forwarded) {
            const message = forwarded.getElementsByTagName("message")[0];
            const body = message?.getElementsByTagName("body")[0];
            if (body) {
              const from = message.getAttribute("from");
              const to = message.getAttribute("to");
              const text = Strophe.getText(body);
              const type = message.getAttribute("type") || "chat";
              const fromJid = from.split("/")[0];
              const toJid = to.split("/")[0];
              const isOwn = fromJid === this.currentUser?.jid;
              const otherJid = isOwn ? toJid : fromJid;

              const delay = forwarded.getElementsByTagName("delay")[0];
              const timestamp = delay
                ? new Date(delay.getAttribute("stamp") || "")
                : new Date();

              const messageData: Message = {
                id: message.getAttribute("id") || uuidv4(),
                from: fromJid,
                to: toJid,
                text,
                timestamp,
                isOwn,
                type,
              };

              this.callbacks.onMessage?.(messageData);

              if (!conversations[otherJid] || conversations[otherJid].lastMessageTime < timestamp) {
                conversations[otherJid] = {
                  jid: otherJid,
                  name: otherJid.split("@")[0],
                  lastMessage: isOwn ? `You: ${text}` : text,
                  lastMessageTime: timestamp,
                  unreadCount: 0, // Will be updated by ChatPage
                  type: type === "groupchat" ? "GROUP" : "CHAT",
                };
              }
            }
          }
        }

        // Emit each conversation to the callback
        Object.values(conversations).forEach((conv) => {
          onConversation?.(conv);
          this.callbacks.onConversation?.(conv);
        });

        console.log(`XMPP: Processed ${Object.keys(conversations).length} conversations from MAM`);
      },
      (error: any) => {
        console.error("XMPP: Recent messages query failed:", error);
        this.callbacks.onError?.("Failed to fetch recent conversations from archive");
      }
    );
  }

  public fetchRoster(): void {
    if (!this.connected) {
      console.warn("XMPP: Cannot fetch roster - not connected");
      return;
    }

    console.log("XMPP: Fetching roster contacts");

    const iq = $iq({ type: "get", id: uuidv4() }).c("query", {
      xmlns: "jabber:iq:roster",
    });

    this.connection.sendIQ(
      iq,
      (response: any) => {
        console.log("XMPP: Roster fetch successful");
        const items = response.getElementsByTagName("item");

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const jid = item.getAttribute("jid");
          const name = item.getAttribute("name") || jid.split("@")[0];

          console.log(`XMPP: Roster contact: ${jid} (${name})`);
          // Optionally add roster contacts to conversations
          this.callbacks.onConversation?.({
            jid,
            name,
            lastMessage: "No messages yet",
            lastMessageTime: new Date(),
            unreadCount: 0,
            type: "CHAT",
          });
        }
      },
      (error: any) => {
        console.error("XMPP: Roster fetch failed:", error);
        this.callbacks.onError?.("Failed to fetch roster");
      }
    );
  }

  public setPresence(show: string = "available", status: string = ""): void {
    if (!this.connected) {
      console.warn("XMPP: Cannot set presence - not connected");
      return;
    }

    const pres = $pres();
    if (show !== "available") {
      pres.c("show").t(show).up();
    }
    if (status) {
      pres.c("status").t(status);
    }

    this.connection.send(pres.tree());
    console.log(`XMPP: Presence set to ${show}${status ? ` (${status})` : ""}`);
  }

  // Getters
  public isConnected(): boolean {
    return this.connected;
  }

  public getCurrentUser(): { id: string; jid: string } | null {
    return this.currentUser;
  }

  public getConnectionStatus(): string {
    return this.connected ? "Connected" : "Disconnected";
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public isReconnectingNow(): boolean {
    return this.isReconnecting;
  }

  // Enable/disable auto-reconnect
  public setAutoReconnect(enabled: boolean): void {
    this.config.autoReconnect = enabled;
  }

  // Update callbacks
  public updateCallbacks(newCallbacks: Partial<XMPPClientCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  // Cleanup
  public destroy(): void {
    this.disconnect();
    this.callbacks = {};
  }
}

export default XMPPClient;