import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UserRole } from 'src/common/enums/role.enum';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { getOffset, paginate } from 'src/common/utils/pagination.util';
import {
  I_REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../auth/repositories/refresh-token-repository.interface';
import { StoresService } from '../stores/stores.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { User } from './entities/user.entity';
import {
  I_USER_REPOSITORY,
  type IUserRepository,
} from './repositories/user-repository.interface';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly userRepository: IUserRepository,

    @Inject(I_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,

    private readonly storesService: StoresService,
  ) {}

  async createStaff(dto: CreateStaffDto): Promise<SafeUser> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    await this.storesService.findOneOrThrow(dto.storeId);

    const passwordHash = await bcrypt.hash(
      dto.password,
      await bcrypt.genSalt(),
    );
    const staff = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      storeId: dto.storeId,
      role: UserRole.STAFF,
      isBanned: false,
    });

    return this.toSafeUser(staff);
  }

  async findStaff(
    query: QueryStaffDto,
  ): Promise<PaginatedResponseDto<SafeUser>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = getOffset(page, limit);

    const [items, totalItems] = await this.userRepository.findStaffAndCount({
      skip,
      take: limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? SortOrder.DESC,
      filter: {
        search: query.search,
        storeId: query.storeId,
        isBanned: query.isBanned,
      },
    });

    return paginate(
      items.map((item) => this.toSafeUser(item)),
      page,
      limit,
      totalItems,
    );
  }

  async lockStaff(id: string): Promise<SafeUser> {
    const staff = await this.findStaffByIdOrThrow(id);
    if (staff.isBanned) return this.toSafeUser(staff);

    const updated = await this.userRepository.update(id, { isBanned: true });
    await this.refreshTokenRepository.revokeAllByUserId(id);
    return this.toSafeUser(updated as User);
  }

  async unlockStaff(id: string): Promise<SafeUser> {
    const staff = await this.findStaffByIdOrThrow(id);
    if (!staff.isBanned) return this.toSafeUser(staff);

    const updated = await this.userRepository.update(id, { isBanned: false });
    return this.toSafeUser(updated as User);
  }

  private async findStaffByIdOrThrow(id: string): Promise<User> {
    const staff = await this.userRepository.findStaffById(id);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }
    return staff;
  }

  private toSafeUser(user: User): SafeUser {
    const { passwordHash: ignoredPasswordHash, ...safeUser } = user;
    void ignoredPasswordHash;
    return safeUser;
  }
}
