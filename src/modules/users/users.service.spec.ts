import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/role.enum';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import {
  I_REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../auth/repositories/refresh-token-repository.interface';
import { StoresService } from '../stores/stores.service';
import { Store } from '../stores/entities/store.entity';
import { User } from './entities/user.entity';
import {
  I_USER_REPOSITORY,
  type IUserRepository,
} from './repositories/user-repository.interface';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<IUserRepository>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let storesService: jest.Mocked<Pick<StoresService, 'findOneOrThrow'>>;

  const mockStore: Store = {
    id: 'store-1',
    name: 'Test Store',
    phone: '0901234567',
    address: '123 Test St',
    isOpen: true,
    isLocked: false,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    staffs: [],
    categories: [],
    products: [],
  };

  const mockStaff: User = {
    id: 'staff-1',
    email: 'staff@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.STAFF,
    storeId: mockStore.id,
    store: mockStore,
    fullName: 'Staff Member',
    avatarUrl: null as unknown as string,
    dob: null as unknown as Date,
    gender: null as unknown as string,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer: User = {
    ...mockStaff,
    id: 'customer-1',
    email: 'customer@example.com',
    role: UserRole.CUSTOMER,
    storeId: null,
    store: null,
    fullName: 'Customer User',
  };

  const mockAdmin: User = {
    ...mockStaff,
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    storeId: null,
    store: null,
    fullName: 'Admin User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: I_USER_REPOSITORY,
          useValue: {
            findStaffAndCount: jest.fn(),
            findUsersAndCount: jest.fn(),
            findByEmail: jest.fn(),
            findStaffById: jest.fn(),
            findLockableById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateById: jest.fn(),
          },
        },
        {
          provide: I_REFRESH_TOKEN_REPOSITORY,
          useValue: {
            revokeAllByUserId: jest.fn(),
          },
        },
        {
          provide: StoresService,
          useValue: {
            findOneOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepository = module.get(I_USER_REPOSITORY);
    refreshTokenRepository = module.get(I_REFRESH_TOKEN_REPOSITORY);
    storesService = module.get(StoresService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createStaff', () => {
    it('should create a staff user with a hashed password and store assignment', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      storesService.findOneOrThrow.mockResolvedValue(mockStore);
      userRepository.create.mockImplementation((data) =>
        Promise.resolve({
          ...mockStaff,
          ...data,
        }),
      );

      const result = await service.createStaff({
        email: 'staff@example.com',
        password: 'password123',
        fullName: 'Staff Member',
        storeId: mockStore.id,
      });

      expect(storesService.findOneOrThrow).toHaveBeenCalledWith(mockStore.id);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'staff@example.com',
          fullName: 'Staff Member',
          storeId: mockStore.id,
          role: UserRole.STAFF,
          isBanned: false,
        }),
      );

      const createdData = userRepository.create.mock.calls[0][0];
      expect(
        await bcrypt.compare('password123', createdData.passwordHash as string),
      ).toBe(true);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.role).toBe(UserRole.STAFF);
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockStaff);

      await expect(
        service.createStaff({
          email: 'staff@example.com',
          password: 'password123',
          fullName: 'Staff Member',
          storeId: mockStore.id,
        }),
      ).rejects.toThrow(ConflictException);

      expect(storesService.findOneOrThrow).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the store does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      storesService.findOneOrThrow.mockRejectedValue(
        new NotFoundException('Store not found'),
      );

      await expect(
        service.createStaff({
          email: 'staff@example.com',
          password: 'password123',
          fullName: 'Staff Member',
          storeId: 'missing-store',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findStaff', () => {
    it('should list staff with pagination, search, and filters', async () => {
      userRepository.findStaffAndCount.mockResolvedValue([[mockStaff], 1]);

      const result = await service.findStaff({
        page: 2,
        limit: 5,
        search: 'staff',
        storeId: mockStore.id,
        isBanned: false,
        sortBy: 'email',
        sortOrder: SortOrder.ASC,
      });

      expect(userRepository.findStaffAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        sortBy: 'email',
        sortOrder: SortOrder.ASC,
        filter: {
          search: 'staff',
          storeId: mockStore.id,
          isBanned: false,
        },
      });
      expect(result.items).toEqual([
        expect.not.objectContaining({ passwordHash: expect.anything() }),
      ]);
      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });
  });

  describe('findUsers', () => {
    it('should list all user roles with pagination, search, and filters', async () => {
      userRepository.findUsersAndCount.mockResolvedValue([
        [mockCustomer, mockStaff, mockAdmin],
        3,
      ]);

      const result = await service.findUsers({
        page: 1,
        limit: 10,
        search: 'user',
        role: UserRole.CUSTOMER,
        isBanned: false,
        sortBy: 'fullName',
        sortOrder: SortOrder.ASC,
      });

      expect(userRepository.findUsersAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        sortBy: 'fullName',
        sortOrder: SortOrder.ASC,
        filter: {
          search: 'user',
          role: UserRole.CUSTOMER,
          isBanned: false,
        },
      });
      expect(result.items).toHaveLength(3);
      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.not.objectContaining({ passwordHash: expect.anything() }),
        ]),
      );
      expect(result.meta.totalItems).toBe(3);
    });
  });

  describe('lockStaff', () => {
    it('should lock staff and revoke refresh tokens', async () => {
      userRepository.findStaffById.mockResolvedValue(mockStaff);
      userRepository.update.mockResolvedValue({ ...mockStaff, isBanned: true });

      const result = await service.lockStaff(mockStaff.id);

      expect(userRepository.update).toHaveBeenCalledWith(mockStaff.id, {
        isBanned: true,
      });
      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
        mockStaff.id,
      );
      expect(result.isBanned).toBe(true);
    });

    it('should be idempotent when staff is already locked', async () => {
      userRepository.findStaffById.mockResolvedValue({
        ...mockStaff,
        isBanned: true,
      });

      const result = await service.lockStaff(mockStaff.id);

      expect(userRepository.update).not.toHaveBeenCalled();
      expect(refreshTokenRepository.revokeAllByUserId).not.toHaveBeenCalled();
      expect(result.isBanned).toBe(true);
    });

    it('should throw NotFoundException for non-staff or missing users', async () => {
      userRepository.findStaffById.mockResolvedValue(null);

      await expect(service.lockStaff('customer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unlockStaff', () => {
    it('should unlock staff', async () => {
      userRepository.findStaffById.mockResolvedValue({
        ...mockStaff,
        isBanned: true,
      });
      userRepository.update.mockResolvedValue({
        ...mockStaff,
        isBanned: false,
      });

      const result = await service.unlockStaff(mockStaff.id);

      expect(userRepository.update).toHaveBeenCalledWith(mockStaff.id, {
        isBanned: false,
      });
      expect(result.isBanned).toBe(false);
    });

    it('should be idempotent when staff is already unlocked', async () => {
      userRepository.findStaffById.mockResolvedValue(mockStaff);

      const result = await service.unlockStaff(mockStaff.id);

      expect(userRepository.update).not.toHaveBeenCalled();
      expect(result.isBanned).toBe(false);
    });
  });

  describe('lockUser', () => {
    it('should lock a customer and revoke refresh tokens', async () => {
      userRepository.findLockableById.mockResolvedValue(mockCustomer);
      userRepository.updateById.mockResolvedValue({
        ...mockCustomer,
        isBanned: true,
      });

      const result = await service.lockUser(mockCustomer.id);

      expect(userRepository.updateById).toHaveBeenCalledWith(mockCustomer.id, {
        isBanned: true,
      });
      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
        mockCustomer.id,
      );
      expect(result.isBanned).toBe(true);
    });

    it('should be idempotent when user is already locked', async () => {
      userRepository.findLockableById.mockResolvedValue({
        ...mockCustomer,
        isBanned: true,
      });

      const result = await service.lockUser(mockCustomer.id);

      expect(userRepository.updateById).not.toHaveBeenCalled();
      expect(refreshTokenRepository.revokeAllByUserId).not.toHaveBeenCalled();
      expect(result.isBanned).toBe(true);
    });

    it('should throw NotFoundException for admin or missing users', async () => {
      userRepository.findLockableById.mockResolvedValue(null);

      await expect(service.lockUser(mockAdmin.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unlockUser', () => {
    it('should unlock a staff user', async () => {
      userRepository.findLockableById.mockResolvedValue({
        ...mockStaff,
        isBanned: true,
      });
      userRepository.updateById.mockResolvedValue({
        ...mockStaff,
        isBanned: false,
      });

      const result = await service.unlockUser(mockStaff.id);

      expect(userRepository.updateById).toHaveBeenCalledWith(mockStaff.id, {
        isBanned: false,
      });
      expect(result.isBanned).toBe(false);
    });

    it('should be idempotent when user is already unlocked', async () => {
      userRepository.findLockableById.mockResolvedValue(mockCustomer);

      const result = await service.unlockUser(mockCustomer.id);

      expect(userRepository.updateById).not.toHaveBeenCalled();
      expect(result.isBanned).toBe(false);
    });

    it('should throw NotFoundException for admin or missing users', async () => {
      userRepository.findLockableById.mockResolvedValue(null);

      await expect(service.unlockUser(mockAdmin.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
