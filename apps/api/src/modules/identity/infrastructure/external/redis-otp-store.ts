import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../../../../common/redis/redis.module";
import type { OtpRecord, OtpStorePort } from "../../domain/services/otp-store.port";

const key = (phone: string) => `otp:${phone}`;

@Injectable()
export class RedisOtpStore implements OtpStorePort {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async save(phone: string, record: OtpRecord): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000));
    await this.redis.set(key(phone), JSON.stringify(record), "EX", ttlSeconds);
  }

  async get(phone: string): Promise<OtpRecord | null> {
    const raw = await this.redis.get(key(phone));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OtpRecord & { expiresAt: string };
    return { ...parsed, expiresAt: new Date(parsed.expiresAt) };
  }

  async incrementAttempts(phone: string): Promise<number> {
    const record = await this.get(phone);
    if (!record) return 0;
    const updated: OtpRecord = { ...record, attempts: record.attempts + 1 };
    await this.save(phone, updated);
    return updated.attempts;
  }

  async clear(phone: string): Promise<void> {
    await this.redis.del(key(phone));
  }
}
