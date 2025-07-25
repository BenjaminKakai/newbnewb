import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Types
export interface WalletSummary {
  id: string;
  balance: number;
  currency: string;
  pendingBalance?: number;
  availableBalance?: number;
  lastUpdated?: string;
  status?: string;
  tier?: string;
  limits?: {
    dailyLimit: number;
    withdrawalEnabled: boolean;
    maxPerTransaction: number;
  };
  lockedBalance?: number;
  debit?: number;
  credit?: number;
  userUuid?: string;
  groupUuid?: string | null;
  type?: string;
  currencyDetails?: {
    uuid: string;
    name: string;
    code: string;
    symbol: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionMetadata {
  balance?: number;
  runningBalance?: number;
  paymentMethod?: string;
  paymentChannel?: string;
  counterparty?: string;
  fee?: number;
  originalAmount?: number;
  exchangeRate?: number;
  transactionCode?: string;
  merchantId?: string;
  merchantName?: string;
  debit?: string;
  credit?: string;
  [key: string]: unknown;
}

export interface Transaction {
  id: string;
  type: "SEND" | "RECEIVE" | "TOPUP" | "WITHDRAWAL" | "PAYMENT" | "REFUND";
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  description?: string;
  reference?: string;
  recipientId?: string;
  recipientName?: string;
  senderId?: string;
  senderName?: string;
  timestamp: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: TransactionMetadata;
}

export interface PaymentRequest {
  recipientId: string;
  recipientWalletId?: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  accountHolderName: string;
  isDefault?: boolean;
  isVerified?: boolean;
}

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: string;
  type: string;
  availableBalance: string;
  lockedBalance: string;
  debit: string;
  credit: string;
  userUuid: string;
  groupUuid: string | null;
  currencyDetails: {
    uuid: string;
    name: string;
    code: string;
    symbol: string;
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiTransactionResponse {
  id?: string;
  uuid?: string;
  type?: string;
  amount?: string | number;
  debit?: string;
  credit?: string;
  currency?: {
    code?: string;
    symbol?: string;
  } | string;
  status?: string;
  description?: string;
  narration?: string;
  memo?: string;
  reference?: string;
  transactionRef?: string;
  referenceNumber?: string;
  recipientId?: string;
  beneficiaryId?: string;
  recipientName?: string;
  beneficiaryName?: string;
  senderId?: string;
  initiatorId?: string;
  senderName?: string;
  initiatorName?: string;
  createdAt?: string;
  transactionDate?: string;
  timestamp?: string;
  updatedAt?: string;
  balance?: number;
  runningBalance?: number;
  paymentMethod?: string;
  paymentChannel?: string;
  counterparty?: string;
  fee?: number;
  transactionFee?: number;
  originalAmount?: number;
  exchangeRate?: number;
  transactionCode?: string;
  merchantId?: string;
  merchantName?: string;
}

interface WalletState {
  walletId: string | null;
  summary: WalletSummary | null;
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  transactionsPagination: PaginationInfo | null;
  transactionFilters: {
    status?: Transaction["status"];
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    type?: "debit" | "credit" | "all";
  };
  bankAccounts: BankAccount[];
  userWallets: Map<string, UserWallet>;
  isLoading: boolean;
  isLoadingTransactions: boolean;
  isLoadingSummary: boolean;
  isSending: boolean;
  isLoadingUserWallet: boolean;
  error: string | null;
  lastPaymentResult: {
    success: boolean;
    transactionId?: string;
    error?: string;
  } | null;
}

interface WalletActions {
  setWalletSummary: (summary: WalletSummary) => void;
  updateBalance: (balance: number) => void;
  setTransactions: (transactions: Transaction[], pagination?: PaginationInfo) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  setPendingTransactions: (transactions: Transaction[]) => void;
  setTransactionFilters: (filters: Partial<WalletState["transactionFilters"]>) => void;
  clearTransactionFilters: () => void;
  setBankAccounts: (accounts: BankAccount[]) => void;
  addBankAccount: (account: BankAccount) => void;
  updateBankAccount: (accountId: string, updates: Partial<BankAccount>) => void;
  removeBankAccount: (accountId: string) => void;
  setDefaultBankAccount: (accountId: string) => void;
  setUserWallet: (userId: string, wallet: UserWallet) => void;
  getUserWallet: (userId: string) => Promise<UserWallet | null>;
  setLoading: (loading: boolean) => void;
  setLoadingTransactions: (loading: boolean) => void;
  setLoadingSummary: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setLoadingUserWallet: (loading: boolean) => void;
  setError: (error: string | null) => void;
  sendPayment: (request: PaymentRequest) => Promise<boolean>;
  depositMoney: (amount: number, phone: string) => Promise<boolean>;
  withdrawMoney: (amount: number, account: string) => Promise<boolean>;
  requestPayment: (request: PaymentRequest) => Promise<boolean>;
  setLastPaymentResult: (result: WalletState["lastPaymentResult"]) => void;
  clearLastPaymentResult: () => void;
  refreshWallet: () => Promise<void>;
  refreshTransactions: (page?: number, additionalFilters?: Partial<TransactionFilterParams>) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByType: (type: Transaction["type"]) => Transaction[];
  getTransactionsByStatus: (status: Transaction["status"]) => Transaction[];
  calculateTotalSent: (timeframe?: "day" | "week" | "month") => number;
  calculateTotalReceived: (timeframe?: "day" | "week" | "month") => number;
  reset: () => void;
}

export type WalletStore = WalletState & WalletActions;

const API_BASE_URL = process.env.NEXT_PUBLIC_WALLET_API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface TransactionFilterParams {
  userWalletId: string;
  minDebit?: number;
  maxDebit?: number;
  minCredit?: number;
  maxCredit?: number;
  status?: Transaction["status"];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const walletAPI = {
  fetchWalletSummary: async (): Promise<WalletSummary> => {
    try {
      console.log('🏦 Fetching wallet summary...');
      const response = await fetch(`${API_BASE_URL}/wallets/me`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Wallet summary response:', data);

      if (data && data.id) {
        const walletData = data;
        const totalBalance =
          parseFloat(walletData.availableBalance || "0") +
          parseFloat(walletData.lockedBalance || "0");

        return {
          id: walletData.id,
          balance: totalBalance,
          currency:
            walletData.currency?.code || walletData.currency?.symbol || "KES",
          status: walletData.status,
          tier: "Tier 1",
          lastUpdated: new Date().toISOString(),
          limits: {
            dailyLimit: 100000,
            withdrawalEnabled: walletData.status === "Active",
            maxPerTransaction: 50000,
          },
          pendingBalance: parseFloat(walletData.lockedBalance || "0"),
          availableBalance: parseFloat(walletData.availableBalance || "0"),
          lockedBalance: parseFloat(walletData.lockedBalance || "0"),
          debit: parseFloat(walletData.debit || "0"),
          credit: parseFloat(walletData.credit || "0"),
          userUuid: walletData.user_uuid,
          groupUuid: walletData.group_uuid,
          type: walletData.type,
          currencyDetails: walletData.currency,
          createdAt: walletData.createdAt,
          updatedAt: walletData.updatedAt,
        };
      } else {
        throw new Error("No wallet found for this user");
      }
    } catch (error) {
      console.error("❌ Fetch wallet summary error:", error);
      throw error;
    }
  },

  fetchUserWallet: async (userId: string): Promise<UserWallet> => {
    try {
      console.log(`🔍 Fetching wallet for user: ${userId}`);
      const response = await fetch(`${API_BASE_URL}/wallets/user/${userId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      console.log('📡 User wallet API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ User wallet API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ User wallet API Success:', data);

      if (!data.status || !data.wallet) {
        throw new Error(data.message || "Invalid wallet response");
      }

      const walletData = data.wallet;

      return {
        id: walletData.id,
        userId: walletData.user_uuid || userId,
        balance: parseFloat(walletData.availableBalance || "0") + parseFloat(walletData.lockedBalance || "0"),
        currency: walletData.currency?.code || walletData.currency?.symbol || "KES",
        status: walletData.status,
        type: walletData.type,
        availableBalance: walletData.availableBalance || "0",
        lockedBalance: walletData.lockedBalance || "0",
        debit: walletData.debit || "0",
        credit: walletData.credit || "0",
        userUuid: walletData.user_uuid,
        groupUuid: walletData.group_uuid,
        currencyDetails: walletData.currency,
        createdAt: walletData.createdAt,
        updatedAt: walletData.updatedAt,
      };
    } catch (error) {
      console.error(`❌ Fetch user wallet error for ${userId}:`, error);
      throw error;
    }
  },

  fetchTransactions: async (
    walletId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ transactions: Transaction[]; pagination: PaginationInfo }> => {
    try {
      console.log('📊 Fetching transactions...');
      const response = await fetch(
        `${API_BASE_URL}/transactions/me`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      console.log('📡 Transactions API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Transactions API Success:', data);

      let transactions: ApiTransactionResponse[] = [];
      let pagination: PaginationInfo | null = null;

      if (data && Array.isArray(data)) {
        transactions = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        transactions = data.data;
        pagination = data.pagination || data.meta;
      } else if (
        data &&
        data.transactions &&
        Array.isArray(data.transactions)
      ) {
        transactions = data.transactions;
        pagination = data.pagination || data.meta;
      }

      const mappedTransactions: Transaction[] = transactions.map(
        (transaction: ApiTransactionResponse): Transaction => {
          let type: Transaction["type"];
          let amount: number;

          if (transaction.debit && parseFloat(transaction.debit) > 0) {
            type =
              transaction.type?.toUpperCase() === "TRANSFER"
                ? "SEND"
                : "WITHDRAWAL";
            amount = parseFloat(transaction.debit);
          } else if (transaction.credit && parseFloat(transaction.credit) > 0) {
            type =
              transaction.type?.toUpperCase() === "TRANSFER"
                ? "RECEIVE"
                : "DEPOSIT";
            amount = parseFloat(transaction.credit);
          } else if (transaction.amount) {
            amount = Math.abs(parseFloat(transaction.amount.toString()));
            type = transaction.type?.toUpperCase() as Transaction["type"] || "PAYMENT";
          } else {
            type = "PAYMENT";
            amount = 0;
          }

          return {
            id:
              transaction.id ||
              transaction.uuid ||
              `txn_${Date.now()}_${Math.random()}`,
            type,
            amount,
            currency:
              (typeof transaction.currency === 'object'
                ? transaction.currency?.code || transaction.currency?.symbol
                : transaction.currency) || "KES",
            status: (
              transaction.status || "COMPLETED"
            ).toUpperCase() as Transaction["status"],
            description:
              transaction.description ||
              transaction.narration ||
              transaction.memo ||
              `${type} Transaction`,
            reference:
              transaction.reference ||
              transaction.transactionRef ||
              transaction.referenceNumber ||
              "",
            recipientId: transaction.recipientId || transaction.beneficiaryId,
            recipientName:
              transaction.recipientName || transaction.beneficiaryName,
            senderId: transaction.senderId || transaction.initiatorId,
            senderName: transaction.senderName || transaction.initiatorName,
            timestamp:
              transaction.createdAt ||
              transaction.transactionDate ||
              transaction.timestamp ||
              new Date().toISOString(),
            createdAt:
              transaction.createdAt ||
              transaction.transactionDate ||
              new Date().toISOString(),
            updatedAt: transaction.updatedAt,
            metadata: {
              balance: transaction.balance,
              runningBalance: transaction.runningBalance,
              paymentMethod: transaction.paymentMethod,
              paymentChannel: transaction.paymentChannel,
              counterparty: transaction.counterparty,
              fee: transaction.fee || transaction.transactionFee || 0,
              originalAmount: transaction.originalAmount,
              exchangeRate: transaction.exchangeRate,
              transactionCode: transaction.transactionCode,
              merchantId: transaction.merchantId,
              merchantName: transaction.merchantName,
              debit: transaction.debit,
              credit: transaction.credit,
            },
          };
        }
      );

      return {
        transactions: mappedTransactions,
        pagination: pagination || {
          page: page,
          limit: limit,
          total: mappedTransactions.length,
          totalPages: Math.ceil(mappedTransactions.length / limit),
        },
      };
    } catch (error) {
      console.error("❌ Fetch transactions error:", error);
      throw error;
    }
  },

  sendPayment: async (
    request: PaymentRequest,
    senderWalletId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    try {
      console.log('💸 Sending payment request:', request);
      let receiverWalletId = request.recipientWalletId;

      if (!receiverWalletId) {
        console.log('🔍 Looking up recipient wallet...');
        const recipientWallet = await walletAPI.fetchUserWallet(request.recipientId);
        receiverWalletId = recipientWallet.id;
        console.log('✅ Found recipient wallet:', receiverWalletId);
      }

      const transferPayload = {
        senderWalletId: senderWalletId,
        receiverWalletId: receiverWalletId,
        amount: request.amount,
      };

      console.log('🚀 Transfer payload:', transferPayload);
      const response = await fetch(`${API_BASE_URL}/wallets/transfer`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(transferPayload),
      });

      console.log('📡 Transfer API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Transfer API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Transfer API Success:', data);

      return {
        success: true,
        transactionId: data.id || data.transactionId || `txn_${Date.now()}`,
      };
    } catch (error) {
      console.error("❌ Send payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  },

  depositToWallet: async (
    amount: number,
    paymentMethodUuid: string = "2",
    phone: string,
    walletId: string
  ) => {
    try {
      console.log('💰 Deposit request:', { amount, paymentMethodUuid, phone, walletId });
      const response = await fetch(`${API_BASE_URL}/wallets/topup`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userWalletId: walletId,
          amount: amount,
          paymentMethodUuid: paymentMethodUuid,
          transferType: "MOBILE",
          phone: phone,
        }),
      });

      console.log('📡 Deposit API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Deposit API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Deposit API Success:', data);
      return data;
    } catch (error) {
      console.error("❌ Deposit error:", error);
      throw error;
    }
  },

  withdrawFromWallet: async (
    amount: number,
    account: string,
    walletId: string,
    bankUuid: string = "789e1234-e89b-12d3-a456-426614174222",
    paymentMethodUuid: string = "2"
  ) => {
    try {
      console.log('💸 Withdrawal request:', { amount, account, walletId, bankUuid });
      const response = await fetch(`${API_BASE_URL}/wallets/withdraw`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userWalletId: walletId,
          amount: amount,
          paymentMethodUuid: paymentMethodUuid,
          transferType: "MOBILE",
          account: account,
          bankUuid: bankUuid,
          userBankUuid: bankUuid,
        }),
      });

      console.log('📡 Withdrawal API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Withdrawal API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Withdrawal API Success:', data);
      return data;
    } catch (error) {
      console.error("❌ Withdrawal error:", error);
      throw error;
    }
  },
};

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      immer<WalletStore>((set, get) => ({
        walletId: null,
        summary: null,
        transactions: [],
        pendingTransactions: [],
        transactionsPagination: null,
        transactionFilters: {},
        bankAccounts: [],
        userWallets: new Map(),
        isLoading: false,
        isLoadingTransactions: false,
        isLoadingSummary: false,
        isSending: false,
        isLoadingUserWallet: false,
        error: null,
        lastPaymentResult: null,

        setWalletSummary: (summary) =>
          set((state) => {
            state.summary = summary;
            state.walletId = summary.id;
          }),

        updateBalance: (balance) =>
          set((state) => {
            if (state.summary) {
              state.summary.balance = balance;
              state.summary.lastUpdated = new Date().toISOString();
            }
          }),

        setTransactions: (transactions, pagination) =>
          set((state) => {
            state.transactions = transactions.sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            );
            if (pagination) {
              state.transactionsPagination = pagination;
            }
          }),

        addTransaction: (transaction) =>
          set((state) => {
            const existingIndex = state.transactions.findIndex(
              (t) => t.id === transaction.id
            );
            if (existingIndex >= 0) {
              state.transactions[existingIndex] = transaction;
            } else {
              state.transactions.unshift(transaction);
            }

            if (transaction.status === "COMPLETED" && state.summary) {
              if (
                transaction.type === "RECEIVE" ||
                transaction.type === "TOPUP"
              ) {
                state.summary.balance += transaction.amount;
              } else if (
                transaction.type === "SEND" ||
                transaction.type === "WITHDRAWAL" ||
                transaction.type === "PAYMENT"
              ) {
                state.summary.balance -= transaction.amount;
              }
              state.summary.lastUpdated = new Date().toISOString();
            }
          }),

        updateTransaction: (transactionId, updates) =>
          set((state) => {
            const transactionIndex = state.transactions.findIndex(
              (t) => t.id === transactionId
            );
            if (transactionIndex >= 0) {
              Object.assign(state.transactions[transactionIndex], updates);

              if (updates.status === "COMPLETED" && state.summary) {
                const transaction = state.transactions[transactionIndex];
                if (
                  transaction.type === "RECEIVE" ||
                  transaction.type === "TOPUP"
                ) {
                  state.summary.balance += transaction.amount;
                } else if (
                  transaction.type === "SEND" ||
                  transaction.type === "WITHDRAWAL" ||
                  transaction.type === "PAYMENT"
                ) {
                  state.summary.balance -= transaction.amount;
                }
                state.summary.lastUpdated = new Date().toISOString();
              }
            }
          }),

        setPendingTransactions: (transactions) =>
          set((state) => {
            state.pendingTransactions = transactions;
          }),

        setTransactionFilters: (filters) =>
          set((state) => {
            state.transactionFilters = {
              ...state.transactionFilters,
              ...filters,
            };
          }),

        clearTransactionFilters: () =>
          set((state) => {
            state.transactionFilters = {};
          }),

        setBankAccounts: (accounts) =>
          set((state) => {
            state.bankAccounts = accounts;
          }),

        addBankAccount: (account) =>
          set((state) => {
            const existingIndex = state.bankAccounts.findIndex(
              (a) => a.id === account.id
            );
            if (existingIndex >= 0) {
              state.bankAccounts[existingIndex] = account;
            } else {
              state.bankAccounts.push(account);
            }
          }),

        updateBankAccount: (accountId, updates) =>
          set((state) => {
            const accountIndex = state.bankAccounts.findIndex(
              (a) => a.id === accountId
            );
            if (accountIndex >= 0) {
              Object.assign(state.bankAccounts[accountIndex], updates);
            }
          }),

        removeBankAccount: (accountId) =>
          set((state) => {
            state.bankAccounts = state.bankAccounts.filter(
              (a) => a.id !== accountId
            );
          }),

        setDefaultBankAccount: (accountId) =>
          set((state) => {
            state.bankAccounts.forEach((account) => {
              account.isDefault = account.id === accountId;
            });
          }),

        setUserWallet: (userId, wallet) =>
          set((state) => {
            state.userWallets.set(userId, wallet);
          }),

        getUserWallet: async (userId: string) => {
          const { setLoadingUserWallet, setUserWallet, userWallets } = get();

          const cachedWallet = userWallets.get(userId);
          if (cachedWallet) {
            console.log('💾 Using cached wallet for user:', userId);
            return cachedWallet;
          }

          try {
            setLoadingUserWallet(true);
            const wallet = await walletAPI.fetchUserWallet(userId);
            setUserWallet(userId, wallet);
            return wallet;
          } catch (error) {
            console.error(`❌ Failed to get wallet for user ${userId}:`, error);
            return null;
          } finally {
            setLoadingUserWallet(false);
          }
        },

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setLoadingTransactions: (loading) =>
          set((state) => {
            state.isLoadingTransactions = loading;
          }),

        setLoadingSummary: (loading) =>
          set((state) => {
            state.isLoadingSummary = loading;
          }),

        setSending: (sending) =>
          set((state) => {
            state.isSending = sending;
          }),

        setLoadingUserWallet: (loading) =>
          set((state) => {
            state.isLoadingUserWallet = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        sendPayment: async (request) => {
          const { setSending, addTransaction, setLastPaymentResult, setError, summary } = get();

          try {
            setSending(true);
            setError(null);

            const senderWalletId = summary?.id;
            if (!senderWalletId) {
              throw new Error("Sender wallet ID not found");
            }

            console.log('🚀 Initiating payment:', {
              recipientId: request.recipientId,
              amount: request.amount,
              senderWalletId: senderWalletId
            });

            const result = await walletAPI.sendPayment(request, senderWalletId);

            if (result.success && result.transactionId) {
              const transaction: Transaction = {
                id: result.transactionId,
                type: "SEND",
                amount: request.amount,
                currency: request.currency,
                status: "COMPLETED",
                description: request.description || "Payment sent",
                reference: request.reference,
                recipientId: request.recipientId,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              };

              addTransaction(transaction);
              setLastPaymentResult({
                success: true,
                transactionId: result.transactionId,
              });
              return true;
            } else {
              setLastPaymentResult({ success: false, error: result.error });
              setError(result.error || "Payment failed");
              return false;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Payment failed";
            setLastPaymentResult({ success: false, error: errorMessage });
            setError(errorMessage);
            return false;
          } finally {
            setSending(false);
          }
        },

        depositMoney: async (amount: number, phone: string) => {
          const { setLoading, addTransaction, setError, summary, refreshWallet } = get();

          try {
            setLoading(true);
            setError(null);

            const walletId = summary?.id;
            if (!walletId) {
              throw new Error("Wallet ID not found");
            }

            console.log('💰 Initiating deposit:', { amount, phone, walletId });
            const result = await walletAPI.depositToWallet(amount, "2", phone, walletId);

            const transaction: Transaction = {
              id: result.id || `dep_${Date.now()}`,
              type: "DEPOSIT",
              amount: amount,
              currency: summary?.currency || "KES",
              status: "PENDING",
              description: `Deposit via ${phone}`,
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };

            addTransaction(transaction);
            setTimeout(() => {
              refreshWallet();
            }, 2000);

            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Deposit failed";
            setError(errorMessage);
            console.error('❌ Deposit failed:', errorMessage);
            return false;
          } finally {
            setLoading(false);
          }
        },

        withdrawMoney: async (amount: number, account: string) => {
          const { setLoading, addTransaction, setError, summary, refreshWallet } = get();

          try {
            setLoading(true);
            setError(null);

            const walletId = summary?.id;
            if (!walletId) {
              throw new Error("Wallet ID not found");
            }

            console.log('💸 Initiating withdrawal:', { amount, account, walletId });
            const result = await walletAPI.withdrawFromWallet(amount, account, walletId);

            const transaction: Transaction = {
              id: result.id || `wit_${Date.now()}`,
              type: "WITHDRAWAL",
              amount: amount,
              currency: summary?.currency || "KES",
              status: "PENDING",
              description: `Withdrawal to ${account}`,
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };

            addTransaction(transaction);
            setTimeout(() => {
              refreshWallet();
            }, 2000);

            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Withdrawal failed";
            setError(errorMessage);
            console.error('❌ Withdrawal failed:', errorMessage);
            return false;
          } finally {
            setLoading(false);
          }
        },

        requestPayment: async (request) => {
          console.log("Payment request:", request);
          return true;
        },

        setLastPaymentResult: (result) =>
          set((state) => {
            state.lastPaymentResult = result;
          }),

        clearLastPaymentResult: () =>
          set((state) => {
            state.lastPaymentResult = null;
          }),

        refreshWallet: async () => {
          const { setLoadingSummary, setWalletSummary, setError } = get();

          try {
            setLoadingSummary(true);
            setError(null);

            const summary = await walletAPI.fetchWalletSummary();
            setWalletSummary(summary);
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to fetch wallet summary";
            setError(errorMessage);
          } finally {
            setLoadingSummary(false);
          }
        },

        refreshTransactions: async (page = 1, additionalFilters = {}) => {
          const {
            setLoadingTransactions,
            setTransactions,
            setError,
            walletId,
            transactionFilters,
          } = get();

          if (!walletId) {
            setError("Wallet ID not found");
            return;
          }

          try {
            setLoadingTransactions(true);
            setError(null);

            const filterParams: TransactionFilterParams = {
              userWalletId: walletId,
              page,
              limit: 50,
              ...transactionFilters,
              ...additionalFilters,
            };

            if (transactionFilters.type === "debit") {
              filterParams.minDebit = transactionFilters.minAmount || 0.01;
              filterParams.maxDebit = transactionFilters.maxAmount;
            } else if (transactionFilters.type === "credit") {
              filterParams.minCredit = transactionFilters.minAmount || 0.01;
              filterParams.maxCredit = transactionFilters.maxAmount;
            } else {
              if (transactionFilters.minAmount) {
                filterParams.minDebit = transactionFilters.minAmount;
                filterParams.minCredit = transactionFilters.minAmount;
              }
              if (transactionFilters.maxAmount) {
                filterParams.maxDebit = transactionFilters.maxAmount;
                filterParams.maxCredit = transactionFilters.maxAmount;
              }
            }

            const result = await walletAPI.fetchTransactions(walletId, page, 50);
            setTransactions(result.transactions, result.pagination);
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to fetch transactions";
            setError(errorMessage);
          } finally {
            setLoadingTransactions(false);
          }
        },

        loadMoreTransactions: async () => {
          const { transactionsPagination, refreshTransactions } = get();

          if (!transactionsPagination) return;

          const nextPage = transactionsPagination.page + 1;
          if (nextPage <= transactionsPagination.totalPages) {
            await refreshTransactions(nextPage);
          }
        },

        getTransactionById: (id) => {
          const state = get();
          return state.transactions.find((t) => t.id === id);
        },

        getTransactionsByType: (type) => {
          const state = get();
          return state.transactions.filter((t) => t.type === type);
        },

        getTransactionsByStatus: (status) => {
          const state = get();
          return state.transactions.filter((t) => t.status === status);
        },

        calculateTotalSent: (timeframe) => {
          const state = get();
          let startDate: Date;
          const now = new Date();

          switch (timeframe) {
            case "day":
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case "week":
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "month":
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              return state.transactions
                .filter(
                  (t) =>
                    (t.type === "SEND" || t.type === "PAYMENT") &&
                    t.status === "COMPLETED"
                )
                .reduce((total, t) => total + t.amount, 0);
          }

          return state.transactions
            .filter((t) => {
              const transactionDate = new Date(t.timestamp);
              return (
                (t.type === "SEND" || t.type === "PAYMENT") &&
                t.status === "COMPLETED" &&
                transactionDate >= startDate
              );
            })
            .reduce((total, t) => total + t.amount, 0);
        },

        calculateTotalReceived: (timeframe) => {
          const state = get();
          let startDate: Date;
          const now = new Date();

          switch (timeframe) {
            case "day":
              startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case "week":
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case "month":
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              return state.transactions
                .filter(
                  (t) =>
                    (t.type === "RECEIVE" || t.type === "DEPOSIT") &&
                    t.status === "COMPLETED"
                )
                .reduce((total, t) => total + t.amount, 0);
          }

          return state.transactions
            .filter((t) => {
              const transactionDate = new Date(t.timestamp);
              return (
                (t.type === "RECEIVE" || t.type === "DEPOSIT") &&
                t.status === "COMPLETED" &&
                transactionDate >= startDate
              );
            })
            .reduce((total, t) => total + t.amount, 0);
        },

        reset: () =>
          set((state) => {
            state.walletId = null;
            state.summary = null;
            state.transactions = [];
            state.pendingTransactions = [];
            state.transactionsPagination = null;
            state.transactionFilters = {};
            state.bankAccounts = [];
            state.userWallets = new Map();
            state.isLoading = false;
            state.isLoadingTransactions = false;
            state.isLoadingSummary = false;
            state.isSending = false;
            state.isLoadingUserWallet = false;
            state.error = null;
            state.lastPaymentResult = null;
          }),
      })),
      {
        name: "wallet-store",
        partialize: (state) => ({
          walletId: state.walletId,
          summary: state.summary,
          transactions: state.transactions,
          transactionsPagination: state.transactionsPagination,
          transactionFilters: state.transactionFilters,
          bankAccounts: state.bankAccounts,
        }),
      }
    ),
    { name: "wallet-store" }
  )
);