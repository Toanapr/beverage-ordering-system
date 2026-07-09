import { SortOrder } from 'src/common/enums/sort-order.enum';
import { UserRole } from 'src/common/enums/role.enum';
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

export interface UserListFilter {
  search?: string;
  role?: UserRole;
  isBanned?: boolean;
}

export interface UserListOptions {
  skip: number;
  take: number;
  sortBy: string;
  sortOrder: SortOrder;
  filter: UserListFilter;
}

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  findStaffAndCount(options: StaffListOptions): Promise<[User[], number]>;
  findUsersAndCount(options: UserListOptions): Promise<[User[], number]>;
  findByEmail(email: string): Promise<User | null>;
  findStaffById(id: string): Promise<User | null>;
  findLockableById(id: string): Promise<User | null>;
  create(data: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  updateById(id: string, data: Partial<User>): Promise<User | null>;
}
