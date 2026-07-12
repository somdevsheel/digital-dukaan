import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  DELIVERY_REPOSITORY,
  type DeliveryOffer,
  type DeliveryRecord,
  type DeliveryRepository,
} from "../../domain/repositories/delivery.repository";
import {
  DELIVERY_PARTNER_REPOSITORY,
  type DeliveryPartnerRepository,
} from "../../domain/repositories/delivery-partner.repository";
import { DELIVERY_EARNING_REPOSITORY, type DeliveryEarningRepository } from "../../domain/repositories/delivery-earning.repository";
import { CASH_COLLECTION_REPOSITORY, type CashCollectionRepository } from "../../domain/repositories/cash-collection.repository";
import { ORDER_REPOSITORY, type OrderRepository } from "../../../commerce/domain/repositories/order.repository";
import { OrderStatusUseCase } from "../../../commerce/application/use-cases/order-status.use-case";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../../identity/domain/services/password-hasher.port";
import { generateDeliveryOtp } from "../../domain/value-objects/delivery-otp";
import {
  DeliveryAlreadyAssignedException,
  DeliveryNotFoundException,
  InvalidDeliveryOtpException,
  NotAssignedToThisDeliveryException,
} from "../../domain/errors/delivery.errors";
import { DeliveryPartnerUseCase } from "./delivery-partner.use-case";

// Placeholder flat per-delivery earning — a real distance/time-based payout model is a
// V1.1+ concern (same "pending business/finance calibration" caveat as Commerce's flat
// delivery/platform fees).
const FLAT_EARNING_PAISE = 3000;

@Injectable()
export class DeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveries: DeliveryRepository,
    @Inject(DELIVERY_PARTNER_REPOSITORY) private readonly partners: DeliveryPartnerRepository,
    @Inject(DELIVERY_EARNING_REPOSITORY) private readonly earnings: DeliveryEarningRepository,
    @Inject(CASH_COLLECTION_REPOSITORY) private readonly cashCollections: CashCollectionRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    private readonly deliveryPartnerUseCase: DeliveryPartnerUseCase,
    private readonly orderStatus: OrderStatusUseCase,
    private readonly events: EventEmitter2,
  ) {}

  async listOffers(userId: string, latitude: number, longitude: number, radiusMeters: number): Promise<DeliveryOffer[]> {
    await this.deliveryPartnerUseCase.getMine(userId); // 404s cleanly if caller never registered as a partner
    return this.deliveries.listOffersNear(latitude, longitude, radiusMeters);
  }

  async accept(userId: string, deliveryId: string): Promise<DeliveryRecord> {
    const partner = await this.deliveryPartnerUseCase.getMine(userId);
    const won = await this.deliveries.assign(deliveryId, partner.id);
    if (!won) throw new DeliveryAlreadyAssignedException();

    const delivery = await this.deliveries.findById(deliveryId);
    if (!delivery) throw new DeliveryNotFoundException();
    return delivery;
  }

  async markPickedUp(userId: string, deliveryId: string): Promise<{ delivery: DeliveryRecord; otp: string }> {
    const { partner, delivery } = await this.getOwnedDelivery(userId, deliveryId);

    const otp = generateDeliveryOtp();
    const otpHash = await this.hasher.hash(otp);
    const updated = await this.deliveries.markPickedUp(deliveryId, otpHash);

    await this.orderStatus.markOutForDeliveryByPartner(delivery.orderId, partner.userId);

    // Plaintext OTP is sent to the customer via this event/notification payload and never
    // persisted in the Delivery table itself (Database Design §6) — see NotificationRecord's
    // payload as the one legitimate place it's retrievable from afterward.
    this.events.emit("delivery.picked_up", { orderId: delivery.orderId, otp });

    return { delivery: updated, otp };
  }

  async completeDelivery(userId: string, deliveryId: string, providedOtp: string): Promise<DeliveryRecord> {
    const { partner, delivery } = await this.getOwnedDelivery(userId, deliveryId);

    const storedHash = await this.deliveries.getOtpHash(deliveryId);
    if (!storedHash || !(await this.hasher.verify(storedHash, providedOtp))) {
      throw new InvalidDeliveryOtpException();
    }

    const updated = await this.deliveries.markDelivered(deliveryId, FLAT_EARNING_PAISE);
    await this.earnings.credit(partner.id, deliveryId, "DELIVERY_FEE", FLAT_EARNING_PAISE);

    const order = await this.orders.findById(delivery.orderId);
    if (order?.paymentMethod === "COD") {
      await this.cashCollections.createForOrder(order.id, partner.id, order.totalPaise);
      await this.cashCollections.markCollected(order.id);
    }

    await this.orderStatus.markDeliveredByPartner(delivery.orderId, partner.userId);
    return updated;
  }

  listMyDeliveries(userId: string, cursor?: string): Promise<DeliveryRecord[]> {
    return this.deliveryPartnerUseCase.getMine(userId).then((partner) => this.deliveries.listForPartner(partner.id, cursor));
  }

  private async getOwnedDelivery(userId: string, deliveryId: string) {
    const partner = await this.deliveryPartnerUseCase.getMine(userId);
    const delivery = await this.deliveries.findById(deliveryId);
    if (!delivery) throw new DeliveryNotFoundException();
    if (delivery.deliveryPartnerId !== partner.id) throw new NotAssignedToThisDeliveryException();
    return { partner, delivery };
  }
}
