import { PartialType } from '@nestjs/mapped-types';
import { CreateImageArticleDto } from './create-image-article.dto';

export class UpdateImageArticleDto extends PartialType(CreateImageArticleDto) {}
