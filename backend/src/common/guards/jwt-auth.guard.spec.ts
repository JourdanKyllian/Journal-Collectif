import { describe, expect, it } from '@jest/globals';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

const contextAt = (path: string) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ path }) }),
  }) as unknown as ExecutionContext;

const user = (mustChangePassword: boolean) => ({
  userId: 1,
  role: 'super_admin',
  mustChangePassword,
});

describe('JwtAuthGuard : mot de passe provisoire', () => {
  const guard = new JwtAuthGuard();

  it('laisse passer un compte normal partout', () => {
    expect(
      guard.handleRequest(
        null,
        user(false),
        undefined,
        contextAt('/api/v1/article/admin/all'),
      ),
    ).toMatchObject({ userId: 1 });
  });

  it.each(['/api/v1/auth/me', '/api/v1/auth/security', '/api/v1/auth/me/'])(
    'ouvre %s à un compte au mot de passe provisoire',
    (path) => {
      expect(
        guard.handleRequest(null, user(true), undefined, contextAt(path)),
      ).toMatchObject({ userId: 1 });
    },
  );

  it.each([
    '/api/v1/article/admin/all',
    '/api/v1/categorie',
    '/api/v1/users/all',
    '/api/v1/auth/me/../users',
    '/api/v1/auth/sessions',
  ])(
    'bloque %s tant que le mot de passe provisoire n’est pas changé',
    (path) => {
      expect(() =>
        guard.handleRequest(null, user(true), undefined, contextAt(path)),
      ).toThrow(ForbiddenException);
    },
  );

  it('signale le motif avec un code exploitable par les clients', () => {
    try {
      guard.handleRequest(null, user(true), undefined, contextAt('/api/v1/x'));
      throw new Error('devait échouer');
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        error: 'PASSWORD_CHANGE_REQUIRED',
      });
    }
  });

  it('continue de refuser un jeton invalide (401)', () => {
    expect(() =>
      guard.handleRequest(null, false, undefined, contextAt('/api/v1/auth/me')),
    ).toThrow(UnauthorizedException);
  });
});
