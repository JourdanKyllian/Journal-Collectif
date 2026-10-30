import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MembershipService } from './membership.service';
import type { Journal } from './entities/journal.entity';
import type { Repository } from 'typeorm';
import type { JournalMember } from './entities/journal-member.entity';
import type { Role } from '../roles/entities/roles.entity';

type Fn = (...args: unknown[]) => Promise<unknown>;

const DEFAULT = { id: 1, slug: 'collectif-chalonnais' } as Journal;
const OTHER = { id: 2, slug: 'journal-de-grasse' } as Journal;

describe('MembershipService.resolveRole', () => {
  const findOne = jest.fn<Fn>();
  const count = jest.fn<Fn>();
  let service: MembershipService;

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.DEFAULT_JOURNAL_SLUG;
    service = new MembershipService(
      { findOne, count } as unknown as Repository<JournalMember>,
      {} as Repository<Role>,
    );
  });

  it('1. l’adhésion au journal courant fait foi, quel que soit le rôle global', async () => {
    findOne.mockResolvedValue({ role: { libelle: 'redacteur' } });
    await expect(service.resolveRole(7, 'admin', OTHER)).resolves.toEqual({
      role: 'redacteur',
      isMember: true,
    });
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7, journalId: 2 } }),
    );
  });

  it('2. journal historique : le rôle global d’un compte sans aucune adhésion vaut (comptes antérieurs)', async () => {
    findOne.mockResolvedValue(null);
    count.mockResolvedValue(0);
    await expect(service.resolveRole(7, 'admin', DEFAULT)).resolves.toEqual({
      role: 'admin',
      isMember: true,
    });
  });

  it('2. … mais pas si le compte a des adhésions ailleurs : son rôle global ne vaut plus', async () => {
    findOne.mockResolvedValue(null);
    count.mockResolvedValue(1);
    await expect(service.resolveRole(7, 'admin', DEFAULT)).resolves.toEqual({
      role: 'utilisateur',
      isMember: false,
    });
  });

  it('3. un autre journal : jamais de repli sur le rôle global', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.resolveRole(7, 'super_admin', OTHER)).resolves.toEqual(
      {
        role: 'utilisateur',
        isMember: false,
      },
    );
    expect(count).not.toHaveBeenCalled();
  });

  it('un compte sans rôle global est citoyen', async () => {
    findOne.mockResolvedValue(null);
    count.mockResolvedValue(0);
    expect((await service.resolveRole(7, undefined, DEFAULT)).role).toBe(
      'utilisateur',
    );
  });

  it('le journal historique suit DEFAULT_JOURNAL_SLUG', () => {
    process.env.DEFAULT_JOURNAL_SLUG = 'autre-defaut';
    expect(service.isDefaultJournal(DEFAULT)).toBe(false);
    expect(service.isDefaultJournal({ slug: 'autre-defaut' } as Journal)).toBe(
      true,
    );
    delete process.env.DEFAULT_JOURNAL_SLUG;
  });

  describe('scopeUsers', () => {
    const qb = () => {
      const chain = { andWhere: jest.fn() };
      chain.andWhere.mockReturnValue(chain);
      return chain;
    };

    it('autre journal : uniquement ses membres', () => {
      const builder = qb();
      service.scopeUsers(builder as never, 'u', OTHER);
      const [sql, params] = builder.andWhere.mock.calls[0] as [string, object];
      expect(sql).toContain('jm.journal_id = :scopeJournalId');
      expect(sql).not.toContain('NOT EXISTS');
      expect(params).toEqual({ scopeJournalId: 2 });
    });

    it('journal historique : ses membres et les comptes sans aucune adhésion', () => {
      const builder = qb();
      service.scopeUsers(builder as never, 'u', DEFAULT);
      const [sql] = builder.andWhere.mock.calls[0] as [string];
      expect(sql).toContain('NOT EXISTS');
      expect(sql).toContain(' OR ');
    });
  });
});
