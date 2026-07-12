import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BusinessModule } from "../business/business.module";
import { NOTIFICATION_REPOSITORY } from "./domain/repositories/notification.repository";
import { NOTIFICATION_PREFERENCE_REPOSITORY } from "./domain/repositories/notification-preference.repository";
import { NOTIFICATION_DISPATCHER } from "./domain/services/notification-dispatcher.port";
import { PrismaNotificationRepository } from "./infrastructure/persistence/prisma-notification.repository";
import { PrismaNotificationPreferenceRepository } from "./infrastructure/persistence/prisma-notification-preference.repository";
import { BullmqNotificationDispatcher, NOTIFICATIONS_QUEUE } from "./infrastructure/queue/bullmq-notification-dispatcher";
import { NotificationUseCase } from "./application/use-cases/notification.use-case";
import { NotificationListener } from "./application/listeners/notification.listener";
import { NotificationController } from "./presentation/notification.controller";

@Module({
  imports: [BusinessModule, BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  controllers: [NotificationController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: NOTIFICATION_PREFERENCE_REPOSITORY, useClass: PrismaNotificationPreferenceRepository },
    { provide: NOTIFICATION_DISPATCHER, useClass: BullmqNotificationDispatcher },
    NotificationUseCase,
    NotificationListener,
  ],
})
export class NotificationsModule {}
