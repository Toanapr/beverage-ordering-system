import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_PRODUCT_REPOSITORY,
  type IProductRepository,
} from './repositories/product-repository.interface';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Product } from './entities/product.entity';
import { getOffset, paginate } from 'src/common/utils/pagination.util';
import { SortOrder } from 'src/common/enums/sort-order.enum';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(I_PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async findAll(
    query: QueryProductDto,
  ): Promise<PaginatedResponseDto<Product>> {
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
}
