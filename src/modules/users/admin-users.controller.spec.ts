import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    isBanned: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findUsers: jest.fn(),
            lockUser: jest.fn(),
            unlockUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUsers', () => {
    it('should call usersService.findUsers and return the result', async () => {
      const query: QueryUserDto = { page: 1, limit: 10 };
      const paginatedResult = { items: [mockUser], meta: { totalItems: 1 } };
      service.findUsers.mockResolvedValue(paginatedResult as any);

      const result = await controller.findUsers(query);

      expect(service.findUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('lockUser', () => {
    it('should call usersService.lockUser and return the result', async () => {
      service.lockUser.mockResolvedValue({
        ...mockUser,
        isBanned: true,
      } as any);

      const result = await controller.lockUser('user-1');

      expect(service.lockUser).toHaveBeenCalledWith('user-1');
      expect(result.isBanned).toBe(true);
    });
  });

  describe('unlockUser', () => {
    it('should call usersService.unlockUser and return the result', async () => {
      service.unlockUser.mockResolvedValue({
        ...mockUser,
        isBanned: false,
      } as any);

      const result = await controller.unlockUser('user-1');

      expect(service.unlockUser).toHaveBeenCalledWith('user-1');
      expect(result.isBanned).toBe(false);
    });
  });
});
