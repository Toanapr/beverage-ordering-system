import { Injectable } from '@nestjs/common';
import {
  IProductRepository,
  ProductListOptions,
} from './product-repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Repository } from 'typeorm';

const PRODUCT_SORTABLE_FIELDS: Record<string, string> = {
  name: 'product.name',
  price: 'product.price',
  createdAt: 'product.createdAt',
};
const DEFAULT_SORT_FIELD = 'product.createdAt';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly typeOrmRepository: Repository<Product>,
  ) {}

  async findAndCount(
    options: ProductListOptions,
  ): Promise<[Product[], number]> {
    const { skip, take, sortBy, sortOrder, filter } = options;
    const qb = this.typeOrmRepository.createQueryBuilder('product');

    if (filter.storeId) {
      qb.andWhere('product.storeId = :storeId', { storeId: filter.storeId });
    }

    if (filter.search) {
      qb.andWhere('product.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.status) {
      qb.andWhere('product.status = :status', { status: filter.status });
    }

    const orderField = PRODUCT_SORTABLE_FIELDS[sortBy] ?? DEFAULT_SORT_FIELD;
    qb.orderBy(orderField, sortOrder).skip(skip).take(take);

    return qb.getManyAndCount();
  }

  async findById(id: string): Promise<Product | null> {
    try {
      return await this.typeOrmRepository.findOne({ where: { id } });
    } catch {
      return null;
    }
  }
}
