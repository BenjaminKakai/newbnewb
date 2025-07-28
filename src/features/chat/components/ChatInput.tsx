import React, { useState, useRef } from "react";
import {
  Paperclip,
  Send,
  Camera,
  Mic,
  BadgeDollarSign,
  Smile,
} from "lucide-react";
import WalletModal from "./WalletModal";
import EmojiPicker from "./EmojiPicker";

interface ChatInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  onSendMessage: () => void;
  connected: boolean;
  disabled?: boolean;
  currentUserId?: string;
  activeConversation?: string;
  activeGroupJid?: string;
  addMessage: (message: {
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
  }) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  messageText,
  setMessageText,
  onSendMessage,
  connected,
  disabled = false,
  currentUserId,
  activeConversation,
  activeGroupJid,
  addMessage,
}) => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<
    | {
        top: number;
        left: number;
        width: number;
      }
    | undefined
  >(undefined);
  const dollarButtonRef = useRef<HTMLButtonElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleAttachment = () => {
    console.log("Attachment clicked");
  };

  const handleEmoji = () => {
    if (emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      const position = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      };
      setButtonPosition(position);
      setShowEmojiPicker(true);
    } else {
      setShowEmojiPicker(true); // Fallback to centered modal
    }
  };

  const handleSendMoney = () => {
    if (currentUserId && (activeConversation || activeGroupJid)) {
      if (dollarButtonRef.current) {
        const rect = dollarButtonRef.current.getBoundingClientRect();
        const position = {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        };
        setButtonPosition(position);
        setShowWalletModal(true);
      } else {
        setShowWalletModal(true); // Fallback to centered modal
      }
    } else {
      console.log("No active conversation or user ID available");
    }
  };

  const handleVoice = () => {
    console.log("Voice message clicked");
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(messageText + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="px-4 py-3 bg-[var(--background)]">
      <div className="flex items-center relative">
        <div className="flex-1 flex items-center border border-gray-400 rounded-lg overflow-hidden">
          <button
            onClick={handleAttachment}
            className="p-2 text-[var(--foreground)] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            placeholder="Write a message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 bg-transparent border-0 text-[var(--foreground)] focus:ring-0 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-sm"
            disabled={!connected || disabled}
          />
          <button
            ref={emojiButtonRef}
            onClick={handleEmoji}
            className="p-2 text-[var(--foreground)] hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Add emoji"
          >
            <Smile size={18} className="hidden md:inline" />
          </button>
          <button
            ref={dollarButtonRef}
            onClick={handleSendMoney}
            className="p-2 text-[var(--foreground)] hover:text-green-600 dark:hover:text-green-400 transition-colors"
            title="Send money"
          >
            <BadgeDollarSign size={18} className="hidden md:inline" />
          </button>
          <button
            onClick={handleVoice}
            className="p-2 text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Voice message"
          >
            <Camera size={18} className="hidden md:inline" />
          </button>
        </div>
        <button
          onClick={onSendMessage}
          disabled={!connected || !messageText.trim() || disabled}
          className="p-2 text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Send message"
        >
          <Send size={18} />
        </button>
      </div>
      <WalletModal
        currentUserId={currentUserId}
        activeConversation={activeConversation}
        activeGroupJid={activeGroupJid}
        buttonPosition={buttonPosition}
        showWalletModal={showWalletModal}
        setShowWalletModal={setShowWalletModal}
        addMessage={addMessage}
      />
      <EmojiPicker
        buttonPosition={buttonPosition}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
      />
    </div>
  );
};

export default ChatInput;
