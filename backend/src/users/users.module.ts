import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { FavorisCategorie } from 'src/favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, FavorisCategorie])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
