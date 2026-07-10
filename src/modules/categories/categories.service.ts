import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { getOffset, paginate } from 'src/common/utils/pagination.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import {
  I_CATEGORY_REPOSITORY,
  type ICategoryRepository,
} from './repositories/category-repository.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(I_CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async create(
    storeId: string | null,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    const assignedStoreId = this.getAssignedStoreId(storeId);
    const existing = await this.categoryRepository.findByNameAndStoreId(
      dto.name,
      assignedStoreId,
    );
    if (existing) {
      throw new ConflictException('Category name already exists in this store');
    }

    return this.categoryRepository.create({
      storeId: assignedStoreId,
      name: dto.name,
    });
  }

  async findAll(
    storeId: string | null,
    query: QueryCategoryDto,
  ): Promise<PaginatedResponseDto<Category>> {
    const assignedStoreId = this.getAssignedStoreId(storeId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, totalItems] = await this.categoryRepository.findAndCount({
      skip: getOffset(page, limit),
      take: limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: (query.sortOrder as SortOrder) ?? SortOrder.DESC,
      filter: {
        storeId: assignedStoreId,
        search: query.search,
      },
    });

    return paginate(items, page, limit, totalItems);
  }

  async update(
    storeId: string | null,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const assignedStoreId = this.getAssignedStoreId(storeId);
    const category = await this.findByIdAndStoreId(id, assignedStoreId);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepository.findByNameAndStoreId(
        dto.name,
        assignedStoreId,
      );
      if (existing) {
        throw new ConflictException(
          'Category name already exists in this store',
        );
      }
    }

    return (await this.categoryRepository.update(id, dto)) as Category;
  }

  async remove(storeId: string | null, id: string): Promise<Category> {
    const assignedStoreId = this.getAssignedStoreId(storeId);
    const category = await this.findByIdAndStoreId(id, assignedStoreId);

    if (await this.categoryRepository.hasProducts(id)) {
      throw new ConflictException(
        'Cannot delete a category that contains products',
      );
    }

    await this.categoryRepository.delete(id);
    return category;
  }

  private getAssignedStoreId(storeId: string | null): string {
    if (!storeId) {
      throw new ForbiddenException('Staff member has no assigned store');
    }
    return storeId;
  }

  private async findByIdAndStoreId(
    id: string,
    storeId: string,
  ): Promise<Category> {
    const category = await this.categoryRepository.findByIdAndStoreId(
      id,
      storeId,
    );
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
