import { ProductStatus } from 'src/common/enums/product-status.enum';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { Product } from '../entities/product.entity';

export interface ProductListFilter {
  storeId?: string;
  search?: string;
  status?: ProductStatus;
}

export interface ProductListOptions {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: SortOrder;
  filter: ProductListFilter;
}

export interface PublicProductListFilter {
  storeId?: string;
  categoryId?: string;
  search?: string;
}

export interface PublicProductListOptions {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: SortOrder;
  filter: PublicProductListFilter;
}

export const I_PRODUCT_REPOSITORY = 'I_PRODUCT_REPOSITORY';

export interface IProductRepository {
  findAndCount(options: ProductListOptions): Promise<[Product[], number]>;
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findPublicAndCount(
    options: PublicProductListOptions,
  ): Promise<[Product[], number]>;
  findPublicById(id: string): Promise<Product | null>;
}
