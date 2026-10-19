export interface MembershipPaymentItem {
  id: number;
  membershipId: number;
  amount: number;
  commissionAmount: number;
  creatorEarning: number;
  status: string;
  paidAt?: string;
}

export interface MembershipPlanItem {
  id: number;
  channelId: number;
  channelName?: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  perks?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MembershipPlanRequest {
  name: string;
  description?: string;
  monthlyPrice: number;
  perks?: string[];
  status?: string;
}

