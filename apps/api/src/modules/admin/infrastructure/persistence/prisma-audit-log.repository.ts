import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { AuditLogRecord, AuditLogRepository, CreateAuditLogInput } from "../../domain/repositories/audit-log.repository";

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    const entry = await this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        actorType: input.actorType,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.beforeJson !== undefined ? { beforeJson: input.beforeJson as Prisma.InputJsonValue } : {}),
        ...(input.afterJson !== undefined ? { afterJson: input.afterJson as Prisma.InputJsonValue } : {}),
        ...(input.ipAddress !== undefined ? { ipAddress: input.ipAddress } : {}),
      },
    });
    return this.toRecord(entry);
  }

  async listByEntity(entityType: string, entityId: string, cursor?: string, limit = 50): Promise<AuditLogRecord[]> {
    const entries = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return entries.map((e) => this.toRecord(e));
  }

  async listByActor(actorUserId: string, cursor?: string, limit = 50): Promise<AuditLogRecord[]> {
    const entries = await this.prisma.auditLog.findMany({
      where: { actorUserId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return entries.map((e) => this.toRecord(e));
  }

  private toRecord(entry: {
    id: string;
    actorUserId: string | null;
    actorType: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeJson: unknown;
    afterJson: unknown;
    createdAt: Date;
  }): AuditLogRecord {
    return {
      id: entry.id,
      actorUserId: entry.actorUserId,
      actorType: entry.actorType as AuditLogRecord["actorType"],
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      beforeJson: entry.beforeJson as Record<string, unknown> | null,
      afterJson: entry.afterJson as Record<string, unknown> | null,
      createdAt: entry.createdAt,
    };
  }
}
