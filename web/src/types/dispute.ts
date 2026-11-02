export type DisputeStatus = 'OPEN' | 'RESOLVED';

export type DisputeResult =
  | 'RELEASE_TO_CREATOR'
  | 'REFUND_TO_REQUESTER'
  | 'RELEASE_TO_FREELANCER'
  | 'REFUND_TO_CREATOR'
  | 'SPLIT';

export interface OpenDisputePayload {
  milestoneId: number;
  reason: string;
  evidence?: string;
}

export interface CounterEvidencePayload {
  counterEvidence: string;
}

export interface ResolveDisputePayload {
  result: DisputeResult;
  splitPercent?: number;
  resolution?: string;
}

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
  status: DisputeStatus | string;
  result?: DisputeResult | string;
  splitPercent?: number;
  resolvedByUserId?: number;
  resolvedByUserFullName?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
