export type MilestoneWorkStatus =
  | 'WAITING'
  | 'UNFUNDED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RELEASED'
  | 'CANCELLED';

export type MilestoneEscrowStatus =
  | 'UNFUNDED'
  | 'HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FROZEN';

export interface MilestoneItem {
  id: number;
  contractId: number;
  orderNo: number;
  title: string;
  requirement?: string;
  amount: number;
  feePercent?: number;
  platformFee?: number;
  netAmount?: number;
  durationDays?: number;
  maxRevisions?: number;
  revisionsUsed?: number;
  revisionDays?: number;
  status: MilestoneWorkStatus | string;
  escrowStatus: MilestoneEscrowStatus | string;
  fundDueAt?: string;
  dueAt?: string;
  reviewDueAt?: string;
  releaseAt?: string;
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractItem {
  id: number;
  postId?: number;
  postTitle?: string;
  hireRequestId?: number;
  creatorId?: number;
  creatorFullName?: string;
  freelancerId?: number;
  freelancerFullName?: string;
  serviceType?: string;
  title?: string;
  description?: string;
  termsText?: string;
  totalAmount?: number;
  platformFeePercent?: number;
  platformFee?: number;
  netAmount?: number;
  price?: number;
  deadline?: string;
  status: string;
  creatorSignedAt?: string;
  narratorSignedAt?: string;
  acceptedAt?: string;
  acceptDueAt?: string;
  milestones?: MilestoneItem[];
  createdAt: string;
  updatedAt?: string;
}
