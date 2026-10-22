export interface WalletItem {
  id: number;
  userId: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  updatedAt?: string;
}

export interface BankAccountItem {
  id: number;
  userId: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  verified?: boolean;
  createdAt?: string;
}

export interface CreateBankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  userId?: number;
}

export interface CreateWithdrawalRequest {
  bankAccountId?: number;
  amount: number;
}

export interface CreateDepositRequest {
  amount: number;
  description?: string;
}

export interface PaymentUrlResponse {
  paymentUrl: string;
  merchantTxnRef: string;
}
