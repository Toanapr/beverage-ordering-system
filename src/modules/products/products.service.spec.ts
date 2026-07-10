import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  I_PRODUCT_REPOSITORY,
  IProductRepository,
} from './repositories/product-repository.interface';
import { Product } from './entities/product.entity';
import { ProductStatus } from 'src/common/enums/product-status.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<IProductRepository>;

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
          },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    repository = module.get(I_PRODUCT_REPOSITORY);
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
});
