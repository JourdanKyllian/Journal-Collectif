import { Injectable } from '@nestjs/common';
import { CreateImageArticleDto } from './dto/create-image-article.dto';
import { UpdateImageArticleDto } from './dto/update-image-article.dto';

@Injectable()
export class ImageArticleService {
  create(createImageArticleDto: CreateImageArticleDto) {
    return 'This action adds a new imageArticle';
  }

  findAll() {
    return `This action returns all imageArticle`;
  }

  findOne(id: number) {
    return `This action returns a #${id} imageArticle`;
  }

  update(id: number, updateImageArticleDto: UpdateImageArticleDto) {
    return `This action updates a #${id} imageArticle`;
  }

  remove(id: number) {
    return `This action removes a #${id} imageArticle`;
  }
}
