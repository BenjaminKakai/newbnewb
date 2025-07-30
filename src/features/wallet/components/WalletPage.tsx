"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Send,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore, Transaction } from "@/store/walletStore";
import WalletDetails from "./WalletDetails";
import TransactionHistory from "./TransactionHistory";
import Expenditure from "./Expenditure";
import SidebarNav from "@/components/SidebarNav";
import toast from "react-hot-toast";

// Transaction Form Data Interface
interface TransactionFormData {
  amount: number;
  description: string;
  recipientId?: string;
  recipientName?: string;
  recipientPhone?: string;
}

const WalletPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Get wallet data from Zustand store
  const {
    transactions,
    isLoadingTransactions,
    error,
    refreshWallet,
    refreshTransactions,
    sendPayment,
    lastPaymentResult,
    clearLastPaymentResult,
  } = useWalletStore();

  // UI state
  const [selectedFilter, setSelectedFilter] = useState<string>("This Month");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"deposit" | "withdraw" | "send">(
    "deposit"
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);
  const [selectedTransactionForRefund, setSelectedTransactionForRefund] =
    useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");
  const [isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen] =
    useState<boolean>(false);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] =
    useState<Transaction | null>(null);
  const [showAllTransactionsModal, setShowAllTransactionsModal] =
    useState<boolean>(false);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState<TransactionFormData>({
    amount: 0,
    description: "",
    recipientId: "",
    recipientName: "",
    recipientPhone: "",
  });

  // Initialize wallet data when component mounts
  useEffect(() => {
    if (user && isAuthenticated) {
      refreshWallet();
      refreshTransactions();
    }
  }, [user, isAuthenticated, refreshWallet, refreshTransactions]);

  // Handle payment results
  useEffect(() => {
    if (lastPaymentResult) {
      if (lastPaymentResult.success) {
        toast.success("Transaction completed successfully!");
        closeModal();
        refreshWallet();
        refreshTransactions();
      } else {
        toast.error(lastPaymentResult.error || "Transaction failed");
      }
      clearLastPaymentResult();
    }
  }, [
    lastPaymentResult,
    clearLastPaymentResult,
    refreshWallet,
    refreshTransactions,
  ]);

  // Function to open transaction modal
  const openModal = (type: "deposit" | "withdraw" | "send") => {
    setModalType(type);
    setTransactionForm({
      amount: 0,
      description: "",
      recipientId: "",
      recipientName: "",
      recipientPhone: "",
    });
    setIsModalOpen(true);
  };

  // Function to close transaction modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to handle show all transactions
  const handleShowAllTransactions = () => {
    setShowAllTransactionsModal(true);
  };

  // Function to close all transactions modal
  const closeAllTransactionsModal = () => {
    setShowAllTransactionsModal(false);
  };

  // Function to handle add wallet click
  const handleAddWallet = () => {
    console.log("Add wallet clicked");
    toast.info("Add wallet functionality coming soon!");
  };

  // Function to handle transaction click
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransactionForDetails(transaction);
    setIsTransactionDetailsModalOpen(true);
  };

  // Function to close transaction details modal
  const closeTransactionDetailsModal = () => {
    setIsTransactionDetailsModalOpen(false);
    setSelectedTransactionForDetails(null);
  };

  // Function to check if transaction is refundable
  const isTransactionRefundable = (transaction: Transaction) => {
    const transactionDate = new Date(transaction.timestamp);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return (
      (transaction.type === "SEND" || transaction.type === "PAYMENT") &&
      transactionDate <= oneWeekAgo
    );
  };

  // Function to handle refund
  const handleRefund = (transaction: Transaction, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedTransactionForRefund(transaction);
    setIsRefundModalOpen(true);
  };

  // Function to close refund modal
  const closeRefundModal = () => {
    setIsRefundModalOpen(false);
    setSelectedTransactionForRefund(null);
    setRefundReason("");
  };

  // Function to submit refund request
  const handleRefundSubmit = () => {
    if (!selectedTransactionForRefund || !refundReason.trim()) {
      return;
    }

    console.log("Refund request:", {
      transactionId: selectedTransactionForRefund.id,
      reason: refundReason,
      amount: selectedTransactionForRefund.amount,
    });

    toast.success("Refund request submitted successfully");
    closeRefundModal();
  };

  // Function to handle transaction form input changes
  const handleInputChange = (
    field: keyof TransactionFormData,
    value: string | number
  ) => {
    setTransactionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to handle transaction submission
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (transactionForm.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!transactionForm.description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (
      modalType === "send" &&
      !transactionForm.recipientPhone?.trim() &&
      !transactionForm.recipientId?.trim()
    ) {
      toast.error("Please enter recipient phone number or ID");
      return;
    }

    try {
      if (modalType === "deposit") {
        toast.info("Deposit functionality integration needed");
        closeModal();
      } else if (modalType === "withdraw") {
        toast.info("Withdrawal functionality integration needed");
        closeModal();
      } else if (modalType === "send") {
        const success = await sendPayment({
          recipientId: transactionForm.recipientId || "user_recipient",
          amount: transactionForm.amount,
          currency: "KSH",
          description: transactionForm.description,
          reference: `REF_${Date.now()}`,
        });

        if (!success) {
          console.log("Payment failed");
        }
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed. Please try again.");
    }
  };

  // Apply filter to transactions
  const getFilteredTransactions = () => {
    if (!transactions.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), now.getMonth(), 0);

    let filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.timestamp);

      switch (selectedFilter) {
        case "Today":
          return transactionDate >= today;
        case "Yesterday":
          return transactionDate >= yesterday && transactionDate < today;
        case "This Week":
          return transactionDate >= thisWeekStart;
        case "This Month":
          return transactionDate >= thisMonthStart;
        case "Last Month":
          return (
            transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd
          );
        default:
          return true;
      }
    });

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.recipientName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.senderName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Function to format date
  const formatTransactionDate = (date: string) => {
    const transactionDate = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - transactionDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return transactionDate.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      return transactionDate.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  // Function to format time
  const formatTransactionTime = (date: string) => {
    const transactionDate = new Date(date);
    return transactionDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Transaction type options
  const transactionTypes = [
    {
      value: "deposit",
      label: "Deposit",
      icon: ArrowDownLeft,
      color: "text-green-600",
    },
    {
      value: "withdraw",
      label: "Withdraw",
      icon: ArrowUpRight,
      color: "text-red-600",
    },
    { value: "send", label: "Send Money", icon: Send, color: "text-blue-600" },
  ];

  const getModalTitle = () => {
    switch (modalType) {
      case "deposit":
        return "Deposit Money";
      case "withdraw":
        return "Withdraw Money";
      case "send":
        return "Send Money";
      default:
        return "Transaction";
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNav onClose={() => {}} currentPath="/wallet" />

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-[var(--background)] text-[var(--foreground)] ml-20 overflow-hidden">
        <div className="flex-1 p-4 md:p-6 lg:p-8 xl:p-10 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold ">Your Wallet</h1>
          </div>

          {/* Main Layout - Two Columns */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 lg:gap-8 min-h-0 overflow-hidden">
            {/* Left Column - Cards and Wallet Info */}
            <div className="flex flex-col overflow-hidden">
              <WalletDetails
                onAddWalletClick={handleAddWallet}
                onOpenModal={openModal}
              />
            </div>

            {/* Right Column - Expenditure and Transaction History */}
            <div className="flex flex-col space-y-4 md:space-y-6 lg:space-y-8 overflow-hidden">
              {/* Expenditure Chart */}
              <div className="flex-shrink-0">
                <Expenditure />
              </div>

              {/* Latest Transaction Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h3 className="text-lg font-semibold ">Latest Transaction</h3>
                  <button
                    onClick={handleShowAllTransactions}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Show all
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <TransactionHistory
                    transactions={filteredTransactions}
                    isLoading={isLoadingTransactions}
                    error={error}
                    onTransactionClick={handleTransactionClick}
                    onRefund={handleRefund}
                    isTransactionRefundable={isTransactionRefundable}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0  text-[var(--foreground)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] text-[var(--foreground)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{getModalTitle()}</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              {/* Transaction Type Dropdown */}
              <div>
                <label className="block text-sm font-medium  mb-2">
                  Transaction Type
                </label>
                <div className="relative">
                  <select
                    value={modalType}
                    onChange={(e) =>
                      setModalType(
                        e.target.value as "deposit" | "withdraw" | "send"
                      )
                    }
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent   appearance-none"
                  >
                    {transactionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium  mb-2">
                  Amount (KSH)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transactionForm.amount || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Recipient Fields (only for send) */}
              {modalType === "send" && (
                <>
                  <div>
                    <label className="block text-sm font-medium  mb-2">
                      Recipient Phone Number
                    </label>
                    <input
                      type="tel"
                      value={transactionForm.recipientPhone || ""}
                      onChange={(e) =>
                        handleInputChange("recipientPhone", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                      placeholder="+254700000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium  mb-2">
                      Recipient Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={transactionForm.recipientName || ""}
                      onChange={(e) =>
                        handleInputChange("recipientName", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                      placeholder="John Doe"
                    />
                  </div>
                </>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium  mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={transactionForm.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent   resize-none"
                  placeholder="What is this transaction for?"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-[#2A8FEA] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {modalType === "deposit"
                    ? "Deposit"
                    : modalType === "withdraw"
                    ? "Withdraw"
                    : "Send Money"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {isTransactionDetailsModalOpen && selectedTransactionForDetails && (
        <div className="fixed inset-0 bg-[var(--background)]/50 text-[var(--foreground)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className=" rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold ">Transaction Details</h3>
              <button
                onClick={closeTransactionDetailsModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--background)]/50 text-[var(--foreground)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center">
                    {selectedTransactionForDetails.type === "RECEIVE" ||
                    selectedTransactionForDetails.type === "TOPUP" ? (
                      <Download className="w-5 h-5 text-green-500" />
                    ) : (
                      <Upload className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold ">
                      {selectedTransactionForDetails.type}
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedTransactionForDetails.status && (
                        <>
                          {selectedTransactionForDetails.status.toLowerCase() ===
                            "completed" && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {selectedTransactionForDetails.status.toLowerCase() ===
                            "pending" && (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                          {selectedTransactionForDetails.status.toLowerCase() ===
                            "failed" && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {selectedTransactionForDetails.status ||
                              "Completed"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      selectedTransactionForDetails.type === "RECEIVE" ||
                      selectedTransactionForDetails.type === "TOPUP"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransactionForDetails.type === "RECEIVE" ||
                    selectedTransactionForDetails.type === "TOPUP"
                      ? "+"
                      : "-"}
                    {selectedTransactionForDetails.currency}{" "}
                    {selectedTransactionForDetails.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">
                    Transaction ID
                  </span>
                  <span className="font-mono text-sm ">
                    {selectedTransactionForDetails.id.substring(0, 8)}...
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400">
                    Date & Time
                  </span>
                  <div className="text-right">
                    <div className="">
                      {formatTransactionDate(
                        selectedTransactionForDetails.timestamp
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTransactionTime(
                        selectedTransactionForDetails.timestamp
                      )}
                    </div>
                  </div>
                </div>

                {selectedTransactionForDetails.description && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">
                      Description
                    </span>
                    <span className=" text-right max-w-48 truncate">
                      {selectedTransactionForDetails.description}
                    </span>
                  </div>
                )}
              </div>

              {isTransactionRefundable(selectedTransactionForDetails) && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      closeTransactionDetailsModal();
                      handleRefund(selectedTransactionForDetails);
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Request Refund</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Transactions Modal */}
      {showAllTransactionsModal && (
        <div className="fixed inset-0 bg-[var(--background)]/50 text-[var(--foreground)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--background)] text-[var(--foreground)] rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold ">All Transactions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {filteredTransactions.length} transactions found
                </p>
              </div>
              <button
                onClick={closeAllTransactionsModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="sm:w-48">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                  >
                    <option value="This Month">This Month</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="This Week">This Week</option>
                    <option value="Last Month">Last Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions List - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Loading transactions...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Failed to load transactions
                    </p>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No transactions found
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <div className="divide-y divide-gray-100 dark:divide-gray-600">
                    {filteredTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        onClick={() => {
                          closeAllTransactionsModal();
                          handleTransactionClick(transaction);
                        }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                              {transaction.type === "RECEIVE" ||
                              transaction.type === "TOPUP" ? (
                                <Download className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Upload className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium  truncate">
                                {transaction.type === "RECEIVE"
                                  ? "Received"
                                  : transaction.type === "TOPUP"
                                  ? "Deposited"
                                  : transaction.type === "SEND"
                                  ? "Sent"
                                  : "Withdraw"}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTransactionDate(transaction.timestamp)},{" "}
                                {formatTransactionTime(transaction.timestamp)}
                              </div>
                              {transaction.description && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                  {transaction.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div
                              className={`font-semibold ${
                                transaction.type === "RECEIVE" ||
                                transaction.type === "TOPUP"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "RECEIVE" ||
                              transaction.type === "TOPUP"
                                ? "+"
                                : "-"}
                              {transaction.currency}{" "}
                              {transaction.amount.toLocaleString()}
                            </div>
                            {transaction.status && (
                              <div className="flex items-center justify-end space-x-1 mt-1">
                                {transaction.status.toLowerCase() ===
                                  "completed" && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                {transaction.status.toLowerCase() ===
                                  "pending" && (
                                  <Clock className="w-4 h-4 text-yellow-500" />
                                )}
                                {transaction.status.toLowerCase() ===
                                  "failed" && (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {transaction.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isTransactionRefundable(transaction) && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                closeAllTransactionsModal();
                                handleRefund(transaction, e);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Request Refund"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 bg-[var(--background)] text-[var(--foreground)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold ">Request Refund</h3>
              <button
                onClick={closeRefundModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {selectedTransactionForRefund && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium ">
                    {selectedTransactionForRefund.type}
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    -{selectedTransactionForRefund.currency}{" "}
                    {selectedTransactionForRefund.amount.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTransactionDate(
                    selectedTransactionForRefund.timestamp
                  )}{" "}
                  •{" "}
                  {formatTransactionTime(
                    selectedTransactionForRefund.timestamp
                  )}
                </div>
                {selectedTransactionForRefund.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {selectedTransactionForRefund.description}
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="refundReason"
                className="block text-sm font-medium  mb-2"
              >
                Reason for Refund *
              </label>
              <textarea
                id="refundReason"
                rows={4}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please provide a detailed reason for requesting this refund..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  "
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeRefundModal}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundSubmit}
                disabled={!refundReason.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
