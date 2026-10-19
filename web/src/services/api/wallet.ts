import { apiClient } from './client';
import { ApiResponse, PageResponse } from '@/types/api';
import {
  WalletItem,
  BankAccountItem,
  CreateBankAccountRequest,
  CreateWithdrawalRequest,
  CreateDepositRequest,
  PaymentUrlResponse,
} from '@/types/wallet';
import { WalletTransactionItem } from '@/types/transaction';
import { WithdrawalItem } from '@/types/withdrawal';

export const walletApi = {
  // Wallet balance & transactions
  getMyWallet: async (): Promise<ApiResponse<WalletItem>> => {
    const response = await apiClient.get<ApiResponse<WalletItem>>(
      '/api/v1/wallets/me'
    );
    return response.data;
  },

  getMyTransactions: async (
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<WalletTransactionItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<WalletTransactionItem>>>(
      '/api/v1/wallets/me/transactions',
      { params: { page, size } }
    );
    return response.data;
  },

  createDeposit: async (
    payload: CreateDepositRequest
  ): Promise<ApiResponse<PaymentUrlResponse>> => {
    const response = await apiClient.post<ApiResponse<PaymentUrlResponse>>(
      '/api/v1/wallets/me/deposits',
      payload
    );
    return response.data;
  },

  // Bank accounts
  getMyBankAccounts: async (): Promise<ApiResponse<BankAccountItem[]>> => {
    const response = await apiClient.get<ApiResponse<BankAccountItem[]>>(
      '/api/v1/bank-accounts'
    );
    return response.data;
  },

  createBankAccount: async (
    payload: CreateBankAccountRequest
  ): Promise<ApiResponse<BankAccountItem>> => {
    const response = await apiClient.post<ApiResponse<BankAccountItem>>(
      '/api/v1/bank-accounts',
      payload
    );
    return response.data;
  },

  deleteBankAccount: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/v1/bank-accounts/${id}`
    );
    return response.data;
  },

  // Withdrawals
  requestWithdrawal: async (
    payload: CreateWithdrawalRequest
  ): Promise<ApiResponse<WithdrawalItem>> => {
    const response = await apiClient.post<ApiResponse<WithdrawalItem>>(
      '/api/v1/withdrawals',
      payload
    );
    return response.data;
  },

  getMyWithdrawals: async (
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<WithdrawalItem>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<WithdrawalItem>>>(
      '/api/v1/withdrawals/me',
      { params: { page, size } }
    );
    return response.data;
  },
};
