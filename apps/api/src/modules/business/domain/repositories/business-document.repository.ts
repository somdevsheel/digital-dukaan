export type BusinessDocumentType = "GST" | "PAN" | "FSSAI" | "BANK_PROOF" | "ID_PROOF" | "OTHER";
export type DocumentReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BusinessDocumentRecord {
  id: string;
  businessId: string;
  type: BusinessDocumentType;
  fileUrl: string;
  status: DocumentReviewStatus;
  createdAt: Date;
}

/** Port — records a document reference after the client uploads via a presigned URL (StoragePort). */
export interface BusinessDocumentRepository {
  listForBusiness(businessId: string): Promise<BusinessDocumentRecord[]>;
  create(businessId: string, type: BusinessDocumentType, fileUrl: string): Promise<BusinessDocumentRecord>;
  setReviewStatus(id: string, status: DocumentReviewStatus, reviewedBy: string): Promise<BusinessDocumentRecord>;
}

export const BUSINESS_DOCUMENT_REPOSITORY = Symbol("BUSINESS_DOCUMENT_REPOSITORY");
