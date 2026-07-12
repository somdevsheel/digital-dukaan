import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CreatePaymentTransactionInput,
  PaymentTransactionRecord,
  PaymentTransactionRepository,
  PaymentTransactionStatus,
} from "../../domain/repositories/payment-transaction.repository";

@Injectable()
export class PrismaPaymentTransactionRepository implements PaymentTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePaymentTransactionInput): Promise<PaymentTransactionRecord> {
    return this.prisma.paymentTransaction.create({
      data: {
        orderId: input.orderId,
        type: input.type,
        amountPaise: input.amountPaise,
        provider: input.provider,
        ...(input.providerRefId !== undefined ? { providerRefId: input.providerRefId } : {}),
        status: input.status,
        ...(input.rawPayload !== undefined ? { rawPayload: input.rawPayload as Prisma.InputJsonValue } : {}),
      },
    });
  }

  findByProviderRefId(providerRefId: string): Promise<PaymentTransactionRecord | null> {
    return this.prisma.paymentTransaction.findFirst({ where: { providerRefId } });
  }

  updateStatus(id: string, status: PaymentTransactionStatus): Promise<PaymentTransactionRecord> {
    return this.prisma.paymentTransaction.update({ where: { id }, data: { status } });
  }

  listForOrder(orderId: string): Promise<PaymentTransactionRecord[]> {
    return this.prisma.paymentTransaction.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } });
  }
}
