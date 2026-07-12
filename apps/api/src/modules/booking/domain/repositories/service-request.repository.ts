export type ServiceRequestStatus = "REQUESTED" | "CONFIRMED" | "DECLINED" | "COMPLETED" | "CANCELLED";

export interface ServiceRequestRecord {
  id: string;
  userId: string;
  businessId: string;
  serviceId: string | null;
  preferredDate: Date;
  preferredTimeWindow: string;
  notes: string | null;
  status: ServiceRequestStatus;
  respondedAt: Date | null;
  createdAt: Date;
}

export interface CreateServiceRequestInput {
  serviceId?: string | undefined;
  preferredDate: Date;
  preferredTimeWindow: string;
  notes?: string | undefined;
}

/**
 * Port — deliberately the only table Model B touches at MVP (PRD's approved sequencing,
 * Database Design §4.2/§8). No slot/calendar concept exists yet; `respond` just flips
 * status based on the business's manual decision.
 */
export interface ServiceRequestRepository {
  create(userId: string, businessId: string, input: CreateServiceRequestInput): Promise<ServiceRequestRecord>;
  findById(id: string): Promise<ServiceRequestRecord | null>;
  listForUser(userId: string, cursor?: string, limit?: number): Promise<ServiceRequestRecord[]>;
  listForBusiness(businessId: string, status?: ServiceRequestStatus, cursor?: string, limit?: number): Promise<ServiceRequestRecord[]>;
  respond(id: string, status: "CONFIRMED" | "DECLINED"): Promise<ServiceRequestRecord>;
  cancel(id: string): Promise<ServiceRequestRecord>;
}

export const SERVICE_REQUEST_REPOSITORY = Symbol("SERVICE_REQUEST_REPOSITORY");
