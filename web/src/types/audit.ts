export interface AuditLogItem {
  id: number;
  actorId?: number | null;
  actionType?: string | null;
  targetType?: string | null;
  targetId?: number | null;
  note?: string | null;
  createdAt?: string | null;
  ipAddress?: string | null;
}

export interface RefreshTokenAuditItem {
  id: number;
  userId?: number | null;
  token?: string | null;
  tokenHash?: string | null;
  issuedAt?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  revoked?: boolean | null;
  revokedAt?: string | null;
}

export interface SystemConfigAuditItem {
  id: number;
  key?: string | null;
  value?: string | null;
  updatedByUserId?: number | null;
  updatedAt?: string | null;
}
