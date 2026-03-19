import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Route ouverte à tous
  @Post('login')
  async login(@Body() body: any) { // Utiliser un DTO au lieu de "any"
    return this.authService.login(body.email, body.password);
  }

  // Route protégée : Il faut juste être connecté (peu importe le rôle)
  @UseGuards(JwtAuthGuard)
  @Get('profil')
  getProfile(@Request() req) {
    return req.user; // Renvoie les infos décodées du Token
  }

  // Route ultra-protégée : Il faut être connecté ET être Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('admin-dashboard')
  getDashboard() {
    return { message: 'Bienvenue boss !' };
  }
}