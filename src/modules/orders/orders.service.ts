import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  I_ORDER_REPOSITORY,
  type IOrderRepository,
} from './repositories/order-repository.interface';
import { StoresService } from '../stores/stores.service';
import { DataSource } from 'typeorm';
import { generateOrderCode } from 'src/common/utils/order-code.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Order } from './entities/order.entity';
import { OrderItemComputed } from './types/order-item-computed';
import { ProductsService } from '../products/products.service';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderItem } from './entities/order-item.entity';

const MAX_ORDER_CODE_RETRY = 5;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(I_ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly productsService: ProductsService,
    private readonly storesService: StoresService,
    private readonly dataSource: DataSource,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<Order> {
    await this.storesService.assertOrderable(dto.storeId);

    const { items, subtotal } = await this.buildOrderItems(dto);
    const totalAmount = subtotal;

    const orderCode = await this.generateUniqueOrderCode();

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        orderCode,
        customerId,
        storeId: dto.storeId,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        deliveryAddress: dto.deliveryAddress,
        subtotal,
        totalAmount,
        paymentMethod: PaymentMethod.COD,
        status: OrderStatus.PENDING,
      });
      const savedOrder = await manager.save(order);

      const itemEntities = items.map((item) =>
        manager.create(OrderItem, { ...item, orderId: savedOrder.id }),
      );
      savedOrder.items = await manager.save(itemEntities);
      return savedOrder;
    });
  }

  private async buildOrderItems(
    dto: CreateOrderDto,
  ): Promise<{ items: OrderItemComputed[]; subtotal: number }> {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productsService.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const items: OrderItemComputed[] = [];

    for (const requested of dto.items) {
      const product = productMap.get(requested.productId);

      if (!product) {
        throw new BadRequestException(
          `Product ${requested.productId} does not exist`,
        );
      }
      if (product.storeId !== dto.storeId) {
        throw new BadRequestException(
          `Product "${product.name}" does not belong to this store`,
        );
      }
      if (product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException(
          `Product "${product.name}" is currently unavailable`,
        );
      }

      const price = Number(product.price);
      const lineTotal = price * requested.quantity;
      subtotal += lineTotal;

      items.push({
        productId: product.id,
        productName: product.name,
        price,
        quantity: requested.quantity,
        lineTotal,
      });
    }

    return { items, subtotal };
  }

  private async generateUniqueOrderCode(): Promise<string> {
    for (let i = 0; i < MAX_ORDER_CODE_RETRY; i++) {
      const code = generateOrderCode();
      const existing = await this.orderRepository.findByOrderCode(code);
      if (!existing) return code;
    }
    throw new BadRequestException(
      'Could not generate unique order code, please try again',
    );
  }

  async cancel(
    orderId: string,
    customerId: string,
    dto: CancelOrderDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = dto.cancelReason;
    return this.orderRepository.save(order);
  }
}
