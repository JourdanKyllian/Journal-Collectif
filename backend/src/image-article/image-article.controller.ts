import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImageArticleService } from './image-article.service';
import { CreateImageArticleDto } from './dto/create-image-article.dto';
import { UpdateImageArticleDto } from './dto/update-image-article.dto';

@Controller('image-article')
export class ImageArticleController {
  constructor(private readonly imageArticleService: ImageArticleService) {}

  @Post()
  create(@Body() createImageArticleDto: CreateImageArticleDto) {
    return this.imageArticleService.create(createImageArticleDto);
  }

  @Get()
  findAll() {
    return this.imageArticleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imageArticleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImageArticleDto: UpdateImageArticleDto) {
    return this.imageArticleService.update(+id, updateImageArticleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imageArticleService.remove(+id);
  }
}
