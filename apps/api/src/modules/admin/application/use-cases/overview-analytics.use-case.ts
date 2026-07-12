import { Inject, Injectable } from "@nestjs/common";
import {
  OVERVIEW_ANALYTICS_REPOSITORY,
  type OverviewAnalyticsRecord,
  type OverviewAnalyticsRepository,
} from "../../domain/repositories/overview-analytics.repository";

@Injectable()
export class OverviewAnalyticsUseCase {
  constructor(@Inject(OVERVIEW_ANALYTICS_REPOSITORY) private readonly analytics: OverviewAnalyticsRepository) {}

  get(): Promise<OverviewAnalyticsRecord> {
    return this.analytics.get();
  }
}
