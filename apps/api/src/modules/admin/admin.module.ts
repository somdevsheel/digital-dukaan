import { Module } from "@nestjs/common";
import { CommerceModule } from "../commerce/commerce.module";

import { AUDIT_LOG_REPOSITORY } from "./domain/repositories/audit-log.repository";
import { SUPPORT_TICKET_REPOSITORY } from "./domain/repositories/support-ticket.repository";
import { DISPUTE_REPOSITORY } from "./domain/repositories/dispute.repository";
import { OVERVIEW_ANALYTICS_REPOSITORY } from "./domain/repositories/overview-analytics.repository";

import { PrismaAuditLogRepository } from "./infrastructure/persistence/prisma-audit-log.repository";
import { PrismaSupportTicketRepository } from "./infrastructure/persistence/prisma-support-ticket.repository";
import { PrismaDisputeRepository } from "./infrastructure/persistence/prisma-dispute.repository";
import { PrismaOverviewAnalyticsRepository } from "./infrastructure/persistence/prisma-overview-analytics.repository";

import { SupportTicketUseCase } from "./application/use-cases/support-ticket.use-case";
import { DisputeUseCase } from "./application/use-cases/dispute.use-case";
import { AuditLogQueryUseCase } from "./application/use-cases/audit-log-query.use-case";
import { OverviewAnalyticsUseCase } from "./application/use-cases/overview-analytics.use-case";
import { AuditLogListener } from "./application/listeners/audit-log.listener";

import { SupportTicketController } from "./presentation/support-ticket.controller";
import { AdminSupportTicketController } from "./presentation/admin-support-ticket.controller";
import { DisputeController } from "./presentation/dispute.controller";
import { AdminDisputeController } from "./presentation/admin-dispute.controller";
import { AdminAuditLogController } from "./presentation/admin-audit-log.controller";
import { AdminAnalyticsController } from "./presentation/admin-analytics.controller";

@Module({
  imports: [CommerceModule], // ORDER_REPOSITORY — validates a dispute's orderId belongs to the raising customer
  controllers: [
    SupportTicketController,
    AdminSupportTicketController,
    DisputeController,
    AdminDisputeController,
    AdminAuditLogController,
    AdminAnalyticsController,
  ],
  providers: [
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: SUPPORT_TICKET_REPOSITORY, useClass: PrismaSupportTicketRepository },
    { provide: DISPUTE_REPOSITORY, useClass: PrismaDisputeRepository },
    { provide: OVERVIEW_ANALYTICS_REPOSITORY, useClass: PrismaOverviewAnalyticsRepository },

    SupportTicketUseCase,
    DisputeUseCase,
    AuditLogQueryUseCase,
    OverviewAnalyticsUseCase,
    AuditLogListener,
  ],
})
export class AdminModule {}
