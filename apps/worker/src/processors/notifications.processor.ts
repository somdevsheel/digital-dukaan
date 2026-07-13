import { Inject, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { PUSH_SENDER, EMAIL_SENDER, SMS_SENDER, type ChannelSenderPort } from "../channels/channel-sender.port";

interface NotificationJobData {
  userId: string;
  templateKey: string;
  channel: "PUSH" | "EMAIL" | "SMS" | "IN_APP";
  payload: Record<string, unknown>;
}

function stringifyPayloadValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  // Payload values are expected to be primitives (see every NotificationListener call
  // site) — an object/array here is unexpected, so it's rendered as real JSON rather than
  // risking a silent, useless "[object Object]" in a message a customer/merchant reads.
  return JSON.stringify(value);
}

function renderTemplate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => stringifyPayloadValue(payload[key]));
}

/**
 * Consumes the `notifications` queue apps/api's BullmqNotificationDispatcher enqueues onto
 * (Architecture §12/§13). IN_APP notifications never reach this queue at all — they're
 * written directly to the Notification table by the dispatcher, since the notification
 * center *is* the in-app channel, not something external to send to.
 */
@Processor("notifications")
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_SENDER) private readonly pushSender: ChannelSenderPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: ChannelSenderPort,
    @Inject(SMS_SENDER) private readonly smsSender: ChannelSenderPort,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { userId, templateKey, channel, payload } = job.data;

    const [user, template] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.notificationTemplate.findFirst({ where: { key: templateKey, channel, locale: "en" } }),
    ]);

    if (!user) {
      this.logger.warn(`Notification for unknown user ${userId} [${templateKey}] — dropping`);
      return;
    }
    if (!template) {
      // Missing template is a deploy/ops gap (seed data out of sync with code), not a
      // reason to crash the whole job — logged loudly, job still marked complete so it
      // doesn't retry forever against a template that will never appear.
      this.logger.error(`No NotificationTemplate seeded for key=${templateKey} channel=${channel}`);
      return;
    }

    const to = channel === "SMS" ? user.phone : channel === "EMAIL" ? user.email : userId; // PUSH addressed by userId until a device-token table exists
    if (!to) {
      this.logger.warn(`User ${userId} has no ${channel} contact info — dropping notification`);
      return;
    }

    const sender = channel === "PUSH" ? this.pushSender : channel === "EMAIL" ? this.emailSender : this.smsSender;
    await sender.send({ to, templateKey, payload: { ...payload, body: renderTemplate(template.bodyTemplate, payload) } });
  }
}
