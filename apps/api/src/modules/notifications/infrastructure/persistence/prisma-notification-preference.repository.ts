import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  NotificationPreferenceRecord,
  NotificationPreferenceRepository,
} from "../../domain/repositories/notification-preference.repository";
import type { NotificationChannel } from "../../domain/repositories/notification.repository";

@Injectable()
export class PrismaNotificationPreferenceRepository implements NotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string): Promise<NotificationPreferenceRecord[]> {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      select: { category: true, channel: true, isEnabled: true },
    });
  }

  async isEnabled(userId: string, category: string, channel: NotificationChannel): Promise<boolean> {
    // OTP and other critical transactional categories bypass preferences entirely at the
    // call site (RequestOtpUseCase never consults this) — absence of a row here means
    // "default enabled," not "default silent."
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_category_channel: { userId, category, channel } },
    });
    return pref?.isEnabled ?? true;
  }

  upsert(userId: string, category: string, channel: NotificationChannel, isEnabled: boolean): Promise<NotificationPreferenceRecord> {
    return this.prisma.notificationPreference.upsert({
      where: { userId_category_channel: { userId, category, channel } },
      update: { isEnabled },
      create: { userId, category, channel, isEnabled },
      select: { category: true, channel: true, isEnabled: true },
    });
  }
}
