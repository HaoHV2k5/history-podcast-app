export interface MembershipPaymentItem {
  id: number;
  membershipId: number;
  amount: number;
  commissionAmount: number;
  creatorEarning: number;
  status: string;
  paidAt?: string;
}
