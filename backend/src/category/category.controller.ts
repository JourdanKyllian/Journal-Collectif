import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // 🌍 PUBLIC : Tout le monde peut voir les catégories
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  // 🌍 PUBLIC : Voir une seule catégorie
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  // 🔒 PROTÉGÉ : Seuls Admin et Moderateur
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  // 🔒 PROTÉGÉ : Seuls Admin et Moderateur
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  // 🔒 PROTÉGÉ : Seuls Admin et Moderateur
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}