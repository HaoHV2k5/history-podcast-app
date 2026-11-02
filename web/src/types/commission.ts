export type CommissionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONTRACT_SENT'
  | 'COMPLETED'
  | 'CANCELLED';

export type CommissionContentType = 'SINGLE_VIDEO' | 'SERIES';

export interface CommissionItem {
  id: number;
  // Requester (Khách hàng)
  requesterId?: number;
  requesterFullName?: string;
  requesterEmail?: string;
  requesterAvatarUrl?: string;
  narratorId?: number; // legacy alias

  // Creator & Channel (Kênh nhận đơn)
  creatorId?: number;
  creatorFullName?: string;
  creatorEmail?: string;
  creatorAvatarUrl?: string;
  channelId?: number;
  channelName?: string;
  channelAvatarUrl?: string;

  // Chi tiết yêu cầu
  contentType: CommissionContentType;
  title: string;
  description: string;
  status: CommissionStatus;
  rejectionReason?: string;

  // Hợp đồng & Chat
  contractId?: number;
  contractStatus?: string;
  conversationId?: string;
  chatUnlocked?: boolean;

  createdAt: string;
  updatedAt?: string;
}

export interface CreateCommissionPayload {
  channelId?: number;
  creatorId?: number;
  contentType: CommissionContentType;
  title: string;
  description: string;
}

export interface RejectCommissionPayload {
  rejectionReason: string;
}
