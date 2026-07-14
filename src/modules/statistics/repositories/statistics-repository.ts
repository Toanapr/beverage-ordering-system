import { Injectable } from '@nestjs/common';
import { IStatisticsRepository } from './statistics-repository.interface';
import { DataSource } from 'typeorm';
import { Store } from 'src/modules/stores/entities/store.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { OrderItem } from 'src/modules/orders/entities/order-item.entity';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { AdminTrendItemDto } from '../dto/responses/admin-trends-response.dto';
import { TopStoreItemDto } from '../dto/responses/top-stores-response.dto';
import { TopProductItemDto } from '../dto/responses/top-products-response.dto';

@Injectable()
export class StatisticsRepository implements IStatisticsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async countStores(): Promise<number> {
    return this.dataSource.getRepository(Store).count();
  }

  async countUsers(): Promise<number> {
    return this.dataSource.getRepository(User).count();
  }

  async countOrders(): Promise<number> {
    return this.dataSource.getRepository(Order).count();
  }

  async sumCompletedRevenue(): Promise<number> {
    const result = (await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'sum')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .getRawOne()) as unknown as { sum: string | number } | undefined;
    return Number(result?.sum || 0);
  }

  async getAdminTrends(
    range: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AdminTrendItemDto[]> {
    let dateTruncRange = 'day';
    if (['day', 'week', 'month', 'year'].includes(range)) {
      dateTruncRange = range;
    }

    const query = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .select(`DATE_TRUNC('${dateTruncRange}', order.createdAt)`, 'date')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .addSelect('COUNT(order.id)', 'ordersCount')
      .where('order.status = :status', { status: OrderStatus.COMPLETED });

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    query.groupBy('date').orderBy('date', 'ASC');

    const rawData = (await query.getRawMany()) as unknown as Array<{
      date: string | Date;
      revenue: string | number;
      ordersCount: string | number;
    }>;
    return rawData.map((item) => ({
      date: item.date,
      revenue: Number(item.revenue || 0),
      ordersCount: Number(item.ordersCount || 0),
    }));
  }

  async getTopStores(
    limit: number,
    sortBy: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopStoreItemDto[]> {
    const query = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .innerJoin('order.store', 'store')
      .select('store.id', 'storeId')
      .addSelect('store.name', 'storeName')
      .addSelect('store.ratingAvg', 'ratingAvg')
      .addSelect('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.status = :status', { status: OrderStatus.COMPLETED });

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    query
      .groupBy('store.id')
      .addGroupBy('store.name')
      .addGroupBy('store.ratingAvg');

    if (sortBy === 'orders') {
      query.orderBy('COUNT(order.id)', 'DESC');
    } else {
      query.orderBy('SUM(order.totalAmount)', 'DESC');
    }

    query.limit(limit);

    const rawData = (await query.getRawMany()) as unknown as Array<{
      storeId: string;
      storeName: string;
      ratingAvg: string | number;
      totalRevenue: string | number;
      totalOrders: string | number;
    }>;
    return rawData.map((item) => ({
      storeId: item.storeId,
      storeName: item.storeName,
      totalRevenue: Number(item.totalRevenue || 0),
      totalOrders: Number(item.totalOrders || 0),
      ratingAvg: Number(item.ratingAvg || 0),
    }));
  }

  async getTopProducts(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopProductItemDto[]> {
    const query = this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .innerJoin('order.store', 'store')
      .select('orderItem.productId', 'productId')
      .addSelect('orderItem.productName', 'productName')
      .addSelect('store.name', 'storeName')
      .addSelect('SUM(orderItem.quantity)', 'quantitySold')
      .addSelect('SUM(orderItem.lineTotal)', 'totalRevenue')
      .where('order.status = :status', { status: OrderStatus.COMPLETED });

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    query
      .groupBy('orderItem.productId')
      .addGroupBy('orderItem.productName')
      .addGroupBy('store.name')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(limit);

    const rawData = (await query.getRawMany()) as unknown as Array<{
      productId: string;
      productName: string;
      storeName: string;
      quantitySold: string | number;
      totalRevenue: string | number;
    }>;
    return rawData.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      storeName: item.storeName,
      quantitySold: Number(item.quantitySold || 0),
      totalRevenue: Number(item.totalRevenue || 0),
    }));
  }

  async getOrderStatusDistribution(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    const query = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count');

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.createdAt <= :endDate', { endDate });
    }

    query.groupBy('order.status');

    const rawData = (await query.getRawMany()) as unknown as Array<{
      status: string;
      count: string | number;
    }>;

    const distribution: Record<string, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PREPARING]: 0,
      [OrderStatus.COMPLETED]: 0,
      [OrderStatus.CANCELLED]: 0,
    };

    rawData.forEach((item) => {
      if (item.status in distribution) {
        distribution[item.status] = Number(item.count || 0);
      }
    });

    return distribution;
  }
}
