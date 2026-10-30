import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Setting } from './entities/settings.entity';
import { Journal } from '../tenant/entities/journal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, Journal])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
