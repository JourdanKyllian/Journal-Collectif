import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/settings.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepo: Repository<Setting>,
  ) {}

  async getSettings(): Promise<Setting> {
    // On cherche la ligne ID 1. Si elle n'existe pas, on la crée par défaut.
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepo.create({ id: 1 });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(updateDto: UpdateSettingDto): Promise<Setting> {
    const settings = await this.getSettings();
    Object.assign(settings, updateDto);
    return this.settingsRepo.save(settings);
  }
}
