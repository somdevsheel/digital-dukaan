import { Body, Controller, Get, Param, Patch, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { UpdateNotificationPreferenceDto } from "../application/dto/update-preference.dto";
import { NotificationUseCase } from "../application/use-cases/notification.use-case";

@ApiTags("notifications")
@Controller("me")
export class NotificationController {
  constructor(private readonly notifications: NotificationUseCase) {}

  @Get("notifications")
  list(@CurrentUser() user: AuthenticatedUser, @Query("cursor") cursor?: string) {
    return this.notifications.listForUser(user.userId, cursor);
  }

  @Patch("notifications/:id/read")
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notifications.markRead(user.userId, id);
  }

  @Get("notification-preferences")
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.getPreferences(user.userId);
  }

  @Put("notification-preferences")
  updatePreference(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateNotificationPreferenceDto) {
    return this.notifications.updatePreference(user.userId, dto.category, dto.channel, dto.isEnabled);
  }
}
