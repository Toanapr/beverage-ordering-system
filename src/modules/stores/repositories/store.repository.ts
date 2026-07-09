import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from '../entities/store.entity';
import { Repository } from 'typeorm';
import {
  IStoreRepository,
  StoreListOptions,
} from './store-repository.interface';

const STORE_SORTABLE_FIELDS: Record<string, string> = {
  name: 'store.name',
  createdAt: 'store.createdAt',
  ratingAvg: 'store.ratingAvg',
  ratingCount: 'store.ratingCount',
};
const DEFAULT_SORT_FIELD = 'store.createdAt';

@Injectable()
export class StoreRepository implements IStoreRepository {
  constructor(
    @InjectRepository(Store)
    private readonly typeOrmRepository: Repository<Store>,
  ) {}

  async findAndCount(options: StoreListOptions): Promise<[Store[], number]> {
    const { skip, take, sortBy, sortOrder, filter } = options;
    const qb = this.typeOrmRepository.createQueryBuilder('store');

    if (filter.search) {
      qb.andWhere('store.name ILIKE :search', { search: `%${filter.search}%` });
    }

    if (filter.isOpen !== undefined) {
      qb.andWhere('store.isOpen = :isOpen', { isOpen: filter.isOpen });
    }

    if (filter.isLocked !== undefined) {
      qb.andWhere('store.isLocked = :isLocked', { isLocked: filter.isLocked });
    }

    const orderField = STORE_SORTABLE_FIELDS[sortBy] ?? DEFAULT_SORT_FIELD;
    qb.orderBy(orderField, sortOrder).skip(skip).take(take);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<Store | null> {
    return this.typeOrmRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Store | null> {
    return this.typeOrmRepository.findOne({ where: { name } });
  }

  async create(data: Partial<Store>): Promise<Store> {
    const store = this.typeOrmRepository.create(data);
    return this.typeOrmRepository.save(store);
  }

  async update(id: string, data: Partial<Store>): Promise<Store | null> {
    await this.typeOrmRepository.update(id, data);
    return this.findById(id);
  }
}
