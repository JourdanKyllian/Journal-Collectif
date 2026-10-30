import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journal } from '../tenant/entities/journal.entity';
import { TenantContext } from '../tenant/tenant.context';
import { UpdateSettingDto } from './dto/update-setting.dto';

/** Réglages publics d'un journal (nom, ville, contact, pied de page). */
export interface JournalSettings {
  id: number;
  slug: string;
  nom_journal: string;
  type_journal: string;
  nom_ville: string;
  email_contact: string;
  tel_contact: string;
  description_footer: string;
  updated_at: Date;
}

const toSettings = (journal: Journal): JournalSettings => ({
  id: journal.id,
  slug: journal.slug,
  nom_journal: journal.nom_journal,
  type_journal: journal.type_journal,
  nom_ville: journal.nom_ville,
  email_contact: journal.email_contact,
  tel_contact: journal.tel_contact,
  description_footer: journal.description_footer,
  updated_at: journal.updated_at,
});

/**
 * Les réglages vivent sur le `Journal` courant : chaque journal a les siens.
 * (L'ancienne table `settings` n'est plus lue, elle reste le temps du déploiement.)
 */
@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Journal)
    private readonly journals: Repository<Journal>,
    private readonly tenant: TenantContext,
  ) {}

  async getSettings(): Promise<JournalSettings> {
    return toSettings(await this.current());
  }

  async updateSettings(updateDto: UpdateSettingDto): Promise<JournalSettings> {
    const journal = await this.current();
    Object.assign(journal, updateDto);
    return toSettings(await this.journals.save(journal));
  }

  private current(): Promise<Journal> {
    return this.journals.findOneByOrFail({ id: this.tenant.journalId });
  }
}
