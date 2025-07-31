// src/store/xmppStore.ts
import { create } from "zustand";
import { xmppClient } from "@/services/xmppClient";
import { Strophe, $pres } from "strophe.js";

export interface XMPPStore {
  isConnected: boolean;
  connectionStatus: string;
  connectionError: string | null;
  connect: (jid: string, password: string) => void;
  disconnect: () => void;
  addMessageHandler: (handler: (msg: any) => boolean) => void;
  addGroupMessageHandler: (handler: (msg: any) => boolean) => void;
  addMAMHandler: (handler: (msg: any) => boolean) => void;
  addPresenceHandler: (handler: (presence: any) => boolean) => void;
  removeHandlers: () => void;
  sendMessage: (to: string, text: string) => void;
  sendGroupMessage: (to: string, text: string, id: string) => void;
  joinGroup: (groupJid: string, nickname: string) => void;
  leaveGroup: (groupJid: string, nickname: string) => void;
}

export const useXMPPStore = create<XMPPStore>((set) => ({
  isConnected: false,
  connectionStatus: "Disconnected",
  connectionError: null,

  connect: (jid, password) => {
    set({ connectionStatus: "Connecting...", connectionError: null });

    // Clear any existing connection first
    if (xmppClient.isConnected()) {
      xmppClient.disconnect();
    }

    xmppClient.connect(jid, password, (status) => {
      if (status === Strophe.Status.CONNECTING) {
        set({ connectionStatus: "Connecting..." });
      } else if (status === Strophe.Status.CONNFAIL) {
        set({
          connectionStatus: "Connection failed",
          connectionError: "Failed to connect",
        });
      } else if (status === Strophe.Status.DISCONNECTING) {
        set({ connectionStatus: "Disconnecting..." });
      } else if (status === Strophe.Status.DISCONNECTED) {
        set({ connectionStatus: "Disconnected", isConnected: false });
      } else if (status === Strophe.Status.CONNECTED) {
        set({
          connectionStatus: "Connected",
          isConnected: true,
          connectionError: null,
        });
        xmppClient.setConnected(true);
        xmppClient.send($pres().tree());
      }
    });
  },

  disconnect: () => {
    if (xmppClient.isConnected()) {
      xmppClient.disconnect();
    }
    set({
      isConnected: false,
      connectionStatus: "Disconnected",
    });
  },

  addMessageHandler: (handler) => {
    xmppClient.addMessageHandler(handler);
  },

  addGroupMessageHandler: (handler) => {
    xmppClient.addGroupMessageHandler(handler);
  },

  addMAMHandler: (handler) => {
    xmppClient.addMAMHandler(handler);
  },

  addPresenceHandler: (handler) => {
    xmppClient.addPresenceHandler(handler);
  },

  removeHandlers: () => {
    xmppClient.removeHandlers();
  },

  sendMessage: (to, text) => {
    xmppClient.sendMessage(to, text);
  },

  sendGroupMessage: (to, text, id) => {
    xmppClient.sendGroupMessage(to, text, id);
  },

  joinGroup: (groupJid, nickname) => {
    xmppClient.joinGroup(groupJid, nickname);
  },

  leaveGroup: (groupJid, nickname) => {
    xmppClient.leaveGroup(groupJid, nickname);
  },
}));
