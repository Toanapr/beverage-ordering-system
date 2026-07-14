import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import {
  IOrderRepository,
  StaffOrderStatistics,
} from './order-repository.interface';
import { OrderStatus } from 'src/common/enums/order-status.enum';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly typeOrmRepository: Repository<Order>,
  ) {}

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return this.typeOrmRepository.findOne({
      where: { orderCode },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.typeOrmRepository.findOne({
      where: { id },
      relations: { items: true },
    });
  }

  async save(order: Order): Promise<Order> {
    return this.typeOrmRepository.save(order);
  }

  async findAndCount(options: {
    skip: number;
    take: number;
    filter: {
      customerId?: string;
      storeId?: string;
      status?: OrderStatus;
    };
  }): Promise<[Order[], number]> {
    const where: FindOptionsWhere<Order> = {};

    if (options.filter.customerId) {
      where.customerId = options.filter.customerId;
    }

    if (options.filter.storeId) {
      where.storeId = options.filter.storeId;
    }

    if (options.filter.status) {
      where.status = options.filter.status;
    }

    const order: FindOptionsOrder<Order> = {
      createdAt: 'DESC',
    };

    return this.typeOrmRepository.findAndCount({
      skip: options.skip,
      take: options.take,
      where,
      order,
    });
  }

  async getStaffStatistics(options: {
    storeId: string;
    from?: Date;
    to?: Date;
  }): Promise<StaffOrderStatistics> {
    const qb = this.typeOrmRepository.createQueryBuilder('order');
    qb.select('COUNT(order.id)', 'totalOrders')
      .addSelect(
        'COUNT(order.id) FILTER (WHERE order.status = :completedStatus)',
        'completedOrders',
      )
      .addSelect(
        'COUNT(order.id) FILTER (WHERE order.status = :cancelledStatus)',
        'cancelledOrders',
      )
      .addSelect(
        'COALESCE(SUM(order.totalAmount) FILTER (WHERE order.status = :completedStatus), 0)',
        'completedRevenue',
      )
      .where('order.storeId = :storeId', { storeId: options.storeId })
      .setParameters({
        completedStatus: OrderStatus.COMPLETED,
        cancelledStatus: OrderStatus.CANCELLED,
      });

    if (options.from) {
      qb.andWhere('order.createdAt >= :from', { from: options.from });
    }
    if (options.to) {
      qb.andWhere('order.createdAt < :to', { to: options.to });
    }

    const raw = await qb.getRawOne<StaffOrderStatistics>();
    return {
      totalOrders: Number(raw?.totalOrders ?? 0),
      completedOrders: Number(raw?.completedOrders ?? 0),
      cancelledOrders: Number(raw?.cancelledOrders ?? 0),
      completedRevenue: Number(raw?.completedRevenue ?? 0),
    };
  }
}
