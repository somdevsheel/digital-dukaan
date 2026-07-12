import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from "../../domain/repositories/notification.repository";
import type { DispatchNotificationInput, NotificationDispatcherPort } from "../../domain/services/notification-dispatcher.port";

export const NOTIFICATIONS_QUEUE = "notifications";

@Injectable()
export class BullmqNotificationDispatcher implements NotificationDispatcherPort {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepository,
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<void> {
    // IN_APP is written directly — it IS the notification center, not a channel apps/worker
    // sends externally. PUSH/EMAIL/SMS are enqueued for the worker's eventual consumer.
    if (input.channel === "IN_APP") {
      await this.notifications.create(input);
      return;
    }

    await this.notifications.create(input);
    await this.queue.add(input.templateKey, input, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
    });
  }
}
