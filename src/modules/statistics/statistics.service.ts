import { Inject, Injectable } from '@nestjs/common';
import {
  I_STATISTICS_REPOSITORY,
  type IStatisticsRepository,
} from './repositories/statistics-repository.interface';
import { AdminStatisticsResponseDto } from './dto/responses/admin-statistics-response.dto';
import { AdminTrendsQueryDto } from './dto/queries/admin-trends-query.dto';
import { AdminTopStoresQueryDto } from './dto/queries/top-stores-query.dto';
import { AdminTopProductsQueryDto } from './dto/queries/top-products-query.dto';
import { DateRangeQueryDto } from './dto/queries/date-range-query.dto';
import { AdminTrendItemDto } from './dto/responses/admin-trends-response.dto';
import { TopStoreItemDto } from './dto/responses/top-stores-response.dto';
import { TopProductItemDto } from './dto/responses/top-products-response.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(I_STATISTICS_REPOSITORY)
    private readonly statisticsRepository: IStatisticsRepository,
  ) {}

  async getAdminStatistics(): Promise<AdminStatisticsResponseDto> {
    const [totalStores, totalUsers, totalOrders, totalRevenue] =
      await Promise.all([
        this.statisticsRepository.countStores(),
        this.statisticsRepository.countUsers(),
        this.statisticsRepository.countOrders(),
        this.statisticsRepository.sumCompletedRevenue(),
      ]);

    return {
      totalStores,
      totalUsers,
      totalOrders,
      totalRevenue,
    };
  }

  async getAdminTrends(
    query: AdminTrendsQueryDto,
  ): Promise<AdminTrendItemDto[]> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.statisticsRepository.getAdminTrends(
      query.range || 'day',
      startDate,
      endDate,
    );
  }

  async getTopStores(
    query: AdminTopStoresQueryDto,
  ): Promise<TopStoreItemDto[]> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.statisticsRepository.getTopStores(
      query.limit || 5,
      query.sortBy || 'revenue',
      startDate,
      endDate,
    );
  }

  async getTopProducts(
    query: AdminTopProductsQueryDto,
  ): Promise<TopProductItemDto[]> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.statisticsRepository.getTopProducts(
      query.limit || 5,
      startDate,
      endDate,
    );
  }

  async getOrderStatusDistribution(
    query: DateRangeQueryDto,
  ): Promise<Record<string, number>> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.statisticsRepository.getOrderStatusDistribution(
      startDate,
      endDate,
    );
  }
}
