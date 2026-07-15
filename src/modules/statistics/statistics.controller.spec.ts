import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { AdminTrendsQueryDto } from './dto/queries/admin-trends-query.dto';
import { AdminTopStoresQueryDto } from './dto/queries/top-stores-query.dto';
import { AdminTopProductsQueryDto } from './dto/queries/top-products-query.dto';
import { DateRangeQueryDto } from './dto/queries/date-range-query.dto';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let service: jest.Mocked<StatisticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatisticsService,
          useValue: {
            getAdminStatistics: jest.fn(),
            getAdminTrends: jest.fn(),
            getTopStores: jest.fn(),
            getTopProducts: jest.fn(),
            getOrderStatusDistribution: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
    service = module.get(StatisticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminStatistics', () => {
    it('should call statisticsService.getAdminStatistics and return the result', async () => {
      const statsMock = {
        totalRevenue: 1000000,
        totalOrders: 100,
        activeStores: 5,
        totalCustomers: 50,
      };
      service.getAdminStatistics.mockResolvedValue(statsMock as any);

      const result = await controller.getAdminStatistics();

      expect(service.getAdminStatistics).toHaveBeenCalled();
      expect(result).toEqual(statsMock);
    });
  });

  describe('getAdminTrends', () => {
    it('should call statisticsService.getAdminTrends and return the result', async () => {
      const query: AdminTrendsQueryDto = { interval: 'day' } as any;
      const trendsMock = [
        { date: '2026-07-15', revenue: 500000, ordersCount: 50 },
      ];
      service.getAdminTrends.mockResolvedValue(trendsMock);

      const result = await controller.getAdminTrends(query);

      expect(service.getAdminTrends).toHaveBeenCalledWith(query);
      expect(result).toEqual(trendsMock);
    });
  });

  describe('getTopStores', () => {
    it('should call statisticsService.getTopStores and return the result', async () => {
      const query: AdminTopStoresQueryDto = { limit: 5 };
      const topStoresMock = [
        {
          storeId: 'store-1',
          name: 'Store A',
          totalRevenue: 800000,
          ordersCount: 80,
        },
      ];
      service.getTopStores.mockResolvedValue(topStoresMock as any);

      const result = await controller.getTopStores(query);

      expect(service.getTopStores).toHaveBeenCalledWith(query);
      expect(result).toEqual(topStoresMock);
    });
  });

  describe('getTopProducts', () => {
    it('should call statisticsService.getTopProducts and return the result', async () => {
      const query: AdminTopProductsQueryDto = { limit: 5 };
      const topProductsMock = [
        {
          productId: 'product-1',
          name: 'Coffee',
          quantitySold: 120,
          totalRevenue: 4200000,
        },
      ];
      service.getTopProducts.mockResolvedValue(topProductsMock as any);

      const result = await controller.getTopProducts(query);

      expect(service.getTopProducts).toHaveBeenCalledWith(query);
      expect(result).toEqual(topProductsMock);
    });
  });

  describe('getOrderStatusDistribution', () => {
    it('should call statisticsService.getOrderStatusDistribution and return the result', async () => {
      const query: DateRangeQueryDto = {};
      const statusDistMock = { PENDING: 10, COMPLETED: 80, CANCELLED: 10 };
      service.getOrderStatusDistribution.mockResolvedValue(statusDistMock);

      const result = await controller.getOrderStatusDistribution(query);

      expect(service.getOrderStatusDistribution).toHaveBeenCalledWith(query);
      expect(result).toEqual(statusDistMock);
    });
  });
});
