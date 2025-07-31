import { Strophe, $iq, $pres, $msg } from "strophe.js";

const BOSH_SERVICE = process.env.NEXT_PUBLIC_XMPP_BOSH_SERVICE;

class XMPPClient {
  private connection: any = null;
  private connected: boolean = false;
  private onMessageCallback: ((msg: any) => boolean) | null = null;
  private onMAMMessageCallback: ((msg: any) => boolean) | null = null;
  private onGroupMessageCallback: ((msg: any) => boolean) | null = null;
  private onPresenceCallback: ((presence: any) => boolean) | null = null;

  connect(jid: string, password: string, onConnect: (status: number) => void) {
    if (this.connection) {
      this.connection.disconnect();
    }
    this.connection = new Strophe.Connection(BOSH_SERVICE);
    this.connection.connect(jid, password, onConnect);
  }

  disconnect() {
    if (this.connection && this.connected) {
      this.connection.disconnect();
      this.connection = null;
      this.connected = false;
    }
  }

  send(stanza: any) {
    if (this.connection && this.connected) {
      this.connection.send(stanza);
    } else {
      console.warn("Cannot send stanza: not connected");
    }
  }

  sendMessage(to: string, text: string) {
    if (!this.connected || !this.connection) return;
    const message = $msg({ to, type: "chat" }).c("body").t(text);
    this.connection.send(message.tree());
  }

  sendGroupMessage(to: string, text: string, id: string) {
    if (!this.connected || !this.connection) return;
    const message = $msg({ to, type: "groupchat", id }).c("body").t(text);
    this.connection.send(message.tree());
  }

  joinGroup(groupJid: string, nickname: string) {
    if (!this.connected || !this.connection) return;
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const fromJid = `${nickname}@${process.env.NEXT_PUBLIC_XMPP_DOMAIN}/${timestamp}`;
    const presence = $pres({
      from: fromJid,
      to: `${groupJid}/${nickname}`,
      xmlns: "jabber:client",
    }).c("x", { xmlns: "http://jabber.org/protocol/muc" });
    this.connection.send(presence.tree());
  }

  leaveGroup(groupJid: string, nickname: string) {
    if (!this.connected || !this.connection) return;
    const presence = $pres({
      to: `${groupJid}/${nickname}`,
      type: "unavailable",
    });
    this.connection.send(presence.tree());
  }

  addMessageHandler(callback: (msg: any) => boolean) {
    if (this.connection && !this.onMessageCallback) {
      this.onMessageCallback = callback;

      
      this.connection.addHandler(callback, null, "message", "chat", null, null);
    }
  }

  addGroupMessageHandler(callback: (msg: any) => boolean) {
    if (this.connection && !this.onGroupMessageCallback) {
      this.onGroupMessageCallback = callback;
      this.connection.addHandler(callback, null, "message", "groupchat", null, null);
    }
  }

  addMAMHandler(callback: (msg: any) => boolean) {
    if (this.connection && !this.onMAMMessageCallback) {
      this.onMAMMessageCallback = callback;
      this.connection.addHandler(callback, "urn:xmpp:mam:2", "message");
    }
  }

  addPresenceHandler(callback: (presence: any) => boolean) {
    if (this.connection && !this.onPresenceCallback) {
      this.onPresenceCallback = callback;
      this.connection.addHandler(callback, null, "presence", null, null, null);
    }
  }

  removeHandlers() {
    if (this.connection) {
      if (this.onMessageCallback) {
        this.connection.deleteHandler(this.onMessageCallback);
        this.onMessageCallback = null;
      }
      if (this.onGroupMessageCallback) {
        this.connection.deleteHandler(this.onGroupMessageCallback);
        this.onGroupMessageCallback = null;
      }
      if (this.onMAMMessageCallback) {
        this.connection.deleteHandler(this.onMAMMessageCallback);
        this.onMAMMessageCallback = null;
      }
      if (this.onPresenceCallback) {
        this.connection.deleteHandler(this.onPresenceCallback);
        this.onPresenceCallback = null;
      }
    }
  }

  sendIQ(
    iq: any,
    success: (response: any) => void,
    error: (error: any) => void
  ) {
    if (this.connection) {
      this.connection.sendIQ(iq, success, error);
    }
  }

  setConnected(status: boolean) {
    this.connected = status;
  }

  isConnected() {
    return this.connected;
  }
}

export const xmppClient = new XMPPClient();