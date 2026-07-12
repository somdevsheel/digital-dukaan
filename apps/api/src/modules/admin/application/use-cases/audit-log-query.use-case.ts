import { Inject, Injectable } from "@nestjs/common";
import { AUDIT_LOG_REPOSITORY, type AuditLogRecord, type AuditLogRepository } from "../../domain/repositories/audit-log.repository";

@Injectable()
export class AuditLogQueryUseCase {
  constructor(@Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepository) {}

  listByEntity(entityType: string, entityId: string, cursor?: string): Promise<AuditLogRecord[]> {
    return this.auditLog.listByEntity(entityType, entityId, cursor);
  }

  listByActor(actorUserId: string, cursor?: string): Promise<AuditLogRecord[]> {
    return this.auditLog.listByActor(actorUserId, cursor);
  }
}
