export interface WalletTransactionItem {
  id: number;
  walletId: number;
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
