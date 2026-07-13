import { Order } from "../entities/order.entity";

export const I_ORDER_REPOSITORY = 'I_ORDER_REPOSITORY';

export interface IOrderRepository {
    findByOrderCode(orderCode: string): Promise<Order | null>;
}
