import React, { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  type: 'deposit' | 'withdraw' | 'send';
}

export interface TransactionFormData {
  amount: number;
  paymentMethod: string;
  phoneNumber: string;
  description?: string;
  bankUuid?: string;
  account?: string;
  recipientId?: string;
  recipientName?: string;
  transactionType: 'deposit' | 'withdraw' | 'send';
}

const paymentMethods = ['Mpesa', 'Airtel Money'];
const banks = [
  { name: 'Equity Bank', uuid: '456e7890-e89b-12d3-a456-426614174111' },
  { name: 'KCB Bank', uuid: '456e7890-e89b-12d3-a456-426614174112' },
  { name: 'Co-operative Bank', uuid: '456e7890-e89b-12d3-a456-426614174113' }
];

const transactionTypes = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'send', label: 'Send Money' }
];

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type
}) => {
  const { isSending, summary } = useWalletStore();

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: 0,
    paymentMethod: paymentMethods[0],
    phoneNumber: '',
    description: '',
    bankUuid: banks[0].uuid,
    account: '',
    recipientId: '',
    recipientName: '',
    transactionType: type
  });

  const [errors, setErrors] = useState({
    amount: '',
    phoneNumber: '',
    account: '',
    recipientId: ''
  });

  // Reset form when modal opens or type changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: 0,
        paymentMethod: paymentMethods[0],
        phoneNumber: '',
        description: '',
        bankUuid: banks[0].uuid,
        account: '',
        recipientId: '',
        recipientName: '',
        transactionType: type
      });
      setErrors({
        amount: '',
        phoneNumber: '',
        account: '',
        recipientId: ''
      });
    }
  }, [isOpen, type]);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      amount: '',
      phoneNumber: '',
      account: '',
      recipientId: ''
    };

    // Amount validation
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
      isValid = false;
    }

    // Check if amount exceeds balance for send/withdraw
    if ((formData.transactionType === 'send' || formData.transactionType === 'withdraw') && summary && formData.amount > summary.balance) {
      newErrors.amount = 'Amount exceeds available balance';
      isValid = false;
    }

    // Phone number validation
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Enter a valid phone number (10 digits starting with 0)';
      isValid = false;
    }

    // Account validation for withdrawal
    if (formData.transactionType === 'withdraw' && !formData.account) {
      newErrors.account = 'Account number is required for withdrawals';
      isValid = false;
    }

    // Recipient validation for send
    if (formData.transactionType === 'send' && !formData.recipientId) {
      newErrors.recipientId = 'Recipient ID is required for sending money';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getModalTitle = () => {
    switch (formData.transactionType) {
      case 'deposit':
        return 'Top Up Wallet';
      case 'withdraw':
        return 'Withdraw Funds';
      case 'send':
        return 'Send Money';
      default:
        return 'Transaction';
    }
  };

  const getSubmitButtonText = () => {
    if (isSending) {
      switch (formData.transactionType) {
        case 'deposit':
          return 'Processing Deposit...';
        case 'withdraw':
          return 'Processing Withdrawal...';
        case 'send':
          return 'Sending Money...';
        default:
          return 'Processing...';
      }
    }
    
    switch (formData.transactionType) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdraw';
      case 'send':
        return 'Send Money';
      default:
        return 'Submit';
    }
  };

  const getSubmitButtonColor = () => {
    switch (formData.transactionType) {
      case 'deposit':
        return 'bg-green-600 hover:bg-green-700';
      case 'withdraw':
        return 'bg-red-600 hover:bg-red-700';
      case 'send':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--background)]/50 text-[var(--foreground)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{getModalTitle()}</h2>
          <button 
            onClick={onClose}
            disabled={isSending}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Balance Display */}
        {summary && (formData.transactionType === 'send' || formData.transactionType === 'withdraw') && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Available Balance</div>
            <div className="text-lg font-bold text-gray-900">
              {summary.currency} {summary.balance.toLocaleString()}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Dropdown */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transactionType">
              Transaction Type
            </label>
            <select
              id="transactionType"
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              disabled={isSending}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              {transactionTypes.map((transactionType) => (
                <option key={transactionType.value} value={transactionType.value}>
                  {transactionType.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
              Amount ({summary?.currency || 'KSH'})
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              disabled={isSending}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              min="0"
              step="0.01"
              placeholder="Enter amount"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              disabled={isSending}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isSending}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="0712345678"
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            <p className="text-xs text-gray-500 mt-1">
              This will be formatted to include the country code (254) when submitted.
            </p>
          </div>

          {/* Recipient ID for Send Money */}
          {formData.transactionType === 'send' && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientId">
                  Recipient ID
                </label>
                <input
                  type="text"
                  id="recipientId"
                  name="recipientId"
                  value={formData.recipientId}
                  onChange={handleChange}
                  disabled={isSending}
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter recipient's wallet ID or phone number"
                />
                {errors.recipientId && <p className="text-red-500 text-xs mt-1">{errors.recipientId}</p>}
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipientName">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  disabled={isSending}
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter recipient's name"
                />
              </div>
            </>
          )}

          {/* Bank Selection and Account for Withdrawal */}
          {formData.transactionType === 'withdraw' && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bankUuid">
                  Select Bank
                </label>
                <select
                  id="bankUuid"
                  name="bankUuid"
                  value={formData.bankUuid}
                  onChange={handleChange}
                  disabled={isSending}
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  {banks.map((bank) => (
                    <option key={bank.uuid} value={bank.uuid}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="account">
                  Account Number
                </label>
                <input
                  type="text"
                  id="account"
                  name="account"
                  value={formData.account}
                  onChange={handleChange}
                  disabled={isSending}
                  className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter bank account number"
                />
                {errors.account && <p className="text-red-500 text-xs mt-1">{errors.account}</p>}
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isSending}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
              rows={2}
              placeholder="Purpose of transaction"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || formData.amount <= 0}
              className={`px-6 py-3 text-white text-sm font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${getSubmitButtonColor()}`}
            >
              {isSending && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{getSubmitButtonText()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;