import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Journal } from '../tenant/entities/journal.entity';
import { TenantContext } from '../tenant/tenant.context';

describe('SettingsController', () => {
  let controller: SettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Journal),
          useValue: {}, // Faux repository pour valider le test
        },
        { provide: TenantContext, useValue: { journalId: 1 } },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
