export interface DisputeItem {
  id: number;
  contractId: number;
  contractTitle?: string;
  milestoneId?: number;
  milestoneTitle?: string;
  raisedByUserId: number;
  raisedByUserFullName?: string;
  reason: string;
  evidence?: string;
  counterEvidence?: string;
  status: string;
  result?: string;
  splitPercent?: number;
  resolvedByUserId?: number;
  resolvedByUserFullName?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
