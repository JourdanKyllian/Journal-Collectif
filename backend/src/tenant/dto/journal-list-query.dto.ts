import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class JournalListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Code INSEE ou nom de commune' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  commune?: string;

  @ApiPropertyOptional({ example: '06000' })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\d{5}$/, { message: 'Le code postal doit comporter 5 chiffres' })
  code_postal?: string;

  @ApiPropertyOptional({
    description: 'Recherche sur le nom, la ville ou le slug',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;
}
