import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { JournalService } from './journal.service';
import { TenantContext } from './tenant.context';

/** Tables dont chaque ligne appartient à un journal. */
const TENANT_TABLES = new Set([
  'article',
  'categorie',
  'alerts',
  'declaration_objet',
]);

/**
 * Filet de sécurité à l'insertion : une ligne créée sans `journal_id` est rattachée au journal
 * courant de la requête, ou à défaut au journal historique. Les services passent toujours
 * `journalId` explicitement ; ceci couvre les scripts, seeds et anciens chemins de code
 * qui ignorent le multi-tenant, sans jamais écrire une ligne orpheline.
 */
@Injectable()
export class TenantInsertSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    private readonly tenant: TenantContext,
    private readonly journals: JournalService,
  ) {
    dataSource.subscribers.push(this);
  }

  async beforeInsert(event: InsertEvent<{ journalId?: number | null }>) {
    const entity = event.entity;
    if (!entity || !TENANT_TABLES.has(event.metadata.tableName)) return;
    if (entity.journalId != null) return;

    entity.journalId =
      this.tenant.tryGet()?.id ?? (await this.journals.defaultJournalId());
  }
}
