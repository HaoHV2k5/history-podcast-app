export interface WithdrawalItem {
  id: number;
  walletId: number;
  bankAccountId?: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  creatorAvatar?: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED' | string;
  requestedAt: string;
  slaDueAt?: string;
  slaPolicyNote?: string;
  processedAt?: string;
  failureReason?: string;
}

export interface RejectWithdrawalPayload {
  reason?: string;
}
