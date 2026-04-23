import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeclarationObjetService } from './declaration-objet.service';
import { CreateDeclarationObjetDto } from './dto/create-declaration-objet.dto';
import { UpdateDeclarationObjetDto } from './dto/update-declaration-objet.dto';

@Controller('declaration-objet')
export class DeclarationObjetController {
  constructor(private readonly declarationObjetService: DeclarationObjetService) {}

  @Post()
  create(@Body() createDeclarationObjetDto: CreateDeclarationObjetDto) {
    return this.declarationObjetService.create(createDeclarationObjetDto);
  }

  @Get()
  findAll() {
    return this.declarationObjetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.declarationObjetService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeclarationObjetDto: UpdateDeclarationObjetDto) {
    return this.declarationObjetService.update(+id, updateDeclarationObjetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.declarationObjetService.remove(+id);
  }
}
