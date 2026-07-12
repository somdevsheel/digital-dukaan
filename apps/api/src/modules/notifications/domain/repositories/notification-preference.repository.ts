import type { NotificationChannel } from "./notification.repository";

export interface NotificationPreferenceRecord {
  category: string;
  channel: NotificationChannel;
  isEnabled: boolean;
}

/** Categories are free-form strings by design (e.g. "order_updates", "marketing", "chat") —
 *  see Database Design; not an enum, since Admin/product may add categories without a migration. */
export interface NotificationPreferenceRepository {
  listForUser(userId: string): Promise<NotificationPreferenceRecord[]>;
  isEnabled(userId: string, category: string, channel: NotificationChannel): Promise<boolean>;
  upsert(userId: string, category: string, channel: NotificationChannel, isEnabled: boolean): Promise<NotificationPreferenceRecord>;
}

export const NOTIFICATION_PREFERENCE_REPOSITORY = Symbol("NOTIFICATION_PREFERENCE_REPOSITORY");
