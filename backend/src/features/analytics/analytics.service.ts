import { Injectable } from '@nestjs/common';

import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import type {
  AnalyticsConnectionStatus,
  PaginatedAnalyticsSnapshots,
} from './types/analytics.types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  listSnapshots(
    query: AnalyticsQueryDto,
  ): Promise<PaginatedAnalyticsSnapshots> {
    return this.analyticsRepository.findSnapshots(query);
  }

  getConnectionStatus(): Promise<AnalyticsConnectionStatus> {
    return this.analyticsRepository.getConnectionStatus();
  }
}
