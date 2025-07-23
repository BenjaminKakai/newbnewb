import React from "react";
import {
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Transaction } from "@/store/walletStore";

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  onTransactionClick: (transaction: Transaction) => void;
  onRefund: (transaction: Transaction, event?: React.MouseEvent) => void;
  isTransactionRefundable: (transaction: Transaction) => boolean;
  limit?: number; // Add optional limit prop
  showFullDetails?: boolean; // Add prop to show full details
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  isLoading,
  error,
  onTransactionClick,
  onRefund,
  isTransactionRefundable,
  limit = 5, // Default to 5 transactions
  showFullDetails = false, // Default to compact view
}) => {
  // Function to get transaction icon
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === "RECEIVE" || transaction.type === "TOPUP") {
      return <Download className="w-5 h-5 text-blue-500" />;
    } else {
      return <Upload className="w-5 h-5 text-blue-500" />;
    }
  };

  // Function to get status icon
  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

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

  // Apply limit to transactions
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  if (isLoading) {
    return (
      <div className="bg-[var(--background)] text-[var(--foreground)] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
              <div className="w-10 h-10 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 rounded w-3/4 mb-2"></div>
                <div className="h-3 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=" rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Failed to load transactions</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className=" rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-b dark:border-gray-200">
      <div className="max-h-96 overflow-y-auto">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            onClick={() => onTransactionClick(transaction)}
            className="p-4 hover:bg-gray-50 hover:rounded-lg cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-b-0 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction)}
                </div>
                <div>
                  <div className="font-medium">
                    {transaction.type === "RECEIVE" ? "Received" : 
                     transaction.type === "TOPUP" ? "Deposited" :
                     transaction.type === "SEND" ? "Sent" : "Withdraw"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTransactionDate(transaction.timestamp)}, {formatTransactionTime(transaction.timestamp)}
                  </div>
                  {/* Show description in full details mode */}
                  {showFullDetails && transaction.description && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {transaction.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-semibold ${
                    transaction.type === "RECEIVE" || transaction.type === "TOPUP"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "RECEIVE" || transaction.type === "TOPUP" ? "+" : "-"}
                  {transaction.currency} {transaction.amount.toLocaleString()}
                </div>
                {transaction.status && (
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    {getStatusIcon(transaction.status)}
                    {/* Show status text in full details mode */}
                    {showFullDetails && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {transaction.status}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {isTransactionRefundable(transaction) && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={(e) => onRefund(transaction, e)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 transition-colors"
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
  );
};

export default TransactionHistory;