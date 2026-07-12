import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { OverviewAnalyticsUseCase } from "../application/use-cases/overview-analytics.use-case";

@ApiTags("admin/analytics")
@Controller("admin/analytics")
@RequirePermission("analytics.view")
export class AdminAnalyticsController {
  constructor(private readonly overview: OverviewAnalyticsUseCase) {}

  @Get("revenue")
  getOverview() {
    return this.overview.get();
  }
}
