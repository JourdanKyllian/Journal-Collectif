import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination';
import { ArticleStatus } from '../entities/article.entity';

export class ArticleListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtre par catégorie' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categorieId?: number;

  @ApiPropertyOptional({ description: 'Recherche dans le titre' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class AdminArticleListQueryDto extends ArticleListQueryDto {
  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  statut?: ArticleStatus;
}
