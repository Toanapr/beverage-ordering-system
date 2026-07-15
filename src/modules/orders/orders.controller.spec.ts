import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryAdminOrderDto } from './dto/query-admin-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryStaffOrderStatisticsDto } from './dto/query-staff-order-statistics.dto';
import { OrderStatus } from 'src/common/enums/order-status.enum';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: jest.Mocked<OrdersService>;

  const mockCustomer: User = {
    id: 'customer-1',
    email: 'customer@example.com',
    passwordHash: 'hashed',
    role: UserRole.CUSTOMER,
    storeId: null,
    fullName: 'Customer User',
    avatarUrl: '',
    dob: new Date(),
    gender: 'Male',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: null,
  };

  const mockStaff: User = {
    id: 'staff-1',
    email: 'staff@example.com',
    passwordHash: 'hashed',
    role: UserRole.STAFF,
    storeId: 'store-1',
    fullName: 'Staff User',
    avatarUrl: '',
    dob: new Date(),
    gender: 'Male',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: null,
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'customer-1',
    storeId: 'store-1',
    totalPrice: 100000,
    status: OrderStatus.PENDING,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            create: jest.fn(),
            cancel: jest.fn(),
            cancelStaffOrder: jest.fn(),
            findCustomerOrderHistory: jest.fn(),
            findStaffOrders: jest.fn(),
            findStaffOrderStatistics: jest.fn(),
            findStaffOrderDetail: jest.fn(),
            findAdminOrders: jest.fn(),
            findAdminOrderDetail: jest.fn(),
            findCustomerOrderDetail: jest.fn(),
            updateStaffOrderStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call ordersService.create and return the result', async () => {
      const dto: CreateOrderDto = {
        storeId: 'store-1',
        receiverName: 'John Doe',
        receiverPhone: '0901234567',
        deliveryAddress: '123 Main Street',
        items: [{ productId: 'product-1', quantity: 2 }],
      };
      service.create.mockResolvedValue(mockOrder as any);

      const result = await controller.create(mockCustomer, dto);

      expect(service.create).toHaveBeenCalledWith('customer-1', dto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('cancel', () => {
    it('should call ordersService.cancel and return the result', async () => {
      const dto: CancelOrderDto = { cancelReason: 'Changed mind' };
      service.cancel.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      } as any);

      const result = await controller.cancel('order-1', mockCustomer, dto);

      expect(service.cancel).toHaveBeenCalledWith('order-1', 'customer-1', dto);
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('cancelStaffOrder', () => {
    it('should call ordersService.cancelStaffOrder and return the result', async () => {
      const dto: CancelOrderDto = { cancelReason: 'Out of stock' };
      service.cancelStaffOrder.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      } as any);

      const result = await controller.cancelStaffOrder(
        'order-1',
        mockStaff,
        dto,
      );

      expect(service.cancelStaffOrder).toHaveBeenCalledWith(
        'order-1',
        mockStaff,
        dto,
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('findCustomerOrderHistory', () => {
    it('should call ordersService.findCustomerOrderHistory and return the result', async () => {
      const query: QueryOrderDto = { page: 1, limit: 10 };
      const paginatedResult = { items: [mockOrder], meta: { totalItems: 1 } };
      service.findCustomerOrderHistory.mockResolvedValue(
        paginatedResult as any,
      );

      const result = await controller.findCustomerOrderHistory(
        mockCustomer,
        query,
      );

      expect(service.findCustomerOrderHistory).toHaveBeenCalledWith(
        'customer-1',
        query,
      );
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findStaffOrders', () => {
    it('should call ordersService.findStaffOrders and return the result', async () => {
      const query: QueryOrderDto = { page: 1, limit: 10 };
      const paginatedResult = { items: [mockOrder], meta: { totalItems: 1 } };
      service.findStaffOrders.mockResolvedValue(paginatedResult as any);

      const result = await controller.findStaffOrders(mockStaff, query);

      expect(service.findStaffOrders).toHaveBeenCalledWith(mockStaff, query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findStaffOrderStatistics', () => {
    it('should call ordersService.findStaffOrderStatistics and return the result', async () => {
      const query: QueryStaffOrderStatisticsDto = {};
      const statsResult = { totalOrders: 10, totalRevenue: 500000 };
      service.findStaffOrderStatistics.mockResolvedValue(statsResult as any);

      const result = await controller.findStaffOrderStatistics(
        mockStaff,
        query,
      );

      expect(service.findStaffOrderStatistics).toHaveBeenCalledWith(
        mockStaff,
        query,
      );
      expect(result).toEqual(statsResult);
    });
  });

  describe('findStaffOrderDetail', () => {
    it('should call ordersService.findStaffOrderDetail and return the result', async () => {
      service.findStaffOrderDetail.mockResolvedValue(mockOrder as any);

      const result = await controller.findStaffOrderDetail(
        'order-1',
        mockStaff,
      );

      expect(service.findStaffOrderDetail).toHaveBeenCalledWith(
        'order-1',
        mockStaff,
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAdminOrders', () => {
    it('should call ordersService.findAdminOrders and return the result', async () => {
      const query: QueryAdminOrderDto = { page: 1, limit: 10 };
      const paginatedResult = { items: [mockOrder], meta: { totalItems: 1 } };
      service.findAdminOrders.mockResolvedValue(paginatedResult as any);

      const result = await controller.findAdminOrders(query);

      expect(service.findAdminOrders).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findAdminOrderDetail', () => {
    it('should call ordersService.findAdminOrderDetail and return the result', async () => {
      service.findAdminOrderDetail.mockResolvedValue(mockOrder as any);

      const result = await controller.findAdminOrderDetail('order-1');

      expect(service.findAdminOrderDetail).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findCustomerOrderDetail', () => {
    it('should call ordersService.findCustomerOrderDetail and return the result', async () => {
      service.findCustomerOrderDetail.mockResolvedValue(mockOrder as any);

      const result = await controller.findCustomerOrderDetail(
        'order-1',
        mockCustomer,
      );

      expect(service.findCustomerOrderDetail).toHaveBeenCalledWith(
        'order-1',
        'customer-1',
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateStaffOrderStatus', () => {
    it('should call ordersService.updateStaffOrderStatus and return the result', async () => {
      const dto: UpdateOrderStatusDto = { status: OrderStatus.PREPARING };
      service.updateStaffOrderStatus.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PREPARING,
      } as any);

      const result = await controller.updateStaffOrderStatus(
        'order-1',
        mockStaff,
        dto,
      );

      expect(service.updateStaffOrderStatus).toHaveBeenCalledWith(
        'order-1',
        mockStaff,
        dto,
      );
      expect(result.status).toBe(OrderStatus.PREPARING);
    });
  });
});
