export interface EscrowTransactionItem {
  id: number;
  contractId: number;
  amount: number;
  commissionAmount: number;
  status: string;
  lockedAt?: string;
  releasedAt?: string;
}
