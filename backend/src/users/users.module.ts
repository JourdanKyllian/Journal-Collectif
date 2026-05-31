import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { FavorisCategorie } from '../favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';
import { Role } from '../roles/entities/roles.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, FavorisCategorie, Role])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
