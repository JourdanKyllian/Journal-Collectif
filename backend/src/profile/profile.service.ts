import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Users } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /**
   * Met à jour les informations publiques du profil de l'utilisateur connecté.
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException('Profil introuvable pour cet utilisateur.');
    }

    const phoneChanged =
      updateProfileDto.tel !== undefined &&
      updateProfileDto.tel !== profile.tel;

    Object.assign(profile, updateProfileDto);
    const saved = await this.profileRepository.save(profile);

    // Un nouveau numéro doit être revérifié avant de pouvoir proposer des articles.
    if (phoneChanged) {
      await this.profileRepository.manager.update(Users, userId, {
        is_phone_verified: false,
      });
    }
    return saved;
  }
}
