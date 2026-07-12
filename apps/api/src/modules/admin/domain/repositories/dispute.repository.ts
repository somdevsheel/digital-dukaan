export type DisputeType = "REFUND" | "QUALITY" | "DELIVERY" | "OTHER";
export type DisputeStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "REJECTED";

export interface DisputeRecord {
  id: string;
  orderId: string;
  raisedByUserId: string;
  type: DisputeType;
  status: DisputeStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
  createdAt: Date;
}

export interface DisputeRepository {
  create(orderId: string, raisedByUserId: string, type: DisputeType): Promise<DisputeRecord>;
  findById(id: string): Promise<DisputeRecord | null>;
  listForAdmin(status?: DisputeStatus, cursor?: string): Promise<DisputeRecord[]>;
  resolve(id: string, status: "RESOLVED" | "REJECTED", resolutionNote: string, resolvedBy: string): Promise<DisputeRecord>;
}

export const DISPUTE_REPOSITORY = Symbol("DISPUTE_REPOSITORY");
