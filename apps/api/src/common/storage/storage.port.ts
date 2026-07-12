/**
 * S3-compatible object storage — same interface against MinIO (local dev), Cloudflare R2,
 * or AWS S3 (Architecture ADR-011). Per API Design §1: the API never proxies binary
 * uploads — it issues a short-lived presigned PUT URL and the client uploads directly.
 */
export interface StoragePort {
  /** `key` should be namespaced by entity, e.g. `businesses/{id}/documents/{uuid}.pdf`. */
  getPresignedUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }>;
  getPublicUrl(key: string): string;
}

export const STORAGE_PORT = Symbol("STORAGE_PORT");
