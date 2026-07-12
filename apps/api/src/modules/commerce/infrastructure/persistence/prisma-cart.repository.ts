import { Injectable } from "@nestjs/common";
import type { Cart, CartItem } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { CartRecord, CartRepository } from "../../domain/repositories/cart.repository";
import { CartNotFoundException } from "../../domain/errors/commerce.errors";

type CartWithItems = Cart & { items: CartItem[] };

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateActive(userId: string, businessId: string): Promise<CartRecord> {
    const existing = await this.prisma.cart.findFirst({
      where: { userId, businessId, status: "ACTIVE" },
      include: { items: true },
    });
    if (existing) return this.toRecord(existing);

    const created = await this.prisma.cart.create({
      data: { userId, businessId, status: "ACTIVE" },
      include: { items: true },
    });
    return this.toRecord(created);
  }

  async findActiveById(cartId: string): Promise<CartRecord | null> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } });
    if (!cart || cart.status !== "ACTIVE") return null;
    return this.toRecord(cart);
  }

  async addItem(cartId: string, productVariantId: string, quantity: number, priceSnapshotPaise: number): Promise<CartRecord> {
    // One row per (cart, variant) — adding an already-present variant increments quantity
    // rather than creating a duplicate line, matching the DB's own unique constraint.
    await this.prisma.cartItem.upsert({
      where: { cartId_productVariantId: { cartId, productVariantId } },
      update: { quantity: { increment: quantity }, priceSnapshotPaise },
      create: { cartId, productVariantId, quantity, priceSnapshotPaise },
    });
    return this.reload(cartId);
  }

  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartRecord> {
    await this.prisma.cartItem.update({ where: { id: itemId, cartId }, data: { quantity } });
    return this.reload(cartId);
  }

  async removeItem(cartId: string, itemId: string): Promise<CartRecord> {
    await this.prisma.cartItem.delete({ where: { id: itemId, cartId } });
    return this.reload(cartId);
  }

  async markConverted(cartId: string): Promise<void> {
    await this.prisma.cart.update({ where: { id: cartId }, data: { status: "CONVERTED" } });
  }

  private async reload(cartId: string): Promise<CartRecord> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } });
    if (!cart) throw new CartNotFoundException();
    return this.toRecord(cart);
  }

  private toRecord(cart: CartWithItems): CartRecord {
    return {
      id: cart.id,
      userId: cart.userId,
      businessId: cart.businessId,
      status: cart.status,
      items: cart.items.map((i) => ({
        id: i.id,
        productVariantId: i.productVariantId,
        quantity: i.quantity,
        priceSnapshotPaise: i.priceSnapshotPaise,
      })),
    };
  }
}
