import { Inject, Injectable } from "@nestjs/common";
import {
  SUPPORT_TICKET_REPOSITORY,
  type SupportTicketRecord,
  type SupportTicketRepository,
  type TicketPriority,
  type TicketStatus,
} from "../../domain/repositories/support-ticket.repository";
import { NotYourTicketException, TicketNotFoundException } from "../../domain/errors/admin.errors";
import type { CreateTicketDto } from "../dto/support-ticket.dto";

@Injectable()
export class SupportTicketUseCase {
  constructor(@Inject(SUPPORT_TICKET_REPOSITORY) private readonly tickets: SupportTicketRepository) {}

  create(userId: string, dto: CreateTicketDto): Promise<SupportTicketRecord> {
    return this.tickets.create({ userId, orderId: dto.orderId, subject: dto.subject, message: dto.message });
  }

  async getForUser(userId: string, id: string): Promise<SupportTicketRecord> {
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw new TicketNotFoundException();
    if (ticket.userId !== userId) throw new NotYourTicketException();
    return ticket;
  }

  listMine(userId: string, cursor?: string): Promise<SupportTicketRecord[]> {
    return this.tickets.listForUser(userId, cursor);
  }

  async addMessage(userId: string, ticketId: string, message: string): Promise<SupportTicketRecord> {
    await this.getForUser(userId, ticketId);
    return this.tickets.addMessage(ticketId, userId, message);
  }

  listForAdmin(status?: TicketStatus, priority?: TicketPriority, cursor?: string): Promise<SupportTicketRecord[]> {
    return this.tickets.listForAdmin(status, priority, cursor);
  }

  addAdminMessage(adminUserId: string, ticketId: string, message: string): Promise<SupportTicketRecord> {
    return this.tickets.addMessage(ticketId, adminUserId, message);
  }

  updateStatus(ticketId: string, status: TicketStatus, assignedAdminId?: string): Promise<SupportTicketRecord> {
    return this.tickets.updateStatus(ticketId, status, assignedAdminId);
  }
}
