export type AuditActorType = "ADMIN" | "MERCHANT" | "SYSTEM";

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  actorUserId: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: Record<string, unknown> | undefined;
  afterJson?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
}

/** Port — append-only, no update/delete methods exist because none should (Database Design §1). */
export interface AuditLogRepository {
  record(input: CreateAuditLogInput): Promise<AuditLogRecord>;
  listByEntity(entityType: string, entityId: string, cursor?: string, limit?: number): Promise<AuditLogRecord[]>;
  listByActor(actorUserId: string, cursor?: string, limit?: number): Promise<AuditLogRecord[]>;
}

export const AUDIT_LOG_REPOSITORY = Symbol("AUDIT_LOG_REPOSITORY");
