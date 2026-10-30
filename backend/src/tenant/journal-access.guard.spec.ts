import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ExecutionContext,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { JournalAccessGuard } from './journal-access.guard';
import { JournalStatut } from './tenant.constants';
import type { TenantContext } from './tenant.context';

describe('JournalAccessGuard', () => {
  const getAllAndOverride = jest.fn();
  const tryGet = jest.fn();
  const authenticate = jest.fn<(...args: unknown[]) => Promise<boolean>>();
  let guard: JournalAccessGuard;
  let request: { user?: unknown };

  const context = () =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const inJournal = (statut: JournalStatut) =>
    tryGet.mockReturnValue({ id: 5, statut });

  beforeEach(() => {
    jest.resetAllMocks();
    request = {};
    getAllAndOverride.mockReturnValue(false);
    authenticate.mockResolvedValue(true);
    guard = new JournalAccessGuard(
      { getAllAndOverride } as unknown as Reflector,
      { tryGet } as unknown as TenantContext,
    );
    // l'authentification passport est hors sujet ici : on ne teste que la décision
    jest
      .spyOn(OptionalJwtAuthGuard.prototype, 'canActivate')
      .mockImplementation(authenticate);
  });

  it('laisse passer un journal actif sans même tenter d’authentifier', async () => {
    inJournal(JournalStatut.ACTIF);
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('laisse passer une route marquée @SkipTenantGate (connexion, annuaire)', async () => {
    inJournal(JournalStatut.EN_CONFIGURATION);
    getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('un journal en configuration est introuvable pour un anonyme et pour un non-membre', async () => {
    inJournal(JournalStatut.EN_CONFIGURATION);
    await expect(guard.canActivate(context())).rejects.toThrow(
      NotFoundException,
    );

    request.user = { isJournalMember: false, isPlatformAdmin: false };
    await expect(guard.canActivate(context())).rejects.toThrow(
      NotFoundException,
    );
  });

  it.each([
    ['un membre', { isJournalMember: true, isPlatformAdmin: false }],
    [
      'un opérateur de la plateforme',
      { isJournalMember: false, isPlatformAdmin: true },
    ],
  ])(
    'un journal en configuration reste accessible à %s',
    async (_label, user) => {
      inJournal(JournalStatut.EN_CONFIGURATION);
      request.user = user;
      await expect(guard.canActivate(context())).resolves.toBe(true);
    },
  );

  it('un journal en maintenance est indisponible (503) pour les non-membres, ouvert aux membres', async () => {
    inJournal(JournalStatut.MAINTENANCE);
    await expect(guard.canActivate(context())).rejects.toThrow(
      ServiceUnavailableException,
    );

    request.user = { isJournalMember: true };
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('sans contexte de journal (hors requête HTTP), ne bloque pas', async () => {
    tryGet.mockReturnValue(undefined);
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });
});
