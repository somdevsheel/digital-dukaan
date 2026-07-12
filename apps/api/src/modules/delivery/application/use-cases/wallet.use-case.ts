import { Inject, Injectable } from "@nestjs/common";
import { DELIVERY_EARNING_REPOSITORY, type DeliveryEarningRecord, type DeliveryEarningRepository } from "../../domain/repositories/delivery-earning.repository";
import { CASH_COLLECTION_REPOSITORY, type CashCollectionRepository } from "../../domain/repositories/cash-collection.repository";
import { DeliveryPartnerUseCase } from "./delivery-partner.use-case";

@Injectable()
export class WalletUseCase {
  constructor(
    @Inject(DELIVERY_EARNING_REPOSITORY) private readonly earnings: DeliveryEarningRepository,
    @Inject(CASH_COLLECTION_REPOSITORY) private readonly cashCollections: CashCollectionRepository,
    private readonly deliveryPartnerUseCase: DeliveryPartnerUseCase,
  ) {}

  async getWallet(userId: string): Promise<{ availableBalancePaise: number; cashToRemitPaise: number }> {
    const partner = await this.deliveryPartnerUseCase.getMine(userId);
    const [availableBalancePaise, cashToRemitPaise] = await Promise.all([
      this.earnings.getAvailableBalance(partner.id),
      this.cashCollections.getPendingRemittanceTotal(partner.id),
    ]);
    return { availableBalancePaise, cashToRemitPaise };
  }

  async listEarnings(userId: string, cursor?: string): Promise<DeliveryEarningRecord[]> {
    const partner = await this.deliveryPartnerUseCase.getMine(userId);
    return this.earnings.listForPartner(partner.id, cursor);
  }
}
