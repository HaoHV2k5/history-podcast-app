export interface WalletTransactionItem {
  id: number;
  walletId: number;
  userId?: number;
  userFullName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  type: string; // TOPUP, WITHDRAW, DONATION, MEMBERSHIP, ESCROW_LOCK, etc.
  amount: number;
  relatedType?: string;
  relatedId?: number;
  status: string; // SUCCESS, PENDING, FAILED
  merchantTxnRef?: string;
  gatewayTxnNo?: string;
  gatewayProvider?: string;
  description?: string;
  createdAt: string;
}
