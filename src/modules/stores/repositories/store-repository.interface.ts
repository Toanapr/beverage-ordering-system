import { SortOrder } from 'src/common/enums/sort-order.enum';
import { Store } from '../entities/store.entity';

export interface StoreListFilter {
  search?: string;
  isOpen?: boolean;
  isLocked?: boolean;
}

export interface StoreListOptions {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: SortOrder;
  filter: StoreListFilter;
}

export const I_STORE_REPOSITORY = 'I_STORE_REPOSITORY';

export interface IStoreRepository {
  findAndCount(options: StoreListOptions): Promise<[Store[], number]>;
  findById(id: string): Promise<Store | null>;
  findByName(name: string): Promise<Store | null>;
  create(data: Partial<Store>): Promise<Store>;
  update(id: string, data: Partial<Store>): Promise<Store | null>;
}
