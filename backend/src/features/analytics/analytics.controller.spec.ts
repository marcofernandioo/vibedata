import { AnalyticsController } from './analytics.controller';

describe('AnalyticsController', () => {
  const analyticsService = {
    listSnapshots: jest.fn(),
    getConnectionStatus: jest.fn(),
  };

  let analyticsController: AnalyticsController;

  beforeEach(() => {
    analyticsService.listSnapshots.mockReset();
    analyticsService.getConnectionStatus.mockReset();
    analyticsController = new AnalyticsController(analyticsService as never);
  });

  it('delegates snapshot listing to the service', async () => {
    const query = { page: 1, pageSize: 10 };
    const expectedResponse = {
      data: [],
      meta: {
        total: 0,
        page: 1,
        pageSize: 10,
      },
    };

    analyticsService.listSnapshots.mockResolvedValue(expectedResponse);

    await expect(analyticsController.getSnapshots(query)).resolves.toEqual(
      expectedResponse,
    );
    expect(analyticsService.listSnapshots).toHaveBeenCalledWith(query);
  });

  it('delegates database health checks to the service', async () => {
    const expectedStatus = {
      connected: true,
      provider: 'supabase-postgres',
      database: 'postgres',
      schema: 'public',
    };

    analyticsService.getConnectionStatus.mockResolvedValue(expectedStatus);

    await expect(analyticsController.getConnectionStatus()).resolves.toEqual(
      expectedStatus,
    );
    expect(analyticsService.getConnectionStatus).toHaveBeenCalledTimes(1);
  });
});
