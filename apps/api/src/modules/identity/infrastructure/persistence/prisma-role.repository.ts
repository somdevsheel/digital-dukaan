import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { RoleRepository } from "../../domain/repositories/role.repository";
import type { PermissionGrant } from "../../../../common/types/authenticated-user";

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveGrantsForUser(userId: string): Promise<PermissionGrant[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    // A platform-scoped role (businessId null on the UserRole row) grants every one of
    // its permissions everywhere (businessId: null in the grant); a business-scoped role
    // only grants them for that specific business.
    const grants: PermissionGrant[] = [];
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        grants.push({
          permission: rolePermission.permission.key,
          businessId: userRole.businessId,
        });
      }
    }
    return grants;
  }
}
