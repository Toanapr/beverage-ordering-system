import { Injectable } from '@nestjs/common';
import {
  IProductRepository,
  ProductListOptions,
  PublicProductListOptions,
} from './product-repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { In, Repository } from 'typeorm';
import { ProductStatus } from 'src/common/enums/product-status.enum';

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

  async findByIdAndStoreId(
    id: string,
    storeId: string,
  ): Promise<Product | null> {
    try {
      return await this.typeOrmRepository.findOne({ where: { id, storeId } });
    } catch {
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    try {
      if (!ids || ids.length === 0) return [];
      return await this.typeOrmRepository.findBy({ id: In(ids) });
    } catch {
      return [];
    }
  }

  async findPublicAndCount(
    options: PublicProductListOptions,
  ): Promise<[Product[], number]> {
    const { skip, take, sortBy, sortOrder, filter } = options;
    const qb = this.typeOrmRepository.createQueryBuilder('product');

    qb.innerJoin('product.store', 'store');
    qb.andWhere('store.isOpen = :isOpen', { isOpen: true });
    qb.andWhere('store.isLocked = :isLocked', { isLocked: false });
    qb.andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    if (filter.storeId) {
      qb.andWhere('product.storeId = :storeId', { storeId: filter.storeId });
    }

    if (filter.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.search) {
      qb.andWhere('product.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    const orderField = PRODUCT_SORTABLE_FIELDS[sortBy] ?? DEFAULT_SORT_FIELD;
    qb.orderBy(orderField, sortOrder).skip(skip).take(take);

    return qb.getManyAndCount();
  }

  async findPublicById(id: string): Promise<Product | null> {
    try {
      const qb = this.typeOrmRepository.createQueryBuilder('product');
      qb.innerJoin('product.store', 'store');
      qb.where('product.id = :id', { id });
      qb.andWhere('product.status = :status', { status: ProductStatus.ACTIVE });
      qb.andWhere('store.isOpen = :isOpen', { isOpen: true });
      qb.andWhere('store.isLocked = :isLocked', { isLocked: false });
      return await qb.getOne();
    } catch {
      return null;
    }
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.typeOrmRepository.create(data);
    return this.typeOrmRepository.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    await this.typeOrmRepository.update(id, data);
    return this.findById(id);
  }
}
