import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUser: Users = {
  id: 'uuid-1',
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  preload: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Users), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and saves user', async () => {
      const dto: CreateUserDto = {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      };
      mockRepo.create.mockReturnValue(mockUser);
      mockRepo.save.mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('propagates save error', async () => {
      mockRepo.create.mockReturnValue(mockUser);
      mockRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.create({ name: 'x', email: 'x@x.com', password: 'x' }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });

    it('returns empty array when no users', async () => {
      mockRepo.find.mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns user by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findOne('uuid-1');

      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
      expect(result).toEqual(mockUser);
    });

    // NOTE: service throws generic Error, not NotFoundException — inconsistent with update()
    it('throws Error when user not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('uuid-x')).rejects.toThrow(
        'User uuid-x not found',
      );
    });
  });

  describe('update', () => {
    it('preloads, saves and returns updated user', async () => {
      const dto: UpdateUserDto = { name: 'Jane' };
      const preloaded = { ...mockUser, name: 'Jane' };
      mockRepo.preload.mockResolvedValue(preloaded);
      mockRepo.save.mockResolvedValue(preloaded);

      const result = await service.update('uuid-1', dto);

      expect(mockRepo.preload).toHaveBeenCalledWith({ id: 'uuid-1', ...dto });
      expect(mockRepo.save).toHaveBeenCalledWith(preloaded);
      expect(result).toEqual(preloaded);
    });

    it('throws NotFoundException when user not found', async () => {
      mockRepo.preload.mockResolvedValue(null);

      await expect(service.update('uuid-x', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes user and returns success message', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);
      mockRepo.remove.mockResolvedValue(mockUser);

      const result = await service.remove('uuid-1');

      expect(mockRepo.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toBe('User removed successfully');
    });

    it('throws when user not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('uuid-x')).rejects.toThrow(
        'User uuid-x not found',
      );
    });

    it('throws when remove fails', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);
      mockRepo.remove.mockRejectedValue(new Error('DB error'));

      await expect(service.remove('uuid-1')).rejects.toThrow('DB error');
    });
  });
});
