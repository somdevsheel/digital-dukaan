import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { SalesRangeDto } from "../application/dto/sales-range.dto";
import { SalesAnalyticsUseCase } from "../application/use-cases/sales-analytics.use-case";

@ApiTags("merchant/analytics")
@Controller("merchant/businesses/:businessId/analytics")
export class MerchantAnalyticsController {
  constructor(private readonly analytics: SalesAnalyticsUseCase) {}

  @RequirePermission("analytics.view")
  @Get("sales")
  getSales(@Param("businessId") businessId: string, @Query() query: SalesRangeDto) {
    return this.analytics.getSummary(businessId, query.range ?? "today");
  }
}
