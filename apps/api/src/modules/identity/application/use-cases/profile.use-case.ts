import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, type UserRecord, type UserRepository } from "../../domain/repositories/user.repository";
import { NotFoundException } from "../../../../common/errors/app.errors";
import type { UpdateMeDto } from "../dto/update-me.dto";

@Injectable()
export class ProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async getMe(userId: string): Promise<UserRecord> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException("User");
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserRecord> {
    await this.getMe(userId); // 404s cleanly if the caller's own account was hard-deleted mid-session
    return this.users.update(userId, dto);
  }
}
