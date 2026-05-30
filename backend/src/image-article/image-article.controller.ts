import { Controller } from '@nestjs/common';
import { ImageArticleService } from './image-article.service';

@Controller('image-article')
export class ImageArticleController {
  constructor(private readonly imageArticleService: ImageArticleService) {}
}
