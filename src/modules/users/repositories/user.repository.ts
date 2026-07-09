import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/common/enums/role.enum';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { IUserRepository, StaffListOptions } from './user-repository.interface';

const STAFF_SORTABLE_FIELDS: Record<string, string> = {
  email: 'user.email',
  fullName: 'user.fullName',
  createdAt: 'user.createdAt',
  updatedAt: 'user.updatedAt',
};
const DEFAULT_SORT_FIELD = 'user.createdAt';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly typeOrmRepository: Repository<User>,
  ) {}

  async findStaffAndCount(
    options: StaffListOptions,
  ): Promise<[User[], number]> {
    const { skip, take, sortBy, sortOrder, filter } = options;
    const qb = this.typeOrmRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.STAFF });

    if (filter.search) {
      qb.andWhere('(user.email ILIKE :search OR user.fullName ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.storeId) {
      qb.andWhere('user.storeId = :storeId', { storeId: filter.storeId });
    }

    if (filter.isBanned !== undefined) {
      qb.andWhere('user.isBanned = :isBanned', {
        isBanned: filter.isBanned,
      });
    }

    const orderField = STAFF_SORTABLE_FIELDS[sortBy] ?? DEFAULT_SORT_FIELD;
    qb.orderBy(orderField, sortOrder).skip(skip).take(take);

    return qb.getManyAndCount();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.typeOrmRepository.findOne({ where: { email } });
  }

  async findStaffById(id: string): Promise<User | null> {
    return this.typeOrmRepository.findOne({
      where: { id, role: UserRole.STAFF },
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.typeOrmRepository.create(data);
    return this.typeOrmRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.typeOrmRepository.update(id, data);
    return this.findStaffById(id);
  }
}
