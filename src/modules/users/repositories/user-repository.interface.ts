import { SortOrder } from 'src/common/enums/sort-order.enum';
import { User } from '../entities/user.entity';

export interface StaffListFilter {
  search?: string;
  storeId?: string;
  isBanned?: boolean;
}

export interface StaffListOptions {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: SortOrder;
  filter: StaffListFilter;
}

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  findStaffAndCount(options: StaffListOptions): Promise<[User[], number]>;
  findByEmail(email: string): Promise<User | null>;
  findStaffById(id: string): Promise<User | null>;
  create(data: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}
