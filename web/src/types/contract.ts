export type MilestoneWorkStatus =
  | 'WAITING'
  | 'UNFUNDED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RELEASED'
  | 'CANCELLED'
  | 'DISPUTED';

export type MilestoneEscrowStatus =
  | 'UNFUNDED'
  | 'HELD'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FROZEN';

export type CommissionContentType = 'SINGLE_VIDEO' | 'SERIES';

export interface MilestoneDeliverableItem {
  id: number;
  milestoneId: number;
  milestoneOrderNo?: number;
  milestoneTitle?: string;
  contractId?: number;
  contractTitle?: string;
  title?: string;
  description?: string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  versionNo: number;
  uploadedById?: number;
  uploadedByFullName?: string;
  downloadUrl?: string;
  previewUrl?: string;
  createdAt: string;
}

export interface MilestoneReviewItem {
  id: number;
  milestoneId: number;
  reviewerId: number;
  reviewerFullName?: string;
  reviewerAvatarUrl?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface RevisionRequestItem {
  id: number;
  milestoneId: number;
  submissionId?: number;
  note: string;
  createdAt: string;
}

export interface MilestoneItem {
  id: number;
  contractId: number;
  contractTitle?: string;
  serviceType?: string;
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
  releaseAvailableAt?: string;
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  revisionRequests?: RevisionRequestItem[];
  deliverables?: MilestoneDeliverableItem[];
  reviews?: MilestoneReviewItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractItem {
  id: number;
  hireRequestId?: number;
  commissionId?: number;
  channelId?: number;
  channelName?: string;
  conversationId?: string;

  // Creator (Chủ kênh sản xuất & nhận 95%)
  creatorId?: number;
  creatorFullName?: string;
  creatorAvatarUrl?: string;
  creatorEmail?: string;

  // Requester / Customer (Khách hàng đặt làm nội dung & trả tiền)
  requesterId?: number;
  requesterFullName?: string;
  requesterAvatarUrl?: string;
  requesterEmail?: string;

  // Backward compatibility aliases
  freelancerId?: number;
  freelancerFullName?: string;
  freelancerAvatarUrl?: string;
  postId?: number;
  postTitle?: string;

  serviceType?: string;
  contentType?: CommissionContentType;
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

export interface MilestoneItemPayload {
  title: string;
  requirement: string;
  amount: number;
  durationDays: number;
}

export interface CreateContractPayload {
  hireRequestId?: number;
  commissionId?: number;
  requesterId?: number;
  title: string;
  description?: string;
  milestones: MilestoneItemPayload[];
}

export interface UpdateContractPayload {
  title: string;
  description?: string;
  milestones: MilestoneItemPayload[];
}

export interface MyMilestoneFinancialResponse {
  role: 'CREATOR' | 'VIEWER' | string;
  totalEarned?: number;
  pendingEarnings?: number;
  totalPlatformFeePaid?: number;
  totalSpent?: number;
  escrowLocked?: number;
  refundedAmount?: number;
  completedMilestonesCount?: number;
  activeMilestonesCount?: number;
  contractBreakdowns?: {
    contractId: number;
    contractTitle: string;
    otherPartyName: string;
    otherPartyEmail?: string;
    totalAmount: number;
    netAmount: number;
    status: string;
    completedMilestones: number;
    totalMilestones: number;
  }[];
}
