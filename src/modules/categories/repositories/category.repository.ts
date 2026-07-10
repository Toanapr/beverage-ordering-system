import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import {
  CategoryListOptions,
  ICategoryRepository,
} from './category-repository.interface';

const CATEGORY_SORTABLE_FIELDS: Record<string, string> = {
  name: 'category.name',
  createdAt: 'category.createdAt',
};
const DEFAULT_SORT_FIELD = 'category.createdAt';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly typeOrmRepository: Repository<Category>,
  ) {}

  async findAndCount(
    options: CategoryListOptions,
  ): Promise<[Category[], number]> {
    const { skip, take, sortBy, sortOrder, filter } = options;
    const qb = this.typeOrmRepository.createQueryBuilder('category');

    qb.where('category.storeId = :storeId', { storeId: filter.storeId });

    if (filter.search) {
      qb.andWhere('category.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    const orderField = CATEGORY_SORTABLE_FIELDS[sortBy] ?? DEFAULT_SORT_FIELD;
    qb.orderBy(orderField, sortOrder).skip(skip).take(take);

    return qb.getManyAndCount();
  }

  async findByIdAndStoreId(
    id: string,
    storeId: string,
  ): Promise<Category | null> {
    return this.typeOrmRepository.findOne({ where: { id, storeId } });
  }

  async findByNameAndStoreId(
    name: string,
    storeId: string,
  ): Promise<Category | null> {
    return this.typeOrmRepository.findOne({ where: { name, storeId } });
  }

  async create(data: Pick<Category, 'storeId' | 'name'>): Promise<Category> {
    const category = this.typeOrmRepository.create(data);
    return this.typeOrmRepository.save(category);
  }

  async update(
    id: string,
    data: Partial<Pick<Category, 'name'>>,
  ): Promise<Category | null> {
    await this.typeOrmRepository.update(id, data);
    return this.typeOrmRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.typeOrmRepository.delete(id);
  }

  async hasProducts(id: string): Promise<boolean> {
    const count = await this.typeOrmRepository
      .createQueryBuilder('category')
      .innerJoin('category.products', 'product')
      .where('category.id = :id', { id })
      .getCount();

    return count > 0;
  }
}
