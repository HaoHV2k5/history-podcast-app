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
  requesterId?: number;
  requesterName?: string;
  requesterEmail?: string;
  grossAmount: number;
  feePercent?: number;
  platformFee?: number;
  netAmount?: number;
  status: string; // EscrowStatus: UNFUNDED, HELD, RELEASED, REFUNDED, FROZEN
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
}

export interface MilestoneRevenueSummaryItem {
  totalRealizedRevenue: number;
  totalEscrowHeld: number;
  totalPendingRevenue?: number;
  totalGrossVolume: number;
  totalRefundedVolume: number;
  totalMilestonesCount: number;
  releasedMilestonesCount: number;
  heldMilestonesCount: number;
  refundedMilestonesCount: number;
  startDate?: string;
  endDate?: string;
}

export interface MilestoneRevenueChartPointItem {
  timeBucket: string;
  realizedRevenue: number;
  voiceRevenue?: number;
  contentRevenue?: number;
  grossVolume: number;
  transactionCount: number;
}

export interface TopRevenueContributorItem {
  userId: number;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  totalAmount: number;
  totalPlatformFeeContributed: number;
  milestonesCount: number;
}
