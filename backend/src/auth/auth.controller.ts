import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  Get,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Configuration centralisée pour la sécurité de nos cookies
  private get cookieOptions() {
    return {
      httpOnly: true, // Invisible pour le JavaScript côté client
      secure: process.env.NODE_ENV === 'production', // Uniquement sur HTTPS en production
      sameSite: 'lax' as const, // Protection CSRF
      path: '/', // Disponible sur tout le site
    };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    // On injecte les cookies dans la réponse HTTP
    res.cookie('access_token', tokens.access_token, {
      ...this.cookieOptions,
      maxAge: 1000 * 60 * 60, // 1 heure
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      ...this.cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    });

    return { message: 'Connexion réussie' };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  async refresh(
    @Body() refreshDto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshToken(
      refreshDto.refresh_token,
    );

    res.cookie('access_token', tokens.access_token, {
      ...this.cookieOptions,
      maxAge: 1000 * 60 * 60,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      ...this.cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { message: 'Session renouvelée avec succès' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.userId);

    // Pour déconnecter l'utilisateur, on écrase les cookies avec une date d'expiration à 0
    res.cookie('access_token', '', { ...this.cookieOptions, maxAge: 0 });
    res.cookie('refresh_token', '', { ...this.cookieOptions, maxAge: 0 });

    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: RequestWithUser) {
    const roleName = req.user.role;
    return {
      name: roleName === 'Admin' ? 'Admin Chalonnais' : 'Citoyen',
      email: req.user.email,
      role: roleName === 'Admin' ? 'admin' : 'user',
    };
  }
}
