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
  price?: number;
  deadline?: string;
  status: string;
  creatorSignedAt?: string;
  narratorSignedAt?: string;
  acceptedAt?: string;
  acceptDueAt?: string;
  createdAt: string;
}
