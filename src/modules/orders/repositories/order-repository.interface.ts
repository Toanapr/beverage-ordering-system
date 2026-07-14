import { OrderStatus } from 'src/common/enums/order-status.enum';
import { Order } from '../entities/order.entity';

export const I_ORDER_REPOSITORY = 'I_ORDER_REPOSITORY';

export interface StaffOrderStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  completedRevenue: number;
}

export interface IOrderRepository {
  findByOrderCode(orderCode: string): Promise<Order | null>;
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  findAndCount(options: {
    skip: number;
    take: number;
    filter: {
      customerId?: string;
      storeId?: string;
      status?: OrderStatus;
    };
  }): Promise<[Order[], number]>;
  getStaffStatistics(options: {
    storeId: string;
    from?: Date;
    to?: Date;
  }): Promise<StaffOrderStatistics>;
}
