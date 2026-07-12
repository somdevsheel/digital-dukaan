import { Inject, Injectable } from "@nestjs/common";
import {
  NOTIFICATION_REPOSITORY,
  type NotificationChannel,
  type NotificationRecord,
  type NotificationRepository,
} from "../../domain/repositories/notification.repository";
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  type NotificationPreferenceRecord,
  type NotificationPreferenceRepository,
} from "../../domain/repositories/notification-preference.repository";

@Injectable()
export class NotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY) private readonly preferences: NotificationPreferenceRepository,
  ) {}

  listForUser(userId: string, cursor?: string): Promise<NotificationRecord[]> {
    return this.notifications.listForUser(userId, cursor);
  }

  markRead(userId: string, notificationId: string): Promise<NotificationRecord> {
    return this.notifications.markRead(notificationId, userId);
  }

  getPreferences(userId: string): Promise<NotificationPreferenceRecord[]> {
    return this.preferences.listForUser(userId);
  }

  updatePreference(userId: string, category: string, channel: NotificationChannel, isEnabled: boolean): Promise<NotificationPreferenceRecord> {
    return this.preferences.upsert(userId, category, channel, isEnabled);
  }
}
