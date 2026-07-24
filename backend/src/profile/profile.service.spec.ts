import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { NotFoundException } from '@nestjs/common';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

describe('ProfileService', () => {
  let service: ProfileService;

  // Typage explicite pour contourner l'erreur "never" de TypeScript strict
  const mockProfileRepository = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it("devrait mettre à jour et retourner le profil si l'utilisateur existe", async () => {
      const userId = 1;
      const updateDto = { firstname: 'Jean', bio: 'Nouvelle bio' };

      const existingProfile = {
        id: 10,
        firstname: 'Old',
        bio: 'Old bio',
        user: { id: userId },
      };

      mockProfileRepository.findOne.mockResolvedValue(existingProfile);
      mockProfileRepository.save.mockImplementation(
        (profile: Partial<Profile>) => Promise.resolve(profile),
      );

      const result = await service.updateProfile(userId, updateDto);

      expect(mockProfileRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId } },
      });

      expect(mockProfileRepository.save).toHaveBeenCalledWith({
        ...existingProfile,
        ...updateDto,
      });

      expect(result.firstname).toBe('Jean');
      expect(result.bio).toBe('Nouvelle bio');
    });

    it("devrait lever une NotFoundException si le profil n'est pas trouvé en base", async () => {
      const userId = 2;

      mockProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { firstname: 'Test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockProfileRepository.save).not.toHaveBeenCalled();
    });
  });
});
