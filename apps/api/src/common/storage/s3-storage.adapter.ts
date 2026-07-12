import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StoragePort } from "./storage.port";

const UPLOAD_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class S3StorageAdapter implements StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  // In production this is a CDN domain in front of the bucket (Architecture §21), not the
  // raw S3 endpoint — falls back to the endpoint itself for local dev against MinIO.
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("storage.bucket");
    this.endpoint = this.config.getOrThrow<string>("storage.endpoint");
    this.publicBaseUrl = this.config.get<string>("storage.publicBaseUrl") ?? this.endpoint;
    this.client = new S3Client({
      endpoint: this.endpoint,
      region: "auto",
      forcePathStyle: true, // required for MinIO/R2-style path addressing
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("storage.accessKeyId"),
        secretAccessKey: this.config.getOrThrow<string>("storage.secretAccessKey"),
      },
    });
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
    return { uploadUrl, publicUrl: this.getPublicUrl(key) };
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${this.bucket}/${key}`;
  }
}
