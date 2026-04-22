import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
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

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delegates to service.create and returns result', async () => {
      const dto: CreateUserDto = {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
      };
      mockService.create.mockResolvedValue(mockUser);

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });

    it('propagates service error', async () => {
      mockService.create.mockRejectedValue(new Error('DB error'));

      await expect(
        controller.create({ name: 'x', email: 'x@x.com', password: 'x' }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('delegates to service.findAll and returns result', async () => {
      mockService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([mockUser]);
    });

    it('returns empty array when no users', async () => {
      mockService.findAll.mockResolvedValue([]);

      expect(await controller.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('passes id to service.findOne and returns result', async () => {
      mockService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('uuid-1');

      expect(mockService.findOne).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('propagates error when user not found', async () => {
      mockService.findOne.mockRejectedValue(new Error('User uuid-x not found'));

      await expect(controller.findOne('uuid-x')).rejects.toThrow(
        'User uuid-x not found',
      );
    });
  });

  describe('update', () => {
    it('passes id and dto to service.update and returns result', async () => {
      const dto: UpdateUserDto = { name: 'Jane' };
      const updated = { ...mockUser, name: 'Jane' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('uuid-1', dto);

      expect(mockService.update).toHaveBeenCalledWith('uuid-1', dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException when user not found', async () => {
      mockService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('uuid-x', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('passes id to service.remove and returns result', async () => {
      mockService.remove.mockResolvedValue('User removed successfully');

      const result = await controller.remove('uuid-1');

      expect(mockService.remove).toHaveBeenCalledWith('uuid-1');
      expect(result).toBe('User removed successfully');
    });

    it('propagates error when user not found', async () => {
      mockService.remove.mockRejectedValue(new Error('User uuid-x not found'));

      await expect(controller.remove('uuid-x')).rejects.toThrow(
        'User uuid-x not found',
      );
    });
  });
});
