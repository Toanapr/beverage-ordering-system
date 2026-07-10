import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import {
  I_STORE_REPOSITORY,
  IStoreRepository,
} from './repositories/store-repository.interface';
import { Store } from './entities/store.entity';

describe('StoresService', () => {
  let service: StoresService;
  let repository: jest.Mocked<IStoreRepository>;

  const mockStore: Store = {
    id: 'store-1',
    name: 'ABC Tea',
    phone: '0901234567',
    address: '123 Nguyen Trai',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: I_STORE_REPOSITORY,
          useValue: {
            findAndCount: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(StoresService);
    repository = module.get(I_STORE_REPOSITORY);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a new store successfully with default isOpen = true', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockStore);

      const result = await service.create({
        name: 'ABC Tea',
        phone: '0901234567',
        address: '123 Nguyen Trai',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ABC Tea', isOpen: true }),
      );
      expect(result).toEqual(mockStore);
    });

    it('should throw ConflictException if the store name already exists', async () => {
      repository.findByName.mockResolvedValue(mockStore);

      await expect(
        service.create({
          name: 'ABC Tea',
          phone: '0901234567',
          address: 'x',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findPublicList', () => {
    it('should enforce isLocked = false even if the query passes isLocked = true', async () => {
      repository.findAndCount.mockResolvedValue([[mockStore], 1]);

      const result = await service.findPublicList({
        page: 1,
        limit: 10,
        isLocked: true,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ isLocked: false }),
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
      expect(result.items).toEqual([mockStore]);
    });

    it('should calculate the correct offset when page > 1', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findPublicList({ page: 3, limit: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('findPublicOneOrThrow', () => {
    it('should throw NotFoundException if the store is locked', async () => {
      repository.findById.mockResolvedValue({ ...mockStore, isLocked: true });

      await expect(service.findPublicOneOrThrow('store-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if the store does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findPublicOneOrThrow('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the store if it is not locked', async () => {
      repository.findById.mockResolvedValue(mockStore);

      const result = await service.findPublicOneOrThrow('store-1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('lock / unlock', () => {
    it('lock should set isLocked = true', async () => {
      repository.findById.mockResolvedValue(mockStore);
      repository.update.mockResolvedValue({ ...mockStore, isLocked: true });

      const result = await service.lock('store-1');

      expect(repository.update).toHaveBeenCalledWith('store-1', {
        isLocked: true,
      });
      expect(result.isLocked).toBe(true);
    });

    it('unlock should set isLocked = false', async () => {
      repository.findById.mockResolvedValue({ ...mockStore, isLocked: true });
      repository.update.mockResolvedValue({ ...mockStore, isLocked: false });

      const result = await service.unlock('store-1');

      expect(repository.update).toHaveBeenCalledWith('store-1', {
        isLocked: false,
      });
      expect(result.isLocked).toBe(false);
    });

    it('should not call update again when locking an already locked store (idempotent)', async () => {
      repository.findById.mockResolvedValue({ ...mockStore, isLocked: true });

      await service.lock('store-1');

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('lock should throw NotFoundException if the store does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.lock('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertOrderable', () => {
    it('should throw ForbiddenException if the store is locked', async () => {
      repository.findById.mockResolvedValue({ ...mockStore, isLocked: true });

      await expect(service.assertOrderable('store-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if the store is closed', async () => {
      repository.findById.mockResolvedValue({ ...mockStore, isOpen: false });

      await expect(service.assertOrderable('store-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return the store if valid (not locked and open)', async () => {
      repository.findById.mockResolvedValue(mockStore);

      const result = await service.assertOrderable('store-1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if the store does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if the new name duplicates another store name', async () => {
      repository.findById.mockResolvedValue(mockStore);
      repository.findByName.mockResolvedValue({ ...mockStore, id: 'store-2' });

      await expect(
        service.update('store-1', { name: 'Duplicate Name' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check for name duplication if the name is unchanged', async () => {
      repository.findById.mockResolvedValue(mockStore);
      repository.update.mockResolvedValue({
        ...mockStore,
        phone: '0999999999',
      });

      await service.update('store-1', {
        name: mockStore.name,
        phone: '0999999999',
      });

      expect(repository.findByName).not.toHaveBeenCalled();
    });

    it('should update successfully', async () => {
      repository.findById.mockResolvedValue(mockStore);
      repository.update.mockResolvedValue({
        ...mockStore,
        phone: '0999999999',
      });

      const result = await service.update('store-1', { phone: '0999999999' });
      expect(result.phone).toBe('0999999999');
    });
  });
});
