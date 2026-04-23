import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VueStatistiqueService } from './vue-statistique.service';
import { CreateVueStatistiqueDto } from './dto/create-vue-statistique.dto';
import { UpdateVueStatistiqueDto } from './dto/update-vue-statistique.dto';

@Controller('vue-statistique')
export class VueStatistiqueController {
  constructor(private readonly vueStatistiqueService: VueStatistiqueService) {}

  @Post()
  create(@Body() createVueStatistiqueDto: CreateVueStatistiqueDto) {
    return this.vueStatistiqueService.create(createVueStatistiqueDto);
  }

  @Get()
  findAll() {
    return this.vueStatistiqueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vueStatistiqueService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVueStatistiqueDto: UpdateVueStatistiqueDto) {
    return this.vueStatistiqueService.update(+id, updateVueStatistiqueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vueStatistiqueService.remove(+id);
  }
}
