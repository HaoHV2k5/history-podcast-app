export interface WithdrawalItem {
  id: number;
  walletId: number;
  bankAccountId?: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | string;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
}

export interface RejectWithdrawalPayload {
  reason?: string;
}
