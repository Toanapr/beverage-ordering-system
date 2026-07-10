import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  I_CATEGORY_REPOSITORY,
  ICategoryRepository,
} from './repositories/category-repository.interface';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<ICategoryRepository>;

  const mockCategory: Category = {
    id: 'category-1',
    storeId: 'store-1',
    name: 'Coffee',
    store: {} as Category['store'],
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: I_CATEGORY_REPOSITORY,
          useValue: {
            findAndCount: jest.fn(),
            findByIdAndStoreId: jest.fn(),
            findByNameAndStoreId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            hasProducts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
    repository = module.get(I_CATEGORY_REPOSITORY);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a category in the assigned store', async () => {
      repository.findByNameAndStoreId.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockCategory);

      await expect(
        service.create('store-1', { name: 'Coffee' }),
      ).resolves.toEqual(mockCategory);
      expect(repository.create).toHaveBeenCalledWith({
        storeId: 'store-1',
        name: 'Coffee',
      });
    });

    it('should reject duplicate names in the same store', async () => {
      repository.findByNameAndStoreId.mockResolvedValue(mockCategory);

      await expect(
        service.create('store-1', { name: 'Coffee' }),
      ).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should reject staff without an assigned store', async () => {
      await expect(service.create(null, { name: 'Coffee' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should list only categories in the assigned store', async () => {
      repository.findAndCount.mockResolvedValue([[mockCategory], 1]);

      const result = await service.findAll('store-1', {
        page: 2,
        limit: 5,
        search: 'Coff',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        filter: { storeId: 'store-1', search: 'Coff' },
      });
      expect(result.items).toEqual([mockCategory]);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a category in the assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockCategory);
      repository.findByNameAndStoreId.mockResolvedValue(null);
      repository.update.mockResolvedValue({ ...mockCategory, name: 'Tea' });

      const result = await service.update('store-1', 'category-1', {
        name: 'Tea',
      });

      expect(repository.update).toHaveBeenCalledWith('category-1', {
        name: 'Tea',
      });
      expect(result.name).toBe('Tea');
    });

    it('should reject a duplicate name in the assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockCategory);
      repository.findByNameAndStoreId.mockResolvedValue({
        ...mockCategory,
        id: 'category-2',
      });

      await expect(
        service.update('store-1', 'category-1', { name: 'Tea' }),
      ).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should return not found for a category outside the assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(null);

      await expect(
        service.update('store-1', 'category-2', { name: 'Tea' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an empty category in the assigned store', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockCategory);
      repository.hasProducts.mockResolvedValue(false);

      await expect(service.remove('store-1', 'category-1')).resolves.toEqual(
        mockCategory,
      );
      expect(repository.delete).toHaveBeenCalledWith('category-1');
    });

    it('should reject deleting a category that contains products', async () => {
      repository.findByIdAndStoreId.mockResolvedValue(mockCategory);
      repository.hasProducts.mockResolvedValue(true);

      await expect(service.remove('store-1', 'category-1')).rejects.toThrow(
        ConflictException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
