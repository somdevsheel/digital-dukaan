import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { AuditLogQueryUseCase } from "../application/use-cases/audit-log-query.use-case";

@ApiTags("admin/audit-log")
@Controller("admin/audit-logs")
@RequirePermission("audit.view")
export class AdminAuditLogController {
  constructor(private readonly auditLog: AuditLogQueryUseCase) {}

  @Get()
  list(
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("actorUserId") actorUserId?: string,
    @Query("cursor") cursor?: string,
  ) {
    if (entityType && entityId) {
      return this.auditLog.listByEntity(entityType, entityId, cursor);
    }
    if (actorUserId) {
      return this.auditLog.listByActor(actorUserId, cursor);
    }
    return [];
  }
}
