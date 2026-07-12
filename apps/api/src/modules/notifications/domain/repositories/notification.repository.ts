export type NotificationChannel = "PUSH" | "EMAIL" | "SMS" | "IN_APP";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "READ";

export interface NotificationRecord {
  id: string;
  userId: string;
  templateKey: string;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  readAt: Date | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  templateKey: string;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
}

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<NotificationRecord>;
  listForUser(userId: string, cursor?: string, limit?: number): Promise<NotificationRecord[]>;
  markRead(id: string, userId: string): Promise<NotificationRecord>;
}

export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");
