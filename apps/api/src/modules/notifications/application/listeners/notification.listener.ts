import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  NOTIFICATION_DISPATCHER,
  type NotificationDispatcherPort,
} from "../../domain/services/notification-dispatcher.port";
import { BUSINESS_REPOSITORY, type BusinessRepository } from "../../../business/domain/repositories/business.repository";

/**
 * The single place every cross-module "this happened, tell someone" decision lives —
 * per Architecture §13, in-process EventEmitter2 at MVP (no dedicated broker yet). Each
 * handler resolves *who* to notify and *what* to say; the actual send is the dispatcher's
 * job (queued for apps/worker — see NotificationDispatcherPort's doc comment).
 */
@Injectable()
export class NotificationListener {
  constructor(
    @Inject(NOTIFICATION_DISPATCHER) private readonly dispatcher: NotificationDispatcherPort,
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
  ) {}

  @OnEvent("order.placed")
  async onOrderPlaced(payload: { orderId: string; businessId: string; userId: string }): Promise<void> {
    const business = await this.businesses.findById(payload.businessId);
    if (!business) return;

    // The merchant-facing alert is the important one — PRD's Ramesh persona: a missed
    // order is the single most damaging failure mode for this side of the marketplace.
    await this.dispatcher.dispatch({
      userId: business.ownerUserId,
      templateKey: "order.new_for_merchant",
      channel: "PUSH",
      payload: { orderId: payload.orderId },
    });
    await this.dispatcher.dispatch({
      userId: payload.userId,
      templateKey: "order.placed_confirmation",
      channel: "IN_APP",
      payload: { orderId: payload.orderId },
    });
  }

  @OnEvent("order.status_changed")
  async onOrderStatusChanged(payload: { orderId: string; userId: string; businessId: string; status: string }): Promise<void> {
    await this.dispatcher.dispatch({
      userId: payload.userId,
      templateKey: "order.status_changed",
      channel: "PUSH",
      payload: { orderId: payload.orderId, status: payload.status },
    });
  }

  @OnEvent("business.verification_changed")
  async onBusinessVerificationChanged(payload: { businessId: string; status: string; reason?: string }): Promise<void> {
    const business = await this.businesses.findById(payload.businessId);
    if (!business) return;

    await this.dispatcher.dispatch({
      userId: business.ownerUserId,
      templateKey: payload.status === "VERIFIED" ? "business.verified" : "business.rejected",
      channel: "PUSH",
      payload: { businessId: payload.businessId, reason: payload.reason },
    });
  }

  @OnEvent("service_request.created")
  async onServiceRequestCreated(payload: { requestId: string; businessId: string }): Promise<void> {
    const business = await this.businesses.findById(payload.businessId);
    if (!business) return;

    await this.dispatcher.dispatch({
      userId: business.ownerUserId,
      templateKey: "service_request.new",
      channel: "PUSH",
      payload: { requestId: payload.requestId },
    });
  }
}
