import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { I_STATISTICS_REPOSITORY } from './repositories/statistics-repository.interface';
import { TrendRange } from './dto/queries/admin-trends-query.dto';
import { TopStoresSortBy } from './dto/queries/top-stores-query.dto';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let repositoryMock: any;

  beforeEach(async () => {
    repositoryMock = {
      countStores: jest.fn(),
      countUsers: jest.fn(),
      countOrders: jest.fn(),
      sumCompletedRevenue: jest.fn(),
      getAdminTrends: jest.fn(),
      getTopStores: jest.fn(),
      getTopProducts: jest.fn(),
      getOrderStatusDistribution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: I_STATISTICS_REPOSITORY,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminStatistics', () => {
    it('should aggregate count and revenue metrics', async () => {
      repositoryMock.countStores.mockResolvedValue(5);
      repositoryMock.countUsers.mockResolvedValue(10);
      repositoryMock.countOrders.mockResolvedValue(15);
      repositoryMock.sumCompletedRevenue.mockResolvedValue(50000);

      const result = await service.getAdminStatistics();

      expect(repositoryMock.countStores).toHaveBeenCalled();
      expect(repositoryMock.countUsers).toHaveBeenCalled();
      expect(repositoryMock.countOrders).toHaveBeenCalled();
      expect(repositoryMock.sumCompletedRevenue).toHaveBeenCalled();
      expect(result).toEqual({
        totalStores: 5,
        totalUsers: 10,
        totalOrders: 15,
        totalRevenue: 50000,
      });
    });
  });

  describe('getAdminTrends', () => {
    it('should forward parameters with parsed dates', async () => {
      const query = {
        range: TrendRange.WEEK,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-14T23:59:59.999Z',
      };
      const mockResult = [
        { date: '2026-07-01', revenue: 1000, ordersCount: 2 },
      ];
      repositoryMock.getAdminTrends.mockResolvedValue(mockResult);

      const result = await service.getAdminTrends(query);

      expect(repositoryMock.getAdminTrends).toHaveBeenCalledWith(
        TrendRange.WEEK,
        new Date(query.startDate),
        new Date(query.endDate),
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle missing optional range and date params', async () => {
      const query = {};
      repositoryMock.getAdminTrends.mockResolvedValue([]);

      const result = await service.getAdminTrends(query);

      expect(repositoryMock.getAdminTrends).toHaveBeenCalledWith(
        'day',
        undefined,
        undefined,
      );
      expect(result).toEqual([]);
    });
  });

  describe('getTopStores', () => {
    it('should forward parameters with parsed dates', async () => {
      const query = {
        limit: 10,
        sortBy: TopStoresSortBy.ORDERS,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-14T23:59:59.999Z',
      };
      const mockResult = [
        {
          storeId: 'store-1',
          storeName: 'Store 1',
          totalRevenue: 1000,
          totalOrders: 5,
          ratingAvg: 4.5,
        },
      ];
      repositoryMock.getTopStores.mockResolvedValue(mockResult);

      const result = await service.getTopStores(query);

      expect(repositoryMock.getTopStores).toHaveBeenCalledWith(
        10,
        TopStoresSortBy.ORDERS,
        new Date(query.startDate),
        new Date(query.endDate),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getTopProducts', () => {
    it('should forward parameters with parsed dates', async () => {
      const query = {
        limit: 3,
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-14T23:59:59.999Z',
      };
      const mockResult = [
        {
          productId: 'p-1',
          productName: 'P1',
          storeName: 'Store 1',
          quantitySold: 10,
          totalRevenue: 500,
        },
      ];
      repositoryMock.getTopProducts.mockResolvedValue(mockResult);

      const result = await service.getTopProducts(query);

      expect(repositoryMock.getTopProducts).toHaveBeenCalledWith(
        3,
        new Date(query.startDate),
        new Date(query.endDate),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getOrderStatusDistribution', () => {
    it('should forward parameters with parsed dates', async () => {
      const query = {
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-14T23:59:59.999Z',
      };
      const mockResult = { pending: 1, completed: 5 };
      repositoryMock.getOrderStatusDistribution.mockResolvedValue(mockResult);

      const result = await service.getOrderStatusDistribution(query);

      expect(repositoryMock.getOrderStatusDistribution).toHaveBeenCalledWith(
        new Date(query.startDate),
        new Date(query.endDate),
      );
      expect(result).toEqual(mockResult);
    });
  });
});
