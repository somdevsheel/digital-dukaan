import { Inject, Injectable } from "@nestjs/common";
import { STAFF_REPOSITORY, type StaffMemberRecord, type StaffRepository } from "../../domain/repositories/staff.repository";
import { USER_REPOSITORY, type UserRepository } from "../../../identity/domain/repositories/user.repository";
import { BUSINESS_REPOSITORY, type BusinessRecord, type BusinessRepository } from "../../domain/repositories/business.repository";
import { AppException } from "../../../../common/errors/app.errors";
import type { InviteStaffDto } from "../dto/invite-staff.dto";

@Injectable()
export class StaffUseCase {
  constructor(
    @Inject(STAFF_REPOSITORY) private readonly staff: StaffRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
  ) {}

  list(businessId: string): Promise<StaffMemberRecord[]> {
    return this.staff.listForBusiness(businessId);
  }

  async invite(businessId: string, dto: InviteStaffDto): Promise<StaffMemberRecord> {
    // Deliberately requires an existing account (PRD: staff invite is by email, not a
    // separate signup flow) — the invitee registers/OTP-verifies with that email first,
    // same as any other user, before an owner can grant them a business role.
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new AppException(
        "NOT_FOUND",
        "No account found for this email — ask them to create an account first, then invite again",
      );
    }
    return this.staff.invite(businessId, user.id, dto.role);
  }

  remove(userRoleId: string): Promise<void> {
    return this.staff.remove(userRoleId);
  }

  /** The merchant dashboard's entry point after login — "which business(es) do I manage." */
  async listMyBusinesses(userId: string): Promise<BusinessRecord[]> {
    const businessIds = await this.staff.listBusinessIdsForUser(userId);
    const businesses = await Promise.all(businessIds.map((id) => this.businesses.findById(id)));
    return businesses.filter((b): b is BusinessRecord => b !== null);
  }
}
