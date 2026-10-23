import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Paramètres de pagination communs à toutes les listes (`?page=2&limit=20`).
 * Les DTO de liste (articles, utilisateurs, objets perdus, parkings…) en héritent.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Traduit `page`/`limit` en options `skip`/`take` pour TypeORM. */
export function toSkipTake({ page, limit }: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationQueryDto,
): Paginated<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNextPage: page < totalPages },
  };
}

/** Échappe `%`, `_` et `\` pour un `ILIKE` construit à partir d'une saisie utilisateur. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
