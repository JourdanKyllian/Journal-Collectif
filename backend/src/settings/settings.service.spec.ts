import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SettingsService } from './settings.service';
import { Journal } from '../tenant/entities/journal.entity';
import { TenantContext } from '../tenant/tenant.context';

type Fn = (...args: unknown[]) => Promise<unknown>;

describe('SettingsService', () => {
  let service: SettingsService;
  const journals = {
    findOneByOrFail: jest.fn<Fn>(),
    save: jest.fn<Fn>(),
  };

  const journal = () => ({
    id: 7,
    slug: 'journal-de-grasse',
    nom_journal: 'Journal de Grasse',
    type_journal: 'Journal',
    nom_ville: 'Grasse',
    email_contact: 'contact@grasse.fr',
    tel_contact: '04 00 00 00 00',
    description_footer: 'Pied de page',
    statut: 'actif',
    created_at: new Date(0),
    updated_at: new Date(0),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(Journal), useValue: journals },
        { provide: TenantContext, useValue: { journalId: 7 } },
      ],
    }).compile();
    service = module.get(SettingsService);
  });

  it('lit les réglages du journal courant, et seulement ceux-là', async () => {
    journals.findOneByOrFail.mockResolvedValue(journal());

    const settings = await service.getSettings();

    expect(journals.findOneByOrFail).toHaveBeenCalledWith({ id: 7 });
    expect(settings).toMatchObject({
      slug: 'journal-de-grasse',
      nom_journal: 'Journal de Grasse',
      nom_ville: 'Grasse',
      email_contact: 'contact@grasse.fr',
    });
  });

  it('ne laisse pas fuir les champs internes du journal', async () => {
    journals.findOneByOrFail.mockResolvedValue(journal());
    const settings = await service.getSettings();
    expect(settings).not.toHaveProperty('statut');
    expect(settings).not.toHaveProperty('created_at');
  });

  it('écrit sur le journal courant', async () => {
    journals.findOneByOrFail.mockResolvedValue(journal());
    journals.save.mockImplementation((j) => Promise.resolve(j));

    const result = await service.updateSettings({ nom_ville: 'Cannes' });

    expect(journals.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, nom_ville: 'Cannes' }),
    );
    expect(result.nom_ville).toBe('Cannes');
  });
});
