import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import type { Request as ExpressRequest } from 'express';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

interface RequestWithUser extends ExpressRequest {
  user: { userId: number };
}

describe('ProfileController', () => {
  let controller: ProfileController;

  // Typage explicite ici aussi
  const mockProfileService = {
    updateProfile: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('update (PATCH /profile/me)', () => {
    it('devrait extraire le userId de la requête et appeler le service avec le bon DTO', async () => {
      const mockRequest = { user: { userId: 42 } } as unknown as RequestWithUser;
      const updateDto = { lastname: 'Dupont' };
      const expectedResult = { id: 1, lastname: 'Dupont' };

      mockProfileService.updateProfile.mockResolvedValue(expectedResult);

      const result = await controller.update(mockRequest, updateDto);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        42,
        updateDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
