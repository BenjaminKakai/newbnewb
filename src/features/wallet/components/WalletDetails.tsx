import React, { useState, useRef, useEffect } from "react";
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  Send,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";

interface WalletDetailsProps {
  onAddWalletClick?: () => void;
  onOpenModal?: (type: "deposit" | "withdraw" | "send") => void;
}

const WalletDetails: React.FC<WalletDetailsProps> = ({
  onAddWalletClick,
  onOpenModal,
}) => {
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] =
    useState<boolean>(false);
  const [walletName, setWalletName] = useState<string>("");

  // Get user and wallet data from stores
  const user = useAuthStore((state) => state.user);
  const { summary, isLoadingSummary } = useWalletStore();

  // Handle add wallet modal
  const handleAddWalletClick = () => {
    setIsAddWalletModalOpen(true);
  };

  const closeAddWalletModal = () => {
    setIsAddWalletModalOpen(false);
    setWalletName("");
  };

  const handleAddWalletSubmit = () => {
    if (!walletName.trim()) {
      return;
    }

    console.log("Creating wallet with name:", walletName);

    if (onAddWalletClick) {
      onAddWalletClick();
    }

    closeAddWalletModal();
  };

  return (
    <div className="flex flex-col bg-[var(--background)] text-[var(--foreground)] space-y-8">
      {/* Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cards
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => onOpenModal?.("deposit")}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-black border border-blue-500 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <img src="/deposit.svg" alt="Deposit Icon" className="w-4 h-4" />
              <span className="text-sm">Deposit</span>
            </button>
            <button
              onClick={() => onOpenModal?.("withdraw")}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-black border border-blue-500 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <img
                src="/withdrawal.svg"
                alt="Withdraw Icon"
                className="w-4 h-4"
              />
              <span className="text-sm">Withdraw</span>
            </button>

            <button
              onClick={() => onOpenModal?.("send")}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm">Send</span>
            </button>
          </div>
        </div>

        {/* Cards Container */}
        <div className="relative w-full overflow-hidden mb-4">
          <div className="flex space-x-4">
            {/* Primary Wallet Card */}
            <div
              className="rounded-2xl text-white p-6 w-80 h-48 relative shadow-lg overflow-hidden flex-shrink-0"
              style={{
                background:
                  "linear-gradient(to bottom right, #ff8c42, #ff6b1a)",
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium opacity-90">
                    Wasaa Wallet
                  </div>
                  <div className="w-8 h-6 bg-white/20 rounded backdrop-blur-sm flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>

                {/* Chip */}
                <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center mt-4">
                  <div className="w-8 h-6 bg-yellow-400 rounded-sm"></div>
                </div>

                {/* Card Number */}
                <div className="text-xl font-mono font-bold tracking-wider mt-4">
                  **** **** **** {summary?.id ? summary.id.slice(-4) : "3090"}
                </div>

                {/* Card Holder & Details */}
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-xs opacity-75">CARD HOLDER</div>
                    <div className="text-sm font-semibold">
                      {isLoadingSummary
                        ? "Loading..."
                        : user?.firstName?.toUpperCase() +
                            " " +
                            user?.lastName?.toUpperCase() || "PETER CROUCH"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">EXPIRES</div>
                    <div className="text-sm font-semibold">09/24</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Wallet Card (Partially Visible) */}
            <div
              className="rounded-2xl text-white p-6 w-80 h-48 relative shadow-lg overflow-hidden flex-shrink-0"
              style={{
                background:
                  "linear-gradient(to bottom right, #4285f4, #1e88e5)",
                marginRight: "-120px",
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium opacity-90">
                    Wasaa Wallet
                  </div>
                  <div className="w-8 h-6 bg-white/20 rounded backdrop-blur-sm flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>

                {/* Chip */}
                <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center mt-4">
                  <div className="w-8 h-6 bg-yellow-400 rounded-sm"></div>
                </div>

                {/* Card Number */}
                <div className="text-xl font-mono font-bold tracking-wider mt-4">
                  **** **** **** {summary?.id ? summary.id.slice(-4) : "3090"}
                </div>

                {/* Card Holder & Details */}
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-xs opacity-75">CARD HOLDER</div>
                    <div className="text-sm font-semibold">
                      {isLoadingSummary
                        ? "Loading..."
                        : user?.firstName?.toUpperCase() +
                            " " +
                            user?.lastName?.toUpperCase() || "PETER CROUCH"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">EXPIRES</div>
                    <div className="text-sm font-semibold">09/24</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Navigation */}
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 transition-colors"
            style={{ color: "#088EF9" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0671d9")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#088EF9")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wallet Info Section */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold  mb-4">Wallet Info</h3>
        <div className=" p-4 rounded-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium">Wallet ID</span>
              <span className="font-semibold ">
                **** **** **** {summary?.id ? summary.id.slice(-4) : "3090"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium">Status</span>
              <span
                className={`font-semibold px-2 py-1 dark:text-black rounded-full text-xs ${
                  summary?.status === "Active"
                    ? "text-green-600 bg-green-50 dark:text-black"
                    : "text-yellow-600 bg-yellow-50"
                }`}
              >
                {summary?.status || "Active"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 ">
              <span className="font-medium">Currency</span>
              <span className="font-semibold ">
                {summary?.currencyDetails?.name || summary?.currency || "KES"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 ">
              <span className="font-medium">Balance</span>
              <span className="font-bold  text-lg">
                {summary?.currencyDetails?.symbol || summary?.currency || "KES"}{" "}
                {isLoadingSummary
                  ? "..."
                  : summary?.balance?.toLocaleString() || "50,000.00"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Wallet Modal */}
      {isAddWalletModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Wallet
              </h3>
              <button
                onClick={closeAddWalletModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <label
                htmlFor="walletName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Wallet Name *
              </label>
              <input
                id="walletName"
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name (e.g., Personal Wallet, Business Wallet)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeAddWalletModal}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWalletSubmit}
                disabled={!walletName.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                style={{
                  backgroundColor: !walletName.trim() ? "#d1d5db" : "#088EF9",
                }}
                onMouseEnter={(e) => {
                  if (walletName.trim()) {
                    e.currentTarget.style.backgroundColor = "#0671d9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (walletName.trim()) {
                    e.currentTarget.style.backgroundColor = "#088EF9";
                  }
                }}
              >
                <DollarSign className="w-4 h-4" />
                <span>Create Wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDetails;
