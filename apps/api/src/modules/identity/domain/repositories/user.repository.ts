// Plain domain shape — deliberately not `import type { User } from "@prisma/client"`.
// Architecture §5: domain/ has zero framework/library imports, Prisma included. The
// infrastructure-layer repository implementation maps Prisma's generated type onto this.
export interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  // Nullable — an OTP-first registration creates the User before a name is collected.
  // See Database Design §4.8.
  fullName: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  createdAt: Date;
}

export interface CreateUserInput {
  email?: string | undefined;
  phone?: string | undefined;
  passwordHash?: string | undefined;
  fullName?: string | undefined;
}

export interface UpdateUserInput {
  fullName?: string;
  avatarUrl?: string;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
}

/** Port — implemented by infrastructure/persistence/prisma-user.repository.ts. */
export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByPhone(phone: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
  update(id: string, input: UpdateUserInput): Promise<UserRecord>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
