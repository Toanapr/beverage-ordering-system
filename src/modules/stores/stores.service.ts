import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  I_STORE_REPOSITORY,
  type IStoreRepository,
} from './repositories/store-repository.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { Store } from './entities/store.entity';
import { QueryStoreDto } from './dto/query-store.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { getOffset, paginate } from 'src/common/utils/pagination.util';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @Inject(I_STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async create(dto: CreateStoreDto): Promise<Store> {
    const existing = await this.storeRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Store name already exists');
    }

    return this.storeRepository.create({
      name: dto.name,
      phone: dto.phone,
      address: dto.address,
      isOpen: dto.isOpen ?? true,
    });
  }

  async findAll(query: QueryStoreDto): Promise<PaginatedResponseDto<Store>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = getOffset(page, limit);

    const [items, totalItems] = await this.storeRepository.findAndCount({
      skip,
      take: limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: (query.sortOrder as SortOrder) ?? SortOrder.DESC,
      filter: {
        search: query.search,
        isOpen: query.isOpen,
        isLocked: query.isLocked,
      },
    });

    return paginate(items, page, limit, totalItems);
  }

  async findPublicList(
    query: QueryStoreDto,
  ): Promise<PaginatedResponseDto<Store>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = getOffset(page, limit);

    const [items, totalItems] = await this.storeRepository.findAndCount({
      skip,
      take: limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: (query.sortOrder as SortOrder) ?? SortOrder.DESC,
      filter: {
        search: query.search,
        isOpen: true,
        isLocked: false,
      },
    });

    return paginate(items, page, limit, totalItems);
  }

  async findOneOrThrow(id: string): Promise<Store> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async findAssignedStore(storeId: string | null): Promise<Store> {
    if (!storeId) {
      throw new ForbiddenException('Staff member has no assigned store');
    }

    return this.findOneOrThrow(storeId);
  }

  async findPublicOneOrThrow(id: string): Promise<Store> {
    const store = await this.findOneOrThrow(id);
    if (store.isLocked || !store.isOpen) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async update(id: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOneOrThrow(id);

    if (dto.name && dto.name !== store.name) {
      const existing = await this.storeRepository.findByName(dto.name);
      if (existing) {
        throw new ConflictException('Store name already exists');
      }
    }

    const updated = await this.storeRepository.update(id, dto);
    return updated as Store;
  }

  async updateAssignedStore(
    storeId: string | null,
    dto: UpdateStoreDto,
  ): Promise<Store> {
    if (!storeId) {
      throw new ForbiddenException('Staff member has no assigned store');
    }

    return this.update(storeId, dto);
  }

  async lock(id: string): Promise<Store> {
    const store = await this.findOneOrThrow(id);
    if (store.isLocked) return store;
    const updated = await this.storeRepository.update(id, { isLocked: true });
    return updated as Store;
  }

  async unlock(id: string): Promise<Store> {
    const store = await this.findOneOrThrow(id);
    if (!store.isLocked) return store;
    const updated = await this.storeRepository.update(id, { isLocked: false });
    return updated as Store;
  }

  async assertOrderable(id: string): Promise<Store> {
    const store = await this.findOneOrThrow(id);
    if (store.isLocked) {
      throw new ForbiddenException('Store is locked, cannot place order');
    }
    if (!store.isOpen) {
      throw new ForbiddenException(
        'Store is currently closed, cannot place order',
      );
    }
    return store;
  }
}
