import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { StaffMemberRecord, StaffRepository } from "../../domain/repositories/staff.repository";
import { AppException } from "../../../../common/errors/app.errors";

@Injectable()
export class PrismaStaffRepository implements StaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForBusiness(businessId: string): Promise<StaffMemberRecord[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { businessId },
      include: { user: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    return userRoles.map((ur) => ({
      userRoleId: ur.id,
      userId: ur.userId,
      userFullName: ur.user.fullName,
      userEmail: ur.user.email,
      roleName: ur.role.name,
    }));
  }

  async invite(businessId: string, userId: string, roleName: "BUSINESS_OWNER" | "BUSINESS_STAFF"): Promise<StaffMemberRecord> {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      // Indicates the seed script (Database Design §7) hasn't run — a deployment/ops
      // problem, not a client input error, but still surfaced as a clean 4xx rather than
      // an unhandled 500.
      throw new AppException("VALIDATION_ERROR", `Role ${roleName} is not seeded — run the database seed script`);
    }

    const userRole = await this.prisma.userRole.upsert({
      where: { userId_roleId_businessId: { userId, roleId: role.id, businessId } },
      update: {},
      create: { userId, roleId: role.id, businessId },
      include: { user: true, role: true },
    });

    return {
      userRoleId: userRole.id,
      userId: userRole.userId,
      userFullName: userRole.user.fullName,
      userEmail: userRole.user.email,
      roleName: userRole.role.name,
    };
  }

  async remove(userRoleId: string): Promise<void> {
    await this.prisma.userRole.delete({ where: { id: userRoleId } });
  }

  async listBusinessIdsForUser(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId, businessId: { not: null } },
      select: { businessId: true },
      distinct: ["businessId"],
    });
    return userRoles.map((ur) => ur.businessId!);
  }
}
