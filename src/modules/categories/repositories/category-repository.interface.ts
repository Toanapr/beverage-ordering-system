import { SortOrder } from 'src/common/enums/sort-order.enum';
import { Category } from '../entities/category.entity';

export interface CategoryListFilter {
  storeId: string;
  search?: string;
}

export interface CategoryListOptions {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: SortOrder;
  filter: CategoryListFilter;
}

export const I_CATEGORY_REPOSITORY = 'I_CATEGORY_REPOSITORY';

export interface ICategoryRepository {
  findAndCount(options: CategoryListOptions): Promise<[Category[], number]>;
  findByIdAndStoreId(id: string, storeId: string): Promise<Category | null>;
  findByNameAndStoreId(name: string, storeId: string): Promise<Category | null>;
  create(data: Pick<Category, 'storeId' | 'name'>): Promise<Category>;
  update(
    id: string,
    data: Partial<Pick<Category, 'name'>>,
  ): Promise<Category | null>;
  delete(id: string): Promise<void>;
  hasProducts(id: string): Promise<boolean>;
}
