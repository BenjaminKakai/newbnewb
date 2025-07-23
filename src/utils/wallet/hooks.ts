// utils/wallet/hooks.ts
import { useEffect, useCallback } from 'react';
import { useWalletStore, Transaction, TransactionFilterParams } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

// Hook for initializing wallet data
export const useWalletInit = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { refreshWallet, refreshTransactions, walletId } = useWalletStore();

  useEffect(() => {
    if (user && isAuthenticated) {
      // Initial data fetch
      refreshWallet();
    }
  }, [user, isAuthenticated, refreshWallet]);

  useEffect(() => {
    if (walletId) {
      // Fetch transactions when wallet ID is available
      refreshTransactions();
    }
  }, [walletId, refreshTransactions]);
};

// Hook for real-time wallet updates (could be extended with WebSocket)
export const useWalletRealtime = () => {
  const { refreshWallet, refreshTransactions } = useWalletStore();

  const refreshData = useCallback(() => {
    refreshWallet();
    refreshTransactions();
  }, [refreshWallet, refreshTransactions]);

  // Could add WebSocket connection here for real-time updates
  useEffect(() => {
    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(refreshData, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  return { refreshData };
};

// Hook for advanced transaction filtering
export const useTransactionFiltering = () => {
  const { 
    transactionFilters, 
    setTransactionFilters, 
    clearTransactionFilters, 
    refreshTransactions 
  } = useWalletStore();

  const applyDateFilter = useCallback((period: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom', customStartDate?: Date, customEndDate?: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (period) {
      case 'today':
        startDate = today.toISOString();
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString();
        endDate = today.toISOString();
        break;
      case 'thisWeek':
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        startDate = thisWeekStart.toISOString();
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'thisMonth':
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = thisMonthStart.toISOString();
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = lastMonthStart.toISOString();
        endDate = lastMonthEnd.toISOString();
        break;
      case 'custom':
        startDate = customStartDate?.toISOString();
        endDate = customEndDate?.toISOString();
        break;
    }

    setTransactionFilters({ startDate, endDate });
    refreshTransactions(1, { startDate, endDate });
  }, [setTransactionFilters, refreshTransactions]);

  const applyAmountFilter = useCallback((minAmount?: number, maxAmount?: number, type: 'debit' | 'credit' | 'all' = 'all') => {
    const filters: Partial<TransactionFilterParams> = {};
    
    if (type === 'debit') {
      filters.minDebit = minAmount;
      filters.maxDebit = maxAmount;
    } else if (type === 'credit') {
      filters.minCredit = minAmount;
      filters.maxCredit = maxAmount;
    } else {
      // For 'all', apply to both debit and credit
      if (minAmount !== undefined) {
        filters.minDebit = minAmount;
        filters.minCredit = minAmount;
      }
      if (maxAmount !== undefined) {
        filters.maxDebit = maxAmount;
        filters.maxCredit = maxAmount;
      }
    }

    setTransactionFilters({ minAmount, maxAmount, type });
    refreshTransactions(1, filters);
  }, [setTransactionFilters, refreshTransactions]);

  const applyStatusFilter = useCallback((status?: Transaction['status']) => {
    setTransactionFilters({ status });
    refreshTransactions(1, { status });
  }, [setTransactionFilters, refreshTransactions]);

  const clearAllFilters = useCallback(() => {
    clearTransactionFilters();
    refreshTransactions();
  }, [clearTransactionFilters, refreshTransactions]);

  return {
    filters: transactionFilters,
    applyDateFilter,
    applyAmountFilter,
    applyStatusFilter,
    clearAllFilters,
  };
};

// Hook for wallet balance validation
export const useWalletValidation = () => {
  const { summary } = useWalletStore();

  const validateTransaction = useCallback((amount: number, type: 'send' | 'withdraw') => {
    if (!summary) {
      return { isValid: false, error: 'Wallet not loaded' };
    }

    if (amount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    if ((type === 'send' || type === 'withdraw') && amount > summary.balance) {
      return { isValid: false, error: 'Insufficient balance' };
    }

    if (summary.limits?.maxPerTransaction && amount > summary.limits.maxPerTransaction) {
      return { isValid: false, error: `Amount exceeds maximum limit of ${summary.currency} ${summary.limits.maxPerTransaction}` };
    }

    return { isValid: true, error: null };
  }, [summary]);

  const getAvailableBalance = useCallback(() => {
    return summary?.availableBalance || summary?.balance || 0;
  }, [summary]);

  const getPendingBalance = useCallback(() => {
    return summary?.pendingBalance || 0;
  }, [summary]);

  const canWithdraw = useCallback(() => {
    return summary?.limits?.withdrawalEnabled || false;
  }, [summary]);

  const getDailyLimit = useCallback(() => {
    return summary?.limits?.dailyLimit || 0;
  }, [summary]);

  return {
    validateTransaction,
    getAvailableBalance,
    getPendingBalance,
    canWithdraw,
    getDailyLimit,
    currency: summary?.currency || 'KSH',
    tier: summary?.tier || 'Tier 0'
  };
};

// Hook for transaction search (local search on fetched transactions)
export const useTransactionSearch = (transactions: Transaction[], searchTerm: string) => {
  const searchResults = useCallback(() => {
    if (!searchTerm.trim()) return transactions;
    
    const term = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.description?.toLowerCase().includes(term) ||
      transaction.type.toLowerCase().includes(term) ||
      transaction.recipientName?.toLowerCase().includes(term) ||
      transaction.senderName?.toLowerCase().includes(term) ||
      transaction.reference?.toLowerCase().includes(term) ||
      transaction.amount.toString().includes(term) ||
      transaction.status.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  return searchResults();
};

// Types for wallet operations
export interface WalletOperationResult {
  success: boolean;
  message?: string;
  transactionId?: string;
  error?: string;
}

export interface TransactionFilter {
  type?: Transaction['type'];
  status?: Transaction['status'];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'KSH') => {
  return `${currency} ${amount.toLocaleString('en-KE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const formatTransactionDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays <= 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
};

export const formatTransactionTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Transaction status helpers
export const getStatusColor = (status: Transaction['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-600 bg-green-50';
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-50';
    case 'FAILED':
      return 'text-red-600 bg-red-50';
    case 'CANCELLED':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getTypeColor = (type: Transaction['type']) => {
  switch (type) {
    case 'RECEIVE':
    case 'DEPOSIT':
      return 'text-green-600';
    case 'SEND':
    case 'WITHDRAWAL':
    case 'PAYMENT':
      return 'text-red-600';
    case 'REFUND':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

// Advanced transaction analytics
export const useTransactionAnalytics = () => {
  const { transactions } = useWalletStore();

  const getTransactionStats = useCallback((period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const periodTransactions = transactions.filter(t => 
      new Date(t.timestamp) >= startDate && t.status === 'COMPLETED'
    );

    const totalSent = periodTransactions
      .filter(t => t.type === 'SEND' || t.type === 'WITHDRAWAL' || t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalReceived = periodTransactions
      .filter(t => t.type === 'RECEIVE' || t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions: periodTransactions.length,
      totalSent,
      totalReceived,
      netFlow: totalReceived - totalSent,
      avgTransactionAmount: periodTransactions.length > 0 
        ? periodTransactions.reduce((sum, t) => sum + t.amount, 0) / periodTransactions.length 
        : 0
    };
  }, [transactions]);

  return { getTransactionStats };
};