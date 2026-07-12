export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketMessageRecord {
  id: string;
  senderUserId: string;
  message: string;
  createdAt: Date;
}

export interface SupportTicketRecord {
  id: string;
  userId: string | null;
  orderId: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedAdminId: string | null;
  messages: TicketMessageRecord[];
  createdAt: Date;
}

export interface CreateTicketInput {
  userId: string;
  orderId?: string | undefined;
  subject: string;
  message: string;
}

export interface SupportTicketRepository {
  create(input: CreateTicketInput): Promise<SupportTicketRecord>;
  findById(id: string): Promise<SupportTicketRecord | null>;
  listForUser(userId: string, cursor?: string): Promise<SupportTicketRecord[]>;
  listForAdmin(status?: TicketStatus, priority?: TicketPriority, cursor?: string): Promise<SupportTicketRecord[]>;
  addMessage(ticketId: string, senderUserId: string, message: string): Promise<SupportTicketRecord>;
  updateStatus(ticketId: string, status: TicketStatus, assignedAdminId?: string): Promise<SupportTicketRecord>;
}

export const SUPPORT_TICKET_REPOSITORY = Symbol("SUPPORT_TICKET_REPOSITORY");
