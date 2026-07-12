import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  BUSINESS_REPOSITORY,
  type BusinessListFilters,
  type BusinessRecord,
  type BusinessRepository,
  type VerificationStatus,
} from "../../domain/repositories/business.repository";
import { BusinessNotFoundException } from "../../domain/errors/business.errors";

/**
 * Admin verification actions on the Business aggregate. Lives here rather than in a
 * separate Admin/Ops module — per Architecture §6, the full Admin/Ops module (disputes,
 * support tickets, audit-log viewer, CMS) is real but distinct; verifying *a business*
 * is fundamentally still a Business-entity state transition, and routing it through a
 * separate module's domain layer would mean either duplicating Business's repository or
 * adding a cross-module dependency for one method. Same call already made for the
 * staff/UserRole pragmatic exception.
 */
@Injectable()
export class AdminBusinessUseCase {
  constructor(
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
    private readonly events: EventEmitter2,
  ) {}

  /** Serves both the Verification Queue (plate 12, `?status=PENDING`) and Business
   *  Management (plate 13, unfiltered or filtered by city/type/status). */
  list(filters: BusinessListFilters, cursor?: string, limit?: number): Promise<BusinessRecord[]> {
    return this.businesses.listAll(filters, cursor, limit);
  }

  count(filters: BusinessListFilters): Promise<number> {
    return this.businesses.count(filters);
  }

  async setVerificationStatus(
    businessId: string,
    status: Extract<VerificationStatus, "VERIFIED" | "REJECTED">,
    adminUserId: string,
    reason?: string,
  ): Promise<BusinessRecord> {
    const business = await this.businesses.findById(businessId);
    if (!business) throw new BusinessNotFoundException();

    const updated = await this.businesses.setVerificationStatus(businessId, status);
    // AuditLog write happens via this event, in audit-log.listener.ts — every verification
    // decision must be attributable (Architecture §9); `reason` travels in the event payload
    // even though Business itself has no rejection-reason column: AuditLog.afterJson is
    // exactly where free-form context like this belongs.
    this.events.emit("business.verification_changed", { businessId, status, adminUserId, reason });
    return updated;
  }

  /** Suspend/reactivate a currently-verified business — a separate lever from the
   *  approve/reject verification decision (plate 13's bulk-suspend action), but the same
   *  underlying state transition and audit trail. */
  async setSuspension(businessId: string, suspend: boolean, adminUserId: string): Promise<BusinessRecord> {
    const business = await this.businesses.findById(businessId);
    if (!business) throw new BusinessNotFoundException();

    const targetStatus = suspend ? "SUSPENDED" : "VERIFIED";
    const updated = await this.businesses.setVerificationStatus(businessId, targetStatus);
    this.events.emit("business.verification_changed", { businessId, status: targetStatus, adminUserId });
    return updated;
  }
}
