import { Controller, Get, Query } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('snapshots')
  getSnapshots(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.listSnapshots(query);
  }

  @Get('connection')
  getConnectionStatus() {
    return this.analyticsService.getConnectionStatus();
  }
}
