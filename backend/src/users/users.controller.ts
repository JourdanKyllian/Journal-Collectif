import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Controller de gestion des utilisateurs
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Créer un nouvel utilisateur, seulement accessible par un 'Admin'
   * @param createUserDto 
   * @returns 
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Post()
  async create(@Body() createUserDto: any) {
    return {message: "Route de création d'utilisateur atteinte avec succès par l'Admin !"};
  }
  
}