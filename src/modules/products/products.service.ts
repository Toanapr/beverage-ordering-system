import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  I_PRODUCT_REPOSITORY,
  type IProductRepository,
} from './repositories/product-repository.interface';
import { QueryProductDto } from './dto/query-product.dto';
import { QueryPublicProductDto } from './dto/query-public-product.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Product } from './entities/product.entity';
import { getOffset, paginate } from 'src/common/utils/pagination.util';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../categories/entities/category.entity';
import { Repository } from 'typeorm';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(I_PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    storeId: string | null,
    dto: CreateProductDto,
  ): Promise<Product> {
    const assignedStoreId = this.getAssignedStoreId(storeId);
    await this.assertCategoryInStore(dto.categoryId, assignedStoreId);

    return this.productRepository.create({
      storeId: assignedStoreId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      imageUrl: dto.imageUrl ?? null,
      status: dto.status ?? ProductStatus.ACTIVE,
    });
  }

  async update(
    storeId: string | null,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const assignedStoreId = this.getAssignedStoreId(storeId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one product field is required');
    }

    const product = await this.productRepository.findByIdAndStoreId(
      productId,
      assignedStoreId,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId) {
      await this.assertCategoryInStore(dto.categoryId, assignedStoreId);
    }

    const updatedProduct = await this.productRepository.update(product.id, dto);
    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return updatedProduct;
  }

  async findAll(
    query: QueryProductDto,
    user: User,
  ): Promise<PaginatedResponseDto<Product>> {
    if (user.role === UserRole.STAFF) {
      if (query.storeId) {
        throw new BadRequestException(
          'Staff is not allowed to provide storeId manually',
        );
      }
      if (!user.storeId) {
        throw new ForbiddenException(
          'Staff member has not been assigned to any store',
        );
      }
      query.storeId = user.storeId;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = getOffset(page, limit);

    const [items, totalItems] = await this.productRepository.findAndCount({
      skip,
      take: limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: (query.sortOrder as SortOrder) ?? SortOrder.DESC,
      filter: {
        storeId: query.storeId,
        search: query.search,
        status: query.status,
      },
    });

    return paginate(items, page, limit, totalItems);
  }

  async findById(productId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByIds(productIds: string[]): Promise<Product[]> {
    return this.productRepository.findByIds(productIds);
  }

  async findPublicList(
    query: QueryPublicProductDto,
  ): Promise<PaginatedResponseDto<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = getOffset(page, limit);

    const [items, totalItems] = await this.productRepository.findPublicAndCount(
      {
        skip,
        take: limit,
        sortBy: query.sortBy ?? 'createdAt',
        sortOrder: (query.sortOrder as SortOrder) ?? SortOrder.DESC,
        filter: {
          storeId: query.storeId,
          categoryId: query.categoryId,
          search: query.search,
        },
      },
    );

    return paginate(items, page, limit, totalItems);
  }

  async findPublicOneOrThrow(productId: string): Promise<Product> {
    const product = await this.productRepository.findPublicById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private getAssignedStoreId(storeId: string | null): string {
    if (!storeId) {
      throw new ForbiddenException('Staff member has no assigned store');
    }
    return storeId;
  }

  private async assertCategoryInStore(
    categoryId: string,
    storeId: string,
  ): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, storeId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }
}
