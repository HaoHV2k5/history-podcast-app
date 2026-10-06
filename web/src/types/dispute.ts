export interface DisputeItem {
  id: number;
  contractId: number;
  raisedByUserId: number;
  reason: string;
  status: string;
  resolvedByUserId?: number;
  resolution?: string;
  resolvedAt?: string;
}
