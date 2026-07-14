import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import {
  I_PRODUCT_REPOSITORY,
  IProductRepository,
} from './repositories/product-repository.interface';
import { Product } from './entities/product.entity';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { Category } from '../categories/entities/category.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<IProductRepository>;
  let categoryRepository: { findOne: jest.Mock };

  const mockProduct: Product = {
    id: 'product-1',
    storeId: 'store-1',
    categoryId: 'category-1',
    name: 'Matcha Milk Tea',
    description: 'Matcha latte size M',
    price: 35000,
    imageUrl: null,
    status: ProductStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: null as any,
    category: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: I_PRODUCT_REPOSITORY,
          useValue: {
            findAndCount: jest.fn(),
            findById: jest.fn(),
            findByIdAndStoreId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    repository = module.get(I_PRODUCT_REPOSITORY);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return paginated products successfully', async () => {
      repository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        storeId: 'store-1',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          filter: expect.objectContaining({
            storeId: 'store-1',
          }),
        }),
      );
      expect(result.items).toEqual([mockProduct]);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return the product if found', async () => {
      repository.findById.mockResolvedValue(mockProduct);

      const result = await service.findById('product-1');

      expect(repository.findById).toHaveBeenCalledWith('product-1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product is not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('product-invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a product in the staff assigned store', async () => {
      categoryRepository.findOne.mockResolvedValue({ id: 'category-1' });
      repository.create.mockResolvedValue(mockProduct);

      const result = await service.create('store-1', {
        categoryId: 'category-1',
        name: 'Matcha Milk Tea',
        price: 35000,
      });

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-1', storeId: 'store-1' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        storeId: 'store-1',
        categoryId: 'category-1',
        name: 'Matcha Milk Tea',
        description: null,
        price: 35000,
        status: ProductStatus.ACTIVE,
      });
      expect(result).toEqual(mockProduct);
    });

    it('should reject staff without an assigned store', async () => {
      await expect(
        service.create(null, {
          categoryId: 'category-1',
          name: 'Matcha Milk Tea',
          price: 35000,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject a category outside the assigned store', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('store-1', {
          categoryId: 'category-2',
          name: 'Matcha Milk Tea',
          price: 35000,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product in the staff assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue({ ...mockProduct, price: 0 });

      const result = await service.update('store-1', 'product-1', {
        price: 0,
      });

      expect(repository.findByIdAndStoreId).toHaveBeenCalledWith(
        'product-1',
        'store-1',
      );
      expect(repository.update).toHaveBeenCalledWith('product-1', { price: 0 });
      expect(result.price).toBe(0);
    });

    it('should update only the product status without changing other fields', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue({
        ...mockProduct,
        status: ProductStatus.OUT_OF_STOCK,
      });

      const result = await service.update('store-1', 'product-1', {
        status: ProductStatus.OUT_OF_STOCK,
      });

      expect(repository.update).toHaveBeenCalledWith('product-1', {
        status: ProductStatus.OUT_OF_STOCK,
      });
      expect(result).toMatchObject({
        name: mockProduct.name,
        price: mockProduct.price,
        categoryId: mockProduct.categoryId,
        status: ProductStatus.OUT_OF_STOCK,
      });
    });

    it('should reject an empty update payload', async () => {
      await expect(service.update('store-1', 'product-1', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findByIdAndStoreId).not.toHaveBeenCalled();
    });

    it('should reject a product outside the assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(null);

      await expect(
        service.update('store-1', 'product-2', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject changing to a category outside the assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockProduct);
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('store-1', 'product-1', { categoryId: 'category-2' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
