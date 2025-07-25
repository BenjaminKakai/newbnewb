import React, { useState, useEffect, useRef } from "react";
import { X, DollarSign, Send, Loader } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";

interface WalletModalProps {
  currentUserId?: string;
  activeConversation?: string;
  activeGroupJid?: string;
  buttonPosition?: { top: number; left: number; width: number };
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
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

const WalletModal: React.FC<WalletModalProps> = ({
  currentUserId,
  activeConversation,
  activeGroupJid,
  buttonPosition,
  showWalletModal,
  setShowWalletModal,
  addMessage,
}) => {
  const {
    summary,
    isLoadingSummary,
    refreshWallet,
    error: walletError,
    isSending,
    sendPayment,
  } = useWalletStore();

  const [amount, setAmount] = useState("");
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Refresh wallet data and reset state when modal opens
  useEffect(() => {
    if (showWalletModal) {
      refreshWallet();
      setAmount("");
      setPinDigits(["", "", "", ""]);
      setError("");
      setShowPinInput(false);
    }
  }, [showWalletModal, refreshWallet]);

  // Focus first PIN input when shown
  useEffect(() => {
    if (showPinInput && pinInputRefs.current[0]) {
      pinInputRefs.current[0].focus();
    }
  }, [showPinInput]);

  // Listen for wallet store errors
  useEffect(() => {
    if (walletError) {
      setError(walletError);
      setIsProcessing(false);
    }
  }, [walletError]);

  if (!showWalletModal) return null;

  // Get current balance from summary
  const getCurrentBalance = () => {
    return summary?.balance || 0;
  };

  // Get currency symbol or code
  const getCurrency = () => {
    if (summary?.currencyDetails?.symbol) {
      return summary.currencyDetails.symbol;
    }
    if (summary?.currencyDetails?.name) {
      return summary.currencyDetails.name;
    }
    if (summary?.currency) {
      return summary.currency;
    }
    return "Ksh";
  };

  // Format currency for display
  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = value ?? 0;
    return `${getCurrency()} ${safeValue.toLocaleString()}`;
  };

  // Get display name from JID
  const getConversationDisplayName = () => {
    const jid = activeConversation || activeGroupJid || "";
    if (!jid) return "Unknown";
    const username = jid.split("@")[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Validate amount
  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Please enter a valid amount";
    }
    if (numAmount > getCurrentBalance()) {
      return "Insufficient wallet balance";
    }
    if (getCurrentBalance() <= 0) {
      return "No funds available in wallet";
    }
    return null;
  };

  // Validate PIN
  const validatePin = () => {
    const pin = pinDigits.join("");
    if (!pin.match(/^\d{4}$/)) {
      return "Please enter a valid 4-digit PIN";
    }
    return null;
  };

  // Handle PIN input change
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Allow only single digit or empty
    const newPinDigits = [...pinDigits];
    newPinDigits[index] = value;
    setPinDigits(newPinDigits);
    setError("");

    // Move focus to next input if a digit is entered
    if (value && index < 3 && pinInputRefs.current[index + 1]) {
      pinInputRefs.current[index + 1]!.focus();
    }
  };

  // Handle PIN keypress (e.g., backspace, Enter)
  const handlePinKeyPress = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (pinDigits.every((digit) => digit !== "")) {
        sendPaymentHandler();
      }
    }
  };

  // Handle amount submission
  const handleAmountSubmit = () => {
    if (!currentUserId || (!activeConversation && !activeGroupJid)) {
      setError("No recipient or user ID available");
      return;
    }

    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setShowPinInput(true);
  };

  // Handle amount keypress
  const handleAmountKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAmountSubmit();
    }
  };

  // Send payment
  const sendPaymentHandler = async () => {
    const pinError = validatePin();
    if (pinError) {
      setError(pinError);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const numAmount = parseFloat(amount);
      const pin = pinDigits.join("");
      const clientMessageId = Date.now().toString();
      const conversationId = activeConversation || activeGroupJid || "";
      const recipientId = conversationId.split("@")[0];

      console.log("💸 Sending payment via wallet modal:", {
        recipientId,
        amount: numAmount,
        currency: getCurrency(),
        description: `Payment to ${getConversationDisplayName()}`,
        reference: `CHAT_${clientMessageId}`,
        pin,
      });

      const success = await sendPayment({
        recipientId,
        amount: numAmount,
        currency: getCurrency(),
        description: `Payment to ${getConversationDisplayName()}`,
        reference: `CHAT_${clientMessageId}`,
        pin,
      });

      if (success) {
        const paymentMessage = {
          id: clientMessageId,
          clientMessageId,
          conversationId,
          senderId: currentUserId,
          senderName: "You",
          content: `Sent ${formatCurrency(numAmount)}`,
          type: "PAYMENT" as const,
          sentAt: new Date(),
          status: "sent" as const,
          isPayment: true,
        };

        addMessage(paymentMessage);

        const paymentData = {
          conversationId,
          content: paymentMessage.content,
          type: "PAYMENT",
          clientMessageId,
          paymentAmount: numAmount,
        };

        // chatSocketService.sendMessage(paymentData);
        handleClose();

        setTimeout(() => {
          refreshWallet();
        }, 1000);
      } else {
        setError("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      setError(
        error instanceof Error ? error.message : "Payment failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Close modal
  const handleClose = () => {
    setShowWalletModal(false);
    setAmount("");
    setPinDigits(["", "", "", ""]);
    setError("");
    setShowPinInput(false);
  };

  // Calculate modal position
  const getModalStyle = () => {
    if (!buttonPosition) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50,
      };
    }

    const modalWidth = 320;
    const modalHeight = showPinInput ? 360 : 300; // Increased height for PIN inputs
    const offset = 10;

    let top = buttonPosition.top - modalHeight - offset;
    let left = buttonPosition.left + buttonPosition.width / 2 - modalWidth / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + modalWidth > viewportWidth - 10) {
      left = viewportWidth - modalWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    if (top < 10) {
      top = buttonPosition.top + offset;
    }

    return {
      position: "fixed" as const,
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 50,
    };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-white/50 dark:bg-black/50 bg-opacity-30 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={getModalStyle()}
        className="bg-[var(--background)] text-[var(--foreground)] not-first:rounded-3xl shadow-xl w-80 p-6"
      >
        {/* Available Balance */}
        <div className="text-center mb-6">
          <p className="text-[var(--foreground)] text-sm mb-2">
            Available Balance
          </p>
          {isLoadingSummary ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-[var(--foreground)]">
                Loading...
              </p>
            </div>
          ) : (
            <p className="text-2xl font-bold text-blue-500">
              {formatCurrency(getCurrentBalance())}
            </p>
          )}
        </div>

        <hr className="border-gray-200 mb-6" />

        {/* Conditional Rendering: Amount or PIN Input */}
        {!showPinInput ? (
          <>
            {/* Send Amount */}
            <div className="mb-4">
              <label className="block text-[var(--foreground)] text-xs font-medium mb-3">
                Send Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                onKeyPress={handleAmountKeyPress}
                placeholder="Enter amount"
                className="w-full px-4 py-1 border border-gray-300 text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                disabled={isLoadingSummary || isProcessing || isSending}
                autoFocus
              />
            </div>
          </>
        ) : (
          <>
            {/* PIN Input */}
            <div className="mb-4">
              <label className="block text-[var(--foreground)] text-xs font-medium mb-3">
                Enter 4-Digit PIN
              </label>
              <div className="flex space-x-2 justify-center">
                {pinDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (pinInputRefs.current[index] = el)}
                    type="password"
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyPress(index, e)}
                    placeholder="•"
                    className="w-12 h-12 text-center text-lg border border-gray-300 text-black dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={1}
                    disabled={isLoadingSummary || isProcessing || isSending}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={showPinInput ? sendPaymentHandler : handleAmountSubmit}
          disabled={
            (!showPinInput &&
              (!amount ||
                parseFloat(amount) <= 0 ||
                isProcessing ||
                isLoadingSummary ||
                isSending ||
                getCurrentBalance() <= 0)) ||
            (showPinInput &&
              (pinDigits.some((digit) => digit === "") ||
                isProcessing ||
                isSending))
          }
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isProcessing || isSending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : isLoadingSummary ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <span>{showPinInput ? "Confirm Payment" : "Continue"}</span>
          )}
        </button>
      </div>
    </>
  );
};

export default WalletModal;