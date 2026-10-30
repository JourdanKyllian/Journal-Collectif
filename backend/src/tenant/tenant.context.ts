import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Journal } from './entities/journal.entity';

/**
 * Journal courant de la requête, porté par un AsyncLocalStorage : tout le code exécuté pendant
 * la requête (guards, services, requêtes SQL) y accède sans que chaque signature le transporte.
 * Posé par `TenantMiddleware` avant tout le reste.
 */
@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<Journal>();

  run<T>(journal: Journal, callback: () => T): T {
    return this.storage.run(journal, callback);
  }

  tryGet(): Journal | undefined {
    return this.storage.getStore();
  }

  /** Échoue bruyamment plutôt que de laisser une requête s'exécuter sans filtre de journal. */
  get journal(): Journal {
    const journal = this.storage.getStore();
    if (!journal) {
      throw new InternalServerErrorException(
        'Journal courant non résolu pour cette requête.',
      );
    }
    return journal;
  }

  get journalId(): number {
    return this.journal.id;
  }
}
