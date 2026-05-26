import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    userId: number;
    role: string;
  };
}

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  // CRÉER / PROPOSER
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createArticleDto: CreateArticleDto, @Req() req: RequestWithUser) {
    return this.articleService.create(createArticleDto, req.user.userId, req.user.role);
  }

  // MODIFIER (Brouillon ou correction)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto, @Req() req: RequestWithUser) {
    return this.articleService.update(+id, updateArticleDto, req.user.userId, req.user.role);
  }

  // VALIDER / PUBLIER (Admins uniquement)
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  publish(@Param('id') id: string) {
    return this.articleService.publishArticle(+id);
  }

  // PUBLIC : Liste des articles pour le journal
  @Get('published')
  findAll() {
    return this.articleService.findAllPublished();
  }
}