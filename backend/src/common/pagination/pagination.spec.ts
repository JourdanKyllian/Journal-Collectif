import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  buildPaginated,
  escapeLike,
  MAX_PAGE_SIZE,
  PaginationQueryDto,
  toSkipTake,
} from './pagination';

const parse = (query: Record<string, unknown>) =>
  plainToInstance(PaginationQueryDto, query);

describe('PaginationQueryDto', () => {
  it('applique page=1 et limit=20 par défaut', async () => {
    const dto = parse({});
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 1, limit: 20 });
  });

  it('convertit les chaînes de la query string en nombres', async () => {
    const dto = parse({ page: '3', limit: '50' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 3, limit: 50 });
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: 'abc' },
    { limit: '0' },
    { limit: String(MAX_PAGE_SIZE + 1) },
    { limit: '1.5' },
  ])('rejette %j', async (query) => {
    expect((await validate(parse(query))).length).toBeGreaterThan(0);
  });
});

describe('toSkipTake / buildPaginated', () => {
  it('calcule le décalage', () => {
    expect(toSkipTake(parse({ page: '3', limit: '20' }))).toEqual({
      skip: 40,
      take: 20,
    });
  });

  it('construit les métadonnées', () => {
    const query = parse({ page: '2', limit: '10' });
    expect(buildPaginated(['x'], 25, query).meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
    });
  });

  it('signale la dernière page et la liste vide', () => {
    const last = buildPaginated([], 25, parse({ page: '3', limit: '10' }));
    expect(last.meta.hasNextPage).toBe(false);

    const empty = buildPaginated([], 0, parse({}));
    expect(empty.meta).toMatchObject({
      total: 0,
      totalPages: 0,
      hasNextPage: false,
    });
  });
});

describe('escapeLike', () => {
  it('échappe les jokers SQL', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
  });
});
