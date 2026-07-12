import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import configuration from "./common/config/configuration";
import { validateEnv } from "./common/config/env.validation";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { StorageModule } from "./common/storage/storage.module";
import { SecurityModule } from "./common/security/security.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionGuard } from "./common/guards/permission.guard";
import { IdentityModule } from "./modules/identity/identity.module";
import { BusinessModule } from "./modules/business/business.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CommerceModule } from "./modules/commerce/commerce.module";
import { BookingModule } from "./modules/booking/booking.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    EventEmitterModule.forRoot(),
    // Default limit; auth/OTP endpoints override via @Throttle per API Design §3.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    // Same Redis instance BullMQ jobs live in as REDIS_CLIENT (cache/locks/OTP/idempotency,
    // Architecture §15) — one Redis for local dev/MVP scale, not a second connection.
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>("redisUrl"));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
          },
        };
      },
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    SecurityModule,
    IdentityModule,
    BusinessModule,
    PaymentsModule,
    CommerceModule,
    BookingModule,
    ReviewsModule,
    NotificationsModule,
    DeliveryModule,
    AdminModule,
  ],
  providers: [
    // Order matters: Throttler -> Auth -> Permission, each narrowing who/what gets through.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
