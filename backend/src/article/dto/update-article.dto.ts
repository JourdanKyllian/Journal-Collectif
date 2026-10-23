import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateArticleDto } from './create-article.dto';

/** `is_anonymous` est exclu : l'anonymat est fixé à la création (ou modifié par un admin). */
export class UpdateArticleDto extends PartialType(
  OmitType(CreateArticleDto, ['is_anonymous'] as const),
) {}
