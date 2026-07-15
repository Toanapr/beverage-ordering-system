import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { UserRole } from 'src/common/enums/role.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockStaff = {
    id: 'staff-1',
    email: 'staff@example.com',
    fullName: 'Staff User',
    role: UserRole.STAFF,
    isBanned: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createStaff: jest.fn(),
            findStaff: jest.fn(),
            lockStaff: jest.fn(),
            unlockStaff: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStaff', () => {
    it('should call usersService.createStaff and return the result', async () => {
      const dto: CreateStaffDto = {
        email: 'staff@example.com',
        password: 'password123',
        fullName: 'Staff User',
        storeId: 'store-1',
      };
      service.createStaff.mockResolvedValue(mockStaff as any);

      const result = await controller.createStaff(dto);

      expect(service.createStaff).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockStaff);
    });
  });

  describe('findStaff', () => {
    it('should call usersService.findStaff and return the result', async () => {
      const query: QueryStaffDto = { page: 1, limit: 10 };
      const paginatedResult = { items: [mockStaff], meta: { totalItems: 1 } };
      service.findStaff.mockResolvedValue(paginatedResult as any);

      const result = await controller.findStaff(query);

      expect(service.findStaff).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('lockStaff', () => {
    it('should call usersService.lockStaff and return the result', async () => {
      service.lockStaff.mockResolvedValue({
        ...mockStaff,
        isBanned: true,
      } as any);

      const result = await controller.lockStaff('staff-1');

      expect(service.lockStaff).toHaveBeenCalledWith('staff-1');
      expect(result.isBanned).toBe(true);
    });
  });

  describe('unlockStaff', () => {
    it('should call usersService.unlockStaff and return the result', async () => {
      service.unlockStaff.mockResolvedValue({
        ...mockStaff,
        isBanned: false,
      } as any);

      const result = await controller.unlockStaff('staff-1');

      expect(service.unlockStaff).toHaveBeenCalledWith('staff-1');
      expect(result.isBanned).toBe(false);
    });
  });
});
