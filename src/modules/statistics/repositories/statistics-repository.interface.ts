import { AdminTrendItemDto } from '../dto/responses/admin-trends-response.dto';
import { TopStoreItemDto } from '../dto/responses/top-stores-response.dto';
import { TopProductItemDto } from '../dto/responses/top-products-response.dto';

export interface IStatisticsRepository {
  countStores(): Promise<number>;
  countUsers(): Promise<number>;
  countOrders(): Promise<number>;
  sumCompletedRevenue(): Promise<number>;
  getAdminTrends(
    range: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AdminTrendItemDto[]>;
  getTopStores(
    limit: number,
    sortBy: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopStoreItemDto[]>;
  getTopProducts(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopProductItemDto[]>;
  getOrderStatusDistribution(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>>;
}

export const I_STATISTICS_REPOSITORY = Symbol('I_STATISTICS_REPOSITORY');
