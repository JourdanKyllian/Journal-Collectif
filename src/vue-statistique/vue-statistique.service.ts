import { Injectable } from '@nestjs/common';
import { CreateVueStatistiqueDto } from './dto/create-vue-statistique.dto';
import { UpdateVueStatistiqueDto } from './dto/update-vue-statistique.dto';

@Injectable()
export class VueStatistiqueService {
  create(createVueStatistiqueDto: CreateVueStatistiqueDto) {
    return 'This action adds a new vueStatistique';
  }

  findAll() {
    return `This action returns all vueStatistique`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vueStatistique`;
  }

  update(id: number, updateVueStatistiqueDto: UpdateVueStatistiqueDto) {
    return `This action updates a #${id} vueStatistique`;
  }

  remove(id: number) {
    return `This action removes a #${id} vueStatistique`;
  }
}
