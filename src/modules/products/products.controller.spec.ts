import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { StoreProductOwnershipGuard } from './guards/store-product-ownership.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    passwordHash: 'hashed',
    role: UserRole.ADMIN,
    storeId: null,
    fullName: 'Admin User',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(StoreProductOwnershipGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProductsController);
    service = module.get(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should allow ADMIN to retrieve all products or filter by storeId', async () => {
      const query: QueryProductDto = { page: 1, limit: 10, storeId: 'store-2' };
      service.findAll.mockResolvedValue({ items: [], meta: {} } as any);

      await controller.findAll(query, mockAdmin);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should force STAFF to filter by their assigned storeId and ignore request param', async () => {
      const query: QueryProductDto = { page: 1, limit: 10 };
      service.findAll.mockResolvedValue({ items: [], meta: {} } as any);

      await controller.findAll(query, mockStaff);

      expect(query.storeId).toBe('store-1');
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should throw BadRequestException if STAFF passes a storeId in the query', async () => {
      const query: QueryProductDto = { page: 1, limit: 10, storeId: 'store-2' };

      await expect(controller.findAll(query, mockStaff)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if STAFF user does not have a storeId assigned', async () => {
      const query: QueryProductDto = { page: 1, limit: 10 };
      const staffWithoutStore = { ...mockStaff, storeId: null };

      await expect(
        controller.findAll(query, staffWithoutStore),
      ).rejects.toThrow(ForbiddenException);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      service.findById.mockResolvedValue({ id: 'product-1' } as any);

      const result = await controller.findOne('product-1');

      expect(service.findById).toHaveBeenCalledWith('product-1');
      expect(result).toEqual({ id: 'product-1' });
    });
  });
});
