import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserRecord,
  UserRepository,
} from "../../domain/repositories/user.repository";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    return user ? this.toRecord(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    return user ? this.toRecord(user) : null;
  }

  async findByPhone(phone: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({ where: { phone, deletedAt: null } });
    return user ? this.toRecord(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const user = await this.prisma.user.create({
      data: {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      },
    });
    return this.toRecord(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord> {
    const user = await this.prisma.user.update({ where: { id }, data: input });
    return this.toRecord(user);
  }

  private toRecord(user: {
    id: string;
    email: string | null;
    phone: string | null;
    passwordHash: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
    status: string;
    createdAt: Date;
  }): UserRecord {
    return { ...user, status: user.status as UserRecord["status"] };
  }
}
