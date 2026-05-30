import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Category } from './entities/categorie.entity';
import { CreateCategoryDto } from './dto/create-categorie.dto';
import { UpdateCategoryDto } from './dto/update-categorie.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.categoryRepository.findOne({
      where: { libelle: createCategoryDto.libelle },
    });

    if (existing) {
      throw new ConflictException(
        `La catégorie "${createCategoryDto.libelle}" existe déjà.`,
      );
    }

    const newCategory = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(newCategory);
  }

  findAll() {
    return this.categoryRepository.find();
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id } as FindOptionsWhere<Category>,
    });

    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const updatedCategory = Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(updatedCategory);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    return { message: `La catégorie #${id} a été supprimée avec succès.` };
  }
}
