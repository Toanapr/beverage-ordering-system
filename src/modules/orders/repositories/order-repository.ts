import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { IOrderRepository } from './order-repository.interface';
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
}
