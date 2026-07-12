import { Injectable } from "@nestjs/common";
import type { SupportTicket, TicketMessage } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CreateTicketInput,
  SupportTicketRecord,
  SupportTicketRepository,
  TicketPriority,
  TicketStatus,
} from "../../domain/repositories/support-ticket.repository";

type TicketWithMessages = SupportTicket & { messages: TicketMessage[] };

const INCLUDE = { messages: { orderBy: { createdAt: "asc" as const } } };

@Injectable()
export class PrismaSupportTicketRepository implements SupportTicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTicketInput): Promise<SupportTicketRecord> {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: input.userId,
        ...(input.orderId !== undefined ? { orderId: input.orderId } : {}),
        subject: input.subject,
        messages: { create: [{ senderUserId: input.userId, message: input.message }] },
      },
      include: INCLUDE,
    });
    return this.toRecord(ticket);
  }

  async findById(id: string): Promise<SupportTicketRecord | null> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, include: INCLUDE });
    return ticket ? this.toRecord(ticket) : null;
  }

  async listForUser(userId: string, cursor?: string, limit = 20): Promise<SupportTicketRecord[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: INCLUDE,
    });
    return tickets.map((t) => this.toRecord(t));
  }

  async listForAdmin(status?: TicketStatus, priority?: TicketPriority, cursor?: string, limit = 20): Promise<SupportTicketRecord[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { ...(status ? { status } : {}), ...(priority ? { priority } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: INCLUDE,
    });
    return tickets.map((t) => this.toRecord(t));
  }

  async addMessage(ticketId: string, senderUserId: string, message: string): Promise<SupportTicketRecord> {
    await this.prisma.ticketMessage.create({ data: { ticketId, senderUserId, message } });
    const ticket = await this.prisma.supportTicket.findUniqueOrThrow({ where: { id: ticketId }, include: INCLUDE });
    return this.toRecord(ticket);
  }

  async updateStatus(ticketId: string, status: TicketStatus, assignedAdminId?: string): Promise<SupportTicketRecord> {
    const ticket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, ...(assignedAdminId ? { assignedAdminId } : {}) },
      include: INCLUDE,
    });
    return this.toRecord(ticket);
  }

  private toRecord(ticket: TicketWithMessages): SupportTicketRecord {
    return {
      id: ticket.id,
      userId: ticket.userId,
      orderId: ticket.orderId,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      assignedAdminId: ticket.assignedAdminId,
      messages: ticket.messages.map((m) => ({ id: m.id, senderUserId: m.senderUserId, message: m.message, createdAt: m.createdAt })),
      createdAt: ticket.createdAt,
    };
  }
}
