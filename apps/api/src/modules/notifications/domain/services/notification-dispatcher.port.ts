import type { NotificationChannel } from "../repositories/notification.repository";

export interface DispatchNotificationInput {
  userId: string;
  templateKey: string;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
}

/**
 * Port — enqueues onto the `notifications` BullMQ queue (Architecture §13). This module
 * owns the *decision* of what to notify (event listeners below) and the in-app
 * notification-center record; the actual Push/Email/SMS *sending* is `apps/worker`'s job
 * (still an empty scaffold as of this pass — see FOLDER_STRUCTURE.md). Enqueueing here
 * without a consumer yet is not a half-finished implementation: the in-app channel
 * (IN_APP) is fully functional today via NotificationRepository regardless of whether
 * PUSH/EMAIL/SMS jobs are ever consumed, and the queue durably holds those jobs until a
 * worker exists to process them — nothing is lost by building this side first.
 */
export interface NotificationDispatcherPort {
  dispatch(input: DispatchNotificationInput): Promise<void>;
}

export const NOTIFICATION_DISPATCHER = Symbol("NOTIFICATION_DISPATCHER");
