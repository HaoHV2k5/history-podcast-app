export interface EscrowTransactionItem {
  id: number;
  contractId: number;
  amount: number;
  commissionAmount: number;
  status: string;
  lockedAt?: string;
  releasedAt?: string;
}

export interface AdminMilestoneRevenueItem {
  milestoneId: number;
  milestoneOrderNo?: number;
  milestoneTitle?: string;
  contractId: number;
  contractTitle?: string;
  serviceType?: string;
  creatorId?: number;
  creatorName?: string;
  creatorEmail?: string;
  freelancerId?: number;
  freelancerName?: string;
  freelancerEmail?: string;
  grossAmount: number;
  feePercent?: number;
  platformFee?: number;
  netAmount?: number;
  status: string; // EscrowStatus: UNFUNDED, HELD, RELEASED, REFUNDED, FROZEN
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
}
