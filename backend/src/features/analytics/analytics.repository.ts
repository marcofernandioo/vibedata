import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import type {
  AnalyticsConnectionStatus,
  PaginatedAnalyticsSnapshots,
} from './types/analytics.types';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSnapshots(
    query: AnalyticsQueryDto,
  ): Promise<PaginatedAnalyticsSnapshots> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const [snapshots, total] = await this.prisma.$transaction([
      this.prisma.analyticsSnapshot.findMany({
        skip,
        take: pageSize,
        orderBy: {
          capturedAt: 'desc',
        },
        select: {
          id: true,
          label: true,
          visitors: true,
          signups: true,
          capturedAt: true,
        },
      }),
      this.prisma.analyticsSnapshot.count(),
    ]);

    return {
      data: snapshots.map((snapshot) => ({
        ...snapshot,
        capturedAt: snapshot.capturedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        pageSize,
      },
    };
  }

  async getConnectionStatus(): Promise<AnalyticsConnectionStatus> {
    const [connection] = await this.prisma.$queryRaw<
      Array<{ database: string; schema: string }>
    >`SELECT current_database() AS database, current_schema() AS schema`;

    return {
      connected: true,
      provider: 'supabase-postgres',
      database: connection?.database ?? 'unknown',
      schema: connection?.schema ?? 'public',
    };
  }
}
