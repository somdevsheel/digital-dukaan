import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CreateNotificationInput,
  NotificationRecord,
  NotificationRepository,
} from "../../domain/repositories/notification.repository";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        templateKey: input.templateKey,
        channel: input.channel,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
    return { ...notification, payload: notification.payload as Record<string, unknown> };
  }

  async listForUser(userId: string, cursor?: string, limit = 20): Promise<NotificationRecord[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return notifications.map((n) => ({ ...n, payload: n.payload as Record<string, unknown> }));
  }

  async markRead(id: string, userId: string): Promise<NotificationRecord> {
    const notification = await this.prisma.notification.update({
      where: { id, userId },
      data: { status: "READ", readAt: new Date() },
    });
    return { ...notification, payload: notification.payload as Record<string, unknown> };
  }
}
