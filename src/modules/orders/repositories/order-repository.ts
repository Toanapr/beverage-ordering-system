import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Repository } from 'typeorm';
import { IOrderRepository } from './order-repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly typeOrmRepository: Repository<Order>,
  ) {}

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return this.typeOrmRepository.findOne({ where: { orderCode } });
  }
}
