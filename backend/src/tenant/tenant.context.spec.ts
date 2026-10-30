import { describe, expect, it } from '@jest/globals';
import { InternalServerErrorException } from '@nestjs/common';
import { TenantContext } from './tenant.context';
import type { Journal } from './entities/journal.entity';

const journal = (id: number) => ({ id, slug: `j${id}` }) as Journal;

describe('TenantContext', () => {
  it('porte le journal pendant l’exécution et pas après', () => {
    const tenant = new TenantContext();
    expect(tenant.tryGet()).toBeUndefined();

    tenant.run(journal(1), () => {
      expect(tenant.journalId).toBe(1);
      expect(tenant.journal.slug).toBe('j1');
    });
    expect(tenant.tryGet()).toBeUndefined();
  });

  it('échoue bruyamment hors contexte plutôt que de laisser une requête sans filtre', () => {
    const tenant = new TenantContext();
    expect(() => tenant.journalId).toThrow(InternalServerErrorException);
    expect(() => tenant.journal).toThrow(InternalServerErrorException);
  });

  it('isole deux requêtes concurrentes, même à travers des attentes asynchrones', async () => {
    const tenant = new TenantContext();
    const seen: number[] = [];

    const request = (id: number, delay: number) =>
      tenant.run(journal(id), async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        await Promise.resolve();
        seen.push(tenant.journalId);
        return tenant.journalId;
      });

    const results = await Promise.all([
      request(1, 20),
      request(2, 5),
      request(3, 10),
    ]);

    expect(results).toEqual([1, 2, 3]);
    expect(seen).toEqual([2, 3, 1]); // terminées dans le désordre, chacune avec son propre journal
  });
});
