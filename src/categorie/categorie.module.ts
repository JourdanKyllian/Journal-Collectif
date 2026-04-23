import { Module } from '@nestjs/common';
import { CategoryService } from './categorie.service';
import { CategoryController } from './categorie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/categorie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
