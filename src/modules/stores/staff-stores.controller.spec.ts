import { Test, TestingModule } from '@nestjs/testing';
import { StaffStoresController } from './staff-stores.controller';
import { StoresService } from './stores.service';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { UpdateStoreDto } from './dto/update-store.dto';

describe('StaffStoresController', () => {
  let controller: StaffStoresController;
  let service: jest.Mocked<StoresService>;

  const mockStaff: User = {
    id: 'staff-1',
    email: 'staff@example.com',
    passwordHash: 'hashed',
    role: UserRole.STAFF,
    storeId: 'store-1',
    fullName: 'Staff User',
    avatarUrl: '',
    dob: new Date(),
    gender: 'Male',
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: null,
  };

  const mockStore = {
    id: 'store-1',
    name: 'Store A',
    address: '123 Street',
    phone: '0123456789',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffStoresController],
      providers: [
        {
          provide: StoresService,
          useValue: {
            findAssignedStore: jest.fn(),
            updateAssignedStore: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StaffStoresController>(StaffStoresController);
    service = module.get(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAssignedStore', () => {
    it('should call storesService.findAssignedStore and return the result', async () => {
      service.findAssignedStore.mockResolvedValue(mockStore as any);

      const result = await controller.findAssignedStore(mockStaff);

      expect(service.findAssignedStore).toHaveBeenCalledWith('store-1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('updateAssignedStore', () => {
    it('should call storesService.updateAssignedStore and return the result', async () => {
      const dto: UpdateStoreDto = { name: 'Updated Store A' };
      service.updateAssignedStore.mockResolvedValue({
        ...mockStore,
        name: 'Updated Store A',
      } as any);

      const result = await controller.updateAssignedStore(mockStaff, dto);

      expect(service.updateAssignedStore).toHaveBeenCalledWith('store-1', dto);
      expect(result.name).toBe('Updated Store A');
    });
  });
});
