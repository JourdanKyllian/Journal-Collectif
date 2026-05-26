import { Injectable } from '@nestjs/common';
import { CreateDeclarationObjetDto } from './dto/create-declaration-objet.dto';
import { UpdateDeclarationObjetDto } from './dto/update-declaration-objet.dto';

@Injectable()
export class DeclarationObjetService {
  create(createDeclarationObjetDto: CreateDeclarationObjetDto) {
    return 'This action adds a new declarationObjet';
  }

  findAll() {
    return `This action returns all declarationObjet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} declarationObjet`;
  }

  update(id: number, updateDeclarationObjetDto: UpdateDeclarationObjetDto) {
    return `This action updates a #${id} declarationObjet`;
  }

  remove(id: number) {
    return `This action removes a #${id} declarationObjet`;
  }
}
