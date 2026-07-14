import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
      findAndCount: jest.fn(),
      getStaffStatistics: jest.fn(),
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

  describe('findStaffOrders', () => {
    it('should throw ForbiddenException if staff has no assigned store', async () => {
      await expect(
        service.findStaffOrders({ storeId: null } as any, {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call repository findAndCount with correct parameters and filter by storeId and status', async () => {
      const mockStaff = { storeId: 'store-1' } as any;
      (orderRepository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const query = { page: 2, limit: 5, status: OrderStatus.COMPLETED } as any;
      const result = await service.findStaffOrders(mockStaff, query);

      expect(orderRepository.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        filter: {
          storeId: 'store-1',
          status: OrderStatus.COMPLETED,
        },
      });
      expect(result.items).toEqual([]);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
    });
  });

  describe('findStaffOrderStatistics', () => {
    it('should request all-time statistics for the assigned store', async () => {
      (orderRepository.getStaffStatistics as jest.Mock).mockResolvedValue({
        totalOrders: 4,
        completedOrders: 2,
        cancelledOrders: 1,
        completedRevenue: 150000,
      });

      await expect(
        service.findStaffOrderStatistics({ storeId: 'store-1' } as any, {}),
      ).resolves.toEqual({
        totalOrders: 4,
        completedOrders: 2,
        cancelledOrders: 1,
        completedRevenue: 150000,
      });
      expect(orderRepository.getStaffStatistics).toHaveBeenCalledWith({
        storeId: 'store-1',
        from: undefined,
        to: undefined,
      });
    });

    it('should normalize date boundaries to Asia/Ho_Chi_Minh', async () => {
      (orderRepository.getStaffStatistics as jest.Mock).mockResolvedValue({});

      await service.findStaffOrderStatistics({ storeId: 'store-1' } as any, {
        from: '2026-07-01',
        to: '2026-07-31',
      });

      expect(orderRepository.getStaffStatistics).toHaveBeenCalledWith({
        storeId: 'store-1',
        from: new Date('2026-06-30T17:00:00.000Z'),
        to: new Date('2026-07-31T17:00:00.000Z'),
      });
    });

    it('should reject an unassigned staff member and invalid date ranges', async () => {
      await expect(
        service.findStaffOrderStatistics({ storeId: null } as any, {}),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.findStaffOrderStatistics({ storeId: 'store-1' } as any, {
          from: '2026-08-01',
          to: '2026-07-31',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.findStaffOrderStatistics({ storeId: 'store-1' } as any, {
          from: '2026-02-30',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findCustomerOrderHistory', () => {
    it('should paginate and filter orders by the authenticated customer and status', async () => {
      const createdAt = new Date('2026-07-14T00:00:00.000Z');
      const order = {
        id: 'order-1',
        orderCode: 'ORD001',
        storeId: 'store-1',
        subtotal: 100,
        totalAmount: 100,
        paymentMethod: PaymentMethod.COD,
        status: OrderStatus.COMPLETED,
        cancelReason: null,
        createdAt,
        updatedAt: createdAt,
        customerId: 'customer-1',
      } as any;
      (orderRepository.findAndCount as jest.Mock).mockResolvedValue([
        [order],
        1,
      ]);

      const result = await service.findCustomerOrderHistory('customer-1', {
        page: 2,
        limit: 5,
        status: OrderStatus.COMPLETED,
      });

      expect(orderRepository.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        filter: {
          customerId: 'customer-1',
          status: OrderStatus.COMPLETED,
        },
      });
      expect(result.items).toEqual([
        expect.objectContaining({ id: 'order-1', orderCode: 'ORD001' }),
      ]);
      expect(result.items[0]).not.toHaveProperty('customerId');
      expect(result.meta).toEqual(
        expect.objectContaining({ page: 2, limit: 5, totalItems: 1 }),
      );
    });
  });

  describe('findCustomerOrderDetail', () => {
    it('should return an order with items for its owning customer', async () => {
      const order = {
        id: 'order-1',
        customerId: 'customer-1',
        items: [{ id: 'item-1', productId: 'product-1', quantity: 1 }],
      } as any;
      (orderRepository.findById as jest.Mock).mockResolvedValue(order);

      await expect(
        service.findCustomerOrderDetail('order-1', 'customer-1'),
      ).resolves.toEqual(order);
      expect(orderRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('should throw NotFoundException if the order does not exist', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findCustomerOrderDetail('missing', 'customer-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the order belongs to another customer', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 'order-1',
        customerId: 'other-customer',
        items: [],
      });

      await expect(
        service.findCustomerOrderDetail('order-1', 'customer-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelStaffOrder', () => {
    const staff = { storeId: 'store-1' } as any;

    it.each([OrderStatus.PENDING, OrderStatus.PREPARING])(
      'should cancel a %s order and save its reason',
      async (status) => {
        const order = {
          id: 'order-1',
          storeId: 'store-1',
          status,
          cancelReason: null,
        } as any;
        (orderRepository.findById as jest.Mock).mockResolvedValue(order);
        (orderRepository.save as jest.Mock).mockImplementation((value) =>
          Promise.resolve(value),
        );

        const result = await service.cancelStaffOrder('order-1', staff, {
          cancelReason: 'Store cannot fulfill this order',
        });

        expect(result).toEqual(
          expect.objectContaining({
            status: OrderStatus.CANCELLED,
            cancelReason: 'Store cannot fulfill this order',
          }),
        );
        expect(orderRepository.save).toHaveBeenCalledWith(order);
      },
    );

    it('should reject staff without an assigned store', async () => {
      await expect(
        service.cancelStaffOrder('order-1', { storeId: null } as any, {
          cancelReason: 'Reason',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject a missing or another-store order', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        service.cancelStaffOrder('missing', staff, { cancelReason: 'Reason' }),
      ).rejects.toThrow(NotFoundException);

      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 'order-1',
        storeId: 'other-store',
      });
      await expect(
        service.cancelStaffOrder('order-1', staff, { cancelReason: 'Reason' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it.each([OrderStatus.COMPLETED, OrderStatus.CANCELLED])(
      'should reject cancelling a %s order',
      async (status) => {
        (orderRepository.findById as jest.Mock).mockResolvedValue({
          id: 'order-1',
          storeId: 'store-1',
          status,
        });

        await expect(
          service.cancelStaffOrder('order-1', staff, {
            cancelReason: 'Reason',
          }),
        ).rejects.toThrow(BadRequestException);
      },
    );
  });

  describe('findStaffOrderDetail', () => {
    it('should throw ForbiddenException if staff has no assigned store', async () => {
      await expect(
        service.findStaffOrderDetail('order-1', { storeId: null } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findStaffOrderDetail('order-1', { storeId: 'store-1' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to a different store', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 'order-1',
        storeId: 'other-store',
      });

      await expect(
        service.findStaffOrderDetail('order-1', { storeId: 'store-1' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return order details if order belongs to staff store', async () => {
      const order = { id: 'order-1', storeId: 'store-1', items: [] };
      (orderRepository.findById as jest.Mock).mockResolvedValue(order);

      const result = await service.findStaffOrderDetail('order-1', {
        storeId: 'store-1',
      } as any);

      expect(result).toEqual(order);
    });
  });

  describe('findAdminOrders', () => {
    it('should call repository findAndCount with correct filters and pagination options', async () => {
      (orderRepository.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const query = {
        page: 3,
        limit: 10,
        status: OrderStatus.COMPLETED,
        storeId: 'store-123',
        customerId: 'customer-456',
      } as any;

      const result = await service.findAdminOrders(query);

      expect(orderRepository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        filter: {
          storeId: 'store-123',
          customerId: 'customer-456',
          status: OrderStatus.COMPLETED,
        },
      });
      expect(result.items).toEqual([]);
      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('findAdminOrderDetail', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findAdminOrderDetail('order-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return order details if order exists', async () => {
      const order = { id: 'order-1', items: [] };
      (orderRepository.findById as jest.Mock).mockResolvedValue(order);

      const result = await service.findAdminOrderDetail('order-1');
      expect(result).toEqual(order);
    });
  });

  describe('updateStaffOrderStatus', () => {
    const staff = { storeId: 'store-1' } as any;

    it('should throw ForbiddenException if staff has no assigned store', async () => {
      await expect(
        service.updateStaffOrderStatus('order-1', { storeId: null } as any, {
          status: OrderStatus.PREPARING,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStaffOrderStatus('order-1', staff, {
          status: OrderStatus.PREPARING,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to a different store', async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 'order-1',
        storeId: 'other-store',
      });

      await expect(
        service.updateStaffOrderStatus('order-1', staff, {
          status: OrderStatus.PREPARING,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it.each([
      [OrderStatus.PENDING, OrderStatus.COMPLETED],
      [OrderStatus.PREPARING, OrderStatus.PENDING],
      [OrderStatus.COMPLETED, OrderStatus.PREPARING],
      [OrderStatus.CANCELLED, OrderStatus.PENDING],
    ])(
      'should reject the invalid transition %s -> %s',
      async (currentStatus, nextStatus) => {
        (orderRepository.findById as jest.Mock).mockResolvedValue({
          id: 'order-1',
          storeId: 'store-1',
          status: currentStatus,
        });

        await expect(
          service.updateStaffOrderStatus('order-1', staff, {
            status: nextStatus,
          }),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('should successfully update status from PENDING to PREPARING', async () => {
      const order = {
        id: 'order-1',
        storeId: 'store-1',
        status: OrderStatus.PENDING,
      };
      (orderRepository.findById as jest.Mock).mockResolvedValue(order);
      (orderRepository.save as jest.Mock).mockImplementation((o) =>
        Promise.resolve(o),
      );

      const result = await service.updateStaffOrderStatus('order-1', staff, {
        status: OrderStatus.PREPARING,
      });

      expect(result.status).toBe(OrderStatus.PREPARING);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });

    it('should successfully update status from PREPARING to COMPLETED', async () => {
      const order = {
        id: 'order-1',
        storeId: 'store-1',
        status: OrderStatus.PREPARING,
      };
      (orderRepository.findById as jest.Mock).mockResolvedValue(order);
      (orderRepository.save as jest.Mock).mockImplementation((o) =>
        Promise.resolve(o),
      );

      const result = await service.updateStaffOrderStatus('order-1', staff, {
        status: OrderStatus.COMPLETED,
      });

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(orderRepository.save).toHaveBeenCalledWith(order);
    });
  });
});
