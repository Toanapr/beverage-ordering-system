import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { IOrderRepository } from './repositories/order-repository.interface';
import { StoresService } from '../stores/stores.service';
import { ProductsService } from '../products/products.service';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import * as orderCodeUtil from 'src/common/utils/order-code.util';

jest.mock('src/common/utils/order-code.util', () => ({
  generateOrderCode: jest.fn(),
}));

describe('OrdersService', () => {
  let service: OrdersService;

  let orderRepository: jest.Mocked<IOrderRepository>;
  let productsService: jest.Mocked<Partial<ProductsService>>;
  let storesService: jest.Mocked<Partial<StoresService>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  let managerMock: {
    create: jest.Mock;
    save: jest.Mock;
  };

  const baseDto: CreateOrderDto = {
    storeId: 'store-1',
    receiverName: 'John Doe',
    receiverPhone: '0901234567',
    deliveryAddress: '123 Main Street',
    items: [
      { productId: 'product-1', quantity: 2 },
      { productId: 'product-2', quantity: 1 },
    ],
  };

  const activeProduct1 = {
    id: 'product-1',
    name: 'Product 1',
    price: '100.00',
    storeId: 'store-1',
    status: ProductStatus.ACTIVE,
  };

  const activeProduct2 = {
    id: 'product-2',
    name: 'Product 2',
    price: '50.00',
    storeId: 'store-1',
    status: ProductStatus.ACTIVE,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    orderRepository = {
      findById: jest.fn(),
      findByOrderCode: jest.fn().mockResolvedValue(null),
      save: jest.fn((order) => Promise.resolve(order)),
    };

    productsService = {
      findByIds: jest.fn(),
    };

    storesService = {
      assertOrderable: jest.fn(),
    };

    managerMock = {
      create: jest.fn((entity, data) => data),
      save: jest.fn((data) => {
        if (Array.isArray(data)) {
          return Promise.resolve(
            data.map((item, idx) => ({ id: `item-${idx}`, ...item })),
          );
        }
        return Promise.resolve({ id: 'order-1', ...data });
      }),
    };

    dataSource = {
      transaction: jest.fn(async (cb: any) => await cb(managerMock)),
    };

    service = new OrdersService(
      orderRepository,
      productsService as ProductsService,
      storesService as StoresService,
      dataSource as DataSource,
    );

    (orderCodeUtil.generateOrderCode as jest.Mock).mockReturnValue('ORD001');
  });

  describe('create', () => {
    it('should create an order successfully with correct subtotal and total amount', async () => {
      (storesService.assertOrderable as jest.Mock).mockResolvedValue(undefined);
      (productsService.findByIds as jest.Mock).mockResolvedValue([
        activeProduct1,
        activeProduct2,
      ]);
      (orderRepository.findByOrderCode as jest.Mock).mockResolvedValue(null);

      const result = await service.create('customer-1', baseDto);

      expect(storesService.assertOrderable).toHaveBeenCalledWith(
        baseDto.storeId,
      );
      expect(productsService.findByIds).toHaveBeenCalledWith([
        'product-1',
        'product-2',
      ]);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);

      // subtotal = 100*2 + 50*1 = 250
      expect(managerMock.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderCode: 'ORD001',
          customerId: 'customer-1',
          storeId: baseDto.storeId,
          subtotal: 250,
          totalAmount: 250,
          paymentMethod: PaymentMethod.COD,
          status: OrderStatus.PENDING,
        }),
      );

      expect(result.id).toBe('order-1');
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        productId: 'product-1',
        productName: 'Product 1',
        price: 100,
        quantity: 2,
        lineTotal: 200,
      });
      expect(result.items[1]).toMatchObject({
        productId: 'product-2',
        productName: 'Product 2',
        price: 50,
        quantity: 1,
        lineTotal: 50,
      });
    });

    it('should throw if store is not orderable', async () => {
      (storesService.assertOrderable as jest.Mock).mockRejectedValue(
        new BadRequestException('Store is currently closed'),
      );

      await expect(service.create('customer-1', baseDto)).rejects.toThrow(
        'Store is currently closed',
      );

      expect(productsService.findByIds).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if a product does not exist', async () => {
      (storesService.assertOrderable as jest.Mock).mockResolvedValue(undefined);
      // Chỉ trả về product-1, thiếu product-2
      (productsService.findByIds as jest.Mock).mockResolvedValue([
        activeProduct1,
      ]);

      await expect(service.create('customer-1', baseDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create('customer-1', baseDto)).rejects.toThrow(
        'Product product-2 does not exist',
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if product does not belong to the store', async () => {
      (storesService.assertOrderable as jest.Mock).mockResolvedValue(undefined);
      (productsService.findByIds as jest.Mock).mockResolvedValue([
        { ...activeProduct1, storeId: 'other-store' },
        activeProduct2,
      ]);

      await expect(service.create('customer-1', baseDto)).rejects.toThrow(
        'Product "Product 1" does not belong to this store',
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if product is not active', async () => {
      (storesService.assertOrderable as jest.Mock).mockResolvedValue(undefined);
      (productsService.findByIds as jest.Mock).mockResolvedValue([
        { ...activeProduct1, status: ProductStatus.OUT_OF_STOCK },
        activeProduct2,
      ]);

      await expect(service.create('customer-1', baseDto)).rejects.toThrow(
        'Product "Product 1" is currently unavailable',
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should retry generating order code if a collision occurs, then succeed', async () => {
      (storesService.assertOrderable as jest.Mock).mockResolvedValue(undefined);
      (productsService.findByIds as jest.Mock).mockResolvedValue([
        activeProduct1,
        activeProduct2,
      ]);

      (orderCodeUtil.generateOrderCode as jest.Mock)
        .mockReturnValueOnce('DUPLICATE1')
        .mockReturnValueOnce('UNIQUE001');

      (orderRepository.findByOrderCode as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-order' })
        .mockResolvedValueOnce(null);

      const result = await service.create('customer-1', baseDto);

      expect(orderCodeUtil.generateOrderCode).toHaveBeenCalledTimes(2);
      expect(orderRepository.findByOrderCode).toHaveBeenCalledTimes(2);
      expect(managerMock.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ orderCode: 'UNIQUE001' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw if unable to generate a unique order code after max retries', async () => {
      (storesService.assertOrderable as jest.Mock).mockResolvedValue(undefined);
      (productsService.findByIds as jest.Mock).mockResolvedValue([
        activeProduct1,
        activeProduct2,
      ]);

      (orderRepository.findByOrderCode as jest.Mock).mockResolvedValue({
        id: 'existing-order',
      });

      await expect(service.create('customer-1', baseDto)).rejects.toThrow(
        'Could not generate unique order code, please try again',
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.cancel('order-1', 'customer-1', { cancelReason: 'No need' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order belongs to a different customer', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 'order-1',
        customerId: 'other-customer',
        status: OrderStatus.PENDING,
      });

      await expect(
        service.cancel('order-1', 'customer-1', { cancelReason: 'No need' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is not in pending status', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 'order-1',
        customerId: 'customer-1',
        status: OrderStatus.PREPARING,
      });

      await expect(
        service.cancel('order-1', 'customer-1', { cancelReason: 'No need' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully cancel a pending order and update status and reason', async () => {
      const order = {
        id: 'order-1',
        customerId: 'customer-1',
        status: OrderStatus.PENDING,
        cancelReason: null,
      };
      (orderRepository.findById as jest.Mock).mockResolvedValue(order);

      const result = await service.cancel('order-1', 'customer-1', {
        cancelReason: 'Changed mind',
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelReason).toBe('Changed mind');
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'order-1',
          status: OrderStatus.CANCELLED,
          cancelReason: 'Changed mind',
        }),
      );
    });
  });
});
