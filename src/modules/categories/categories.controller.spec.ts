import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: jest.Mocked<CategoriesService>;

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

  const mockCategory = {
    id: 'category-1',
    storeId: 'store-1',
    name: 'Beverage',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call categoriesService.create and return the result', async () => {
      const dto: CreateCategoryDto = { name: 'Beverage' };
      service.create.mockResolvedValue(mockCategory as any);

      const result = await controller.create(mockStaff, dto);

      expect(service.create).toHaveBeenCalledWith('store-1', dto);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should call categoriesService.findAll and return the result', async () => {
      const query: QueryCategoryDto = { page: 1, limit: 10 };
      const paginatedResult = {
        items: [mockCategory],
        meta: { totalItems: 1 },
      };
      service.findAll.mockResolvedValue(paginatedResult as any);

      const result = await controller.findAll(mockStaff, query);

      expect(service.findAll).toHaveBeenCalledWith('store-1', query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('update', () => {
    it('should call categoriesService.update and return the result', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated Beverage' };
      const updatedCategory = { ...mockCategory, name: 'Updated Beverage' };
      service.update.mockResolvedValue(updatedCategory as any);

      const result = await controller.update(mockStaff, 'category-1', dto);

      expect(service.update).toHaveBeenCalledWith('store-1', 'category-1', dto);
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('remove', () => {
    it('should call categoriesService.remove and return the result', async () => {
      service.remove.mockResolvedValue(mockCategory as any);

      const result = await controller.remove(mockStaff, 'category-1');

      expect(service.remove).toHaveBeenCalledWith('store-1', 'category-1');
      expect(result).toEqual(mockCategory);
    });
  });
});
