export interface ContractItem {
  id: number;
  hireRequestId: number;
  termsText: string;
  price: number;
  deadline?: string;
  status: string;
  creatorSignedAt?: string;
  narratorSignedAt?: string;
  createdAt: string;
}
