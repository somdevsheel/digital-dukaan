import { Module, type OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule, InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import configuration from "./config/configuration";
import { PrismaService } from "./prisma/prisma.service";
import { PUSH_SENDER, EMAIL_SENDER, SMS_SENDER } from "./channels/channel-sender.port";
import { ConsoleEmailSender, ConsolePushSender, ConsoleSmsSender } from "./channels/console-channel-senders";
import { NotificationsProcessor } from "./processors/notifications.processor";
import { StaleOrderCleanupProcessor } from "./processors/stale-order-cleanup.processor";
import { ReportRollupProcessor } from "./processors/report-rollup.processor";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>("redisUrl"));
        return { connection: { host: url.hostname, port: Number(url.port || 6379), password: url.password || undefined } };
      },
    }),
    BullModule.registerQueue({ name: "notifications" }, { name: "maintenance" }),
  ],
  providers: [
    PrismaService,
    { provide: PUSH_SENDER, useClass: ConsolePushSender },
    { provide: EMAIL_SENDER, useClass: ConsoleEmailSender },
    { provide: SMS_SENDER, useClass: ConsoleSmsSender },
    NotificationsProcessor,
    StaleOrderCleanupProcessor,
    ReportRollupProcessor,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectQueue("maintenance") private readonly maintenanceQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    // Repeatable jobs — idempotent to register on every boot (BullMQ dedupes by jobId +
    // repeat pattern), so a worker restart never creates duplicate schedules.
    await this.maintenanceQueue.add(
      "stale-order-cleanup",
      {},
      { repeat: { every: 5 * 60_000 }, jobId: "stale-order-cleanup-repeatable" },
    );
    await this.maintenanceQueue.add(
      "report-rollup",
      {},
      { repeat: { every: 15 * 60_000 }, jobId: "report-rollup-repeatable" },
    );
  }
}
