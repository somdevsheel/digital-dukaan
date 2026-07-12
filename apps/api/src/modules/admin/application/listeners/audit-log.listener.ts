import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { AUDIT_LOG_REPOSITORY, type AuditLogRepository } from "../../domain/repositories/audit-log.repository";

/**
 * Every admin/financial-mutation action must be attributable (Architecture §9) — this
 * listener is where that promise is actually kept for the events emitted so far. As more
 * modules add admin-relevant events, they're picked up here rather than each module
 * writing its own AuditLog rows directly (keeps the append-only log's write path singular).
 */
@Injectable()
export class AuditLogListener {
  constructor(@Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepository) {}

  @OnEvent("business.verification_changed")
  async onBusinessVerificationChanged(payload: { businessId: string; status: string; adminUserId: string; reason?: string }): Promise<void> {
    await this.auditLog.record({
      actorUserId: payload.adminUserId,
      actorType: "ADMIN",
      action: "business.verify",
      entityType: "Business",
      entityId: payload.businessId,
      afterJson: { status: payload.status, reason: payload.reason },
    });
  }

  @OnEvent("dispute.resolved")
  async onDisputeResolved(payload: { disputeId: string; status: string; adminUserId: string }): Promise<void> {
    await this.auditLog.record({
      actorUserId: payload.adminUserId,
      actorType: "ADMIN",
      action: "dispute.resolve",
      entityType: "Dispute",
      entityId: payload.disputeId,
      afterJson: { status: payload.status },
    });
  }
}
