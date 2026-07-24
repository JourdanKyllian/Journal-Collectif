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

/**
 * Contrôleur exposant les endpoints liés à l'authentification et à la gestion de session.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Retourne la configuration stricte des cookies (HTTPOnly, SameSite, Secure).
   */
  private get cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
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

    res.cookie('access_token', tokens.access_token, {
      ...this.cookieOptions,
      maxAge: 1000 * 60 * 60,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      ...this.cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7,
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

    res.cookie('access_token', '', { ...this.cookieOptions, maxAge: 0 });
    res.cookie('refresh_token', '', { ...this.cookieOptions, maxAge: 0 });

    return { message: 'Déconnexion réussie' };
  }

  /**
   * Endpoint de validation de session renvoyant les informations de profil agrégées.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: RequestWithUser) {
    return this.authService.getMe(req.user.userId);
  }
}
