import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';
import { QueryPublicProductDto } from './dto/query-public-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { StoreProductOwnershipGuard } from './guards/store-product-ownership.guard';

// ─── Shared fixtures ────────────────────────────────────────────────────────

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

const mockProduct: any = {
  id: 'product-1',
  storeId: 'store-1',
  categoryId: 'category-1',
  name: 'Milk Tea',
  description: null,
  price: 35000,
  imageUrl: null,
  status: ProductStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPaginatedResult = {
  items: [mockProduct],
  meta: { totalItems: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
};

// ─── Test suite ─────────────────────────────────────────────────────────────

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findPublicList: jest.fn(),
            findPublicOneOrThrow: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
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

  // ── GET /products/public ─────────────────────────────────────────────────

  describe('findPublic', () => {
    it('should delegate to service.findPublicList with the given query', async () => {
      const query: QueryPublicProductDto = {
        page: 1,
        limit: 10,
        storeId: 'store-1',
        categoryId: 'category-1',
      };
      service.findPublicList.mockResolvedValue(mockPaginatedResult as any);

      const result = await controller.findPublic(query);

      expect(service.findPublicList).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should work with an empty query (no filters)', async () => {
      const query: QueryPublicProductDto = {};
      service.findPublicList.mockResolvedValue(mockPaginatedResult as any);

      await controller.findPublic(query);

      expect(service.findPublicList).toHaveBeenCalledWith(query);
    });
  });

  // ── GET /products/public/:id ──────────────────────────────────────────────

  describe('findPublicOne', () => {
    it('should return the public product when found', async () => {
      service.findPublicOneOrThrow.mockResolvedValue(mockProduct);

      const result = await controller.findPublicOne('product-1');

      expect(service.findPublicOneOrThrow).toHaveBeenCalledWith('product-1');
      expect(result).toEqual(mockProduct);
    });

    it('should propagate NotFoundException when product is not found or not public', async () => {
      service.findPublicOneOrThrow.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.findPublicOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── GET /products ─────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should allow ADMIN to query with an explicit storeId', async () => {
      const query: QueryProductDto = { page: 1, limit: 10, storeId: 'store-2' };
      service.findAll.mockResolvedValue(mockPaginatedResult as any);

      const result = await controller.findAll(query, mockAdmin);

      // Admin storeId should NOT be overridden
      expect(query.storeId).toBe('store-2');
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should allow ADMIN to query without any storeId filter', async () => {
      const query: QueryProductDto = { page: 1, limit: 10 };
      service.findAll.mockResolvedValue(mockPaginatedResult as any);

      await controller.findAll(query, mockAdmin);

      expect(query.storeId).toBeUndefined();
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should force STAFF to filter by their own storeId, ignoring any request param', async () => {
      const query: QueryProductDto = { page: 1, limit: 10 };
      service.findAll.mockResolvedValue(mockPaginatedResult as any);

      await controller.findAll(query, mockStaff);

      expect(query.storeId).toBe('store-1');
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should throw BadRequestException if STAFF manually passes a storeId', async () => {
      const query: QueryProductDto = { page: 1, limit: 10, storeId: 'store-2' };

      await expect(controller.findAll(query, mockStaff)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if STAFF has no store assigned', async () => {
      const unassignedStaff: User = { ...mockStaff, storeId: null };
      const query: QueryProductDto = { page: 1, limit: 10 };

      await expect(controller.findAll(query, unassignedStaff)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  // ── GET /products/:id ─────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the product when found', async () => {
      service.findById.mockResolvedValue(mockProduct);

      const result = await controller.findOne('product-1');

      expect(service.findById).toHaveBeenCalledWith('product-1');
      expect(result).toEqual(mockProduct);
    });

    it('should propagate NotFoundException when product does not exist', async () => {
      service.findById.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── POST /products ────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateProductDto = {
      categoryId: 'category-1',
      name: 'Milk Tea',
      price: 35000,
    };

    it('should pass the staff storeId and DTO to service.create', async () => {
      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(mockStaff, dto);

      expect(service.create).toHaveBeenCalledWith('store-1', dto);
      expect(result).toEqual(mockProduct);
    });

    it('should propagate NotFoundException when category does not belong to the store', async () => {
      service.create.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(controller.create(mockStaff, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ForbiddenException when staff has no assigned store', async () => {
      service.create.mockRejectedValue(
        new ForbiddenException('Staff member has no assigned store'),
      );

      await expect(controller.create(mockStaff, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── PATCH /products/:id ───────────────────────────────────────────────────

  describe('update', () => {
    const dto: UpdateProductDto = { status: ProductStatus.HIDDEN };

    it('should pass the staff storeId, productId, and DTO to service.update', async () => {
      const updated = { ...mockProduct, status: ProductStatus.HIDDEN };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(mockStaff, 'product-1', dto);

      expect(service.update).toHaveBeenCalledWith('store-1', 'product-1', dto);
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when product is not found', async () => {
      service.update.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        controller.update(mockStaff, 'non-existent', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException when DTO is empty', async () => {
      service.update.mockRejectedValue(
        new BadRequestException('At least one product field is required'),
      );

      await expect(
        controller.update(mockStaff, 'product-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate ForbiddenException when staff has no assigned store', async () => {
      service.update.mockRejectedValue(
        new ForbiddenException('Staff member has no assigned store'),
      );

      await expect(
        controller.update(mockStaff, 'product-1', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
