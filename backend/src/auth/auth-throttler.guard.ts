import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import type { Response } from 'express';

/**
 * ThrottlerGuard dont la réponse 429 expose le `Retry-After` standard : le throttler le suffixe
 * du nom du limiteur (`Retry-After-login-account`), que les clients HTTP n'interprètent pas.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const retryAfter = Math.max(
      1,
      Math.ceil(detail.timeToBlockExpire || detail.timeToExpire),
    );
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Retry-After', String(retryAfter));

    throw new ThrottlerException(
      `Trop de tentatives. Réessayez dans ${retryAfter} s.`,
    );
  }
}
