import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';

describe('StoresController', () => {
  let controller: StoresController;
  let service: jest.Mocked<StoresService>;

  const mockStore = {
    id: 'store-1',
    name: 'Store A',
    address: '123 Street',
    phone: '0123456789',
    isLocked: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: {
            findPublicList: jest.fn(),
            findPublicOneOrThrow: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            lock: jest.fn(),
            unlock: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    service = module.get(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call storesService.findPublicList and return the result', async () => {
      const query: QueryStoreDto = { page: 1, limit: 10 };
      const paginatedResult = { items: [mockStore], meta: { totalItems: 1 } };
      service.findPublicList.mockResolvedValue(paginatedResult as any);

      const result = await controller.findAll(query);

      expect(service.findPublicList).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findAllForAdmin', () => {
    it('should call storesService.findAll and return the result', async () => {
      const query: QueryStoreDto = {
        page: 1,
        limit: 10,
        isOpen: false,
        isLocked: true,
      };
      const paginatedResult = { items: [mockStore], meta: { totalItems: 1 } };
      service.findAll.mockResolvedValue(paginatedResult as any);

      const result = await controller.findAllForAdmin(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should call storesService.findPublicOneOrThrow and return the result', async () => {
      service.findPublicOneOrThrow.mockResolvedValue(mockStore as any);

      const result = await controller.findOne('store-1');

      expect(service.findPublicOneOrThrow).toHaveBeenCalledWith('store-1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('create', () => {
    it('should call storesService.create and return the result', async () => {
      const dto: CreateStoreDto = {
        name: 'Store A',
        address: '123 Street',
        phone: '0123456789',
      };
      service.create.mockResolvedValue(mockStore as any);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockStore);
    });
  });

  describe('update', () => {
    it('should call storesService.update and return the result', async () => {
      const dto: UpdateStoreDto = { name: 'Updated Store A' };
      service.update.mockResolvedValue({
        ...mockStore,
        name: 'Updated Store A',
      } as any);

      const result = await controller.update('store-1', dto);

      expect(service.update).toHaveBeenCalledWith('store-1', dto);
      expect(result.name).toBe('Updated Store A');
    });
  });

  describe('lock', () => {
    it('should call storesService.lock and return the result', async () => {
      service.lock.mockResolvedValue({ ...mockStore, isLocked: true } as any);

      const result = await controller.lock('store-1');

      expect(service.lock).toHaveBeenCalledWith('store-1');
      expect(result.isLocked).toBe(true);
    });
  });

  describe('unlock', () => {
    it('should call storesService.unlock and return the result', async () => {
      service.unlock.mockResolvedValue({
        ...mockStore,
        isLocked: false,
      } as any);

      const result = await controller.unlock('store-1');

      expect(service.unlock).toHaveBeenCalledWith('store-1');
      expect(result.isLocked).toBe(false);
    });
  });
});
