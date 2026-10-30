import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { JournalService } from './journal.service';
import { TenantContext } from './tenant.context';
import { JOURNAL_HEADER, JOURNAL_QUERY } from './tenant.constants';
import type { Journal } from './entities/journal.entity';

export type RequestWithJournal = Request & { journal?: Journal };

const first = (value: unknown): string | undefined => {
  const item: unknown = Array.isArray(value) ? value[0] : value;
  return typeof item === 'string' ? item : undefined;
};

/** Résout le journal de chaque requête et l'installe dans le contexte avant tout le reste. */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly journals: JournalService,
    private readonly tenant: TenantContext,
  ) {}

  async use(req: RequestWithJournal, _res: Response, next: NextFunction) {
    try {
      const raw =
        first(req.headers[JOURNAL_HEADER]) ?? first(req.query?.[JOURNAL_QUERY]);
      const journal = await this.journals.resolve(raw);
      req.journal = journal;
      this.tenant.run(journal, () => next());
    } catch (error) {
      next(error);
    }
  }
}
