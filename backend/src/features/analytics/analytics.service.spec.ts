import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const analyticsRepository = {
    findSnapshots: jest.fn(),
    getConnectionStatus: jest.fn(),
  };

  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsRepository.findSnapshots.mockReset();
    analyticsRepository.getConnectionStatus.mockReset();
    analyticsService = new AnalyticsService(analyticsRepository as never);
  });

  it('returns paginated snapshots from the repository', async () => {
    const expectedResponse = {
      data: [
        {
          id: 'snapshot-1',
          label: 'Launch week',
          visitors: 1200,
          signups: 48,
          capturedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
        },
      ],
      meta: {
        total: 1,
        page: 2,
        pageSize: 5,
      },
    };

    analyticsRepository.findSnapshots.mockResolvedValue(expectedResponse);

    await expect(
      analyticsService.listSnapshots({ page: 2, pageSize: 5 }),
    ).resolves.toEqual(expectedResponse);
    expect(analyticsRepository.findSnapshots).toHaveBeenCalledWith({
      page: 2,
      pageSize: 5,
    });
  });

  it('returns the current database connection status', async () => {
    const expectedStatus = {
      connected: true,
      provider: 'supabase-postgres',
      database: 'postgres',
      schema: 'public',
    };

    analyticsRepository.getConnectionStatus.mockResolvedValue(expectedStatus);

    await expect(analyticsService.getConnectionStatus()).resolves.toEqual(
      expectedStatus,
    );
    expect(analyticsRepository.getConnectionStatus).toHaveBeenCalledTimes(1);
  });
});
