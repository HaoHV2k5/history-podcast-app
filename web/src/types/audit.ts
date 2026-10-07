export interface AuditLogItem {
  id: number;
  actorId: number;
  actionType: string;
  targetType: string;
  targetId: number;
  note?: string;
  createdAt: string;
}
