import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthResult, AuthService, SessionContext } from './auth.service';
import { AuthenticatedUser } from './jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { LOGIN_ACCOUNT, LOGIN_IP, REFRESH_IP } from './auth.throttle';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { SkipTenantGate } from '../tenant/skip-tenant-gate.decorator';

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

const DEVICE_ID = /^[A-Za-z0-9._:-]{1,100}$/;

/**
 * Authentification hybride :
 * - `X-Client: mobile` → jetons dans le corps JSON, à renvoyer en `Authorization: Bearer`.
 * - sinon → cookies HTTP-Only (le navigateur ne voit jamais les jetons).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private isMobile(req: Request): boolean {
    return req.headers['x-client']?.toString().toLowerCase() === 'mobile';
  }

  private sessionContext(req: Request): SessionContext {
    const userAgent = req.headers['user-agent'];
    const deviceId = req.headers['x-device-id'];
    return {
      ip: req.ip?.slice(0, 45),
      userAgent:
        typeof userAgent === 'string' ? userAgent.slice(0, 255) : undefined,
      deviceId:
        typeof deviceId === 'string' && DEVICE_ID.test(deviceId)
          ? deviceId
          : undefined,
    };
  }

  private get cookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      // 'none' est obligatoire pour que Vercel puisse envoyer le cookie à Render
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      path: '/',
    };
  }

  private setCookies(res: Response, result: AuthResult): void {
    res.cookie('access_token', result.accessToken, {
      ...this.cookieOptions,
      maxAge: result.accessTtlMs,
    });
    if (result.refreshToken) {
      res.cookie('refresh_token', result.refreshToken, {
        ...this.cookieOptions,
        maxAge: result.refreshTtlMs,
      });
    }
  }

  private clearCookies(res: Response): void {
    res.cookie('access_token', '', { ...this.cookieOptions, maxAge: 0 });
    res.cookie('refresh_token', '', { ...this.cookieOptions, maxAge: 0 });
  }

  private mobilePayload(result: AuthResult) {
    return {
      token_type: 'Bearer',
      access_token: result.accessToken,
      expires_in: Math.floor(result.accessTtlMs / 1000),
      // Absent si la rotation a été ignorée : le client garde alors son refresh token actuel.
      ...(result.refreshToken ? { refresh_token: result.refreshToken } : {}),
      session_id: result.sessionId,
    };
  }

  private readRefreshToken(req: Request, dto: RefreshDto): string | undefined {
    if (dto.refresh_token) return dto.refresh_token;
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const cookie = cookies?.['refresh_token'];
    return typeof cookie === 'string' ? cookie : undefined;
  }

  @Post('login')
  @SkipTenantGate()
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ [REFRESH_IP]: true })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      this.sessionContext(req),
    );

    if (this.isMobile(req)) return this.mobilePayload(result);

    this.setCookies(res, result);
    return { message: 'Connexion réussie' };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @SkipTenantGate()
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ [LOGIN_IP]: true, [LOGIN_ACCOUNT]: true })
  async refresh(
    @Body() refreshDto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const mobile = this.isMobile(req);
    const token = this.readRefreshToken(req, refreshDto);

    try {
      if (!token) throw new UnauthorizedException('Refresh token manquant.');
      const result = await this.authService.refresh(
        token,
        this.sessionContext(req),
      );

      if (mobile) return this.mobilePayload(result);

      this.setCookies(res, result);
      return { message: 'Session renouvelée avec succès' };
    } catch (error) {
      // Session morte : le navigateur doit cesser d'envoyer ces cookies.
      if (!mobile) this.clearCookies(res);
      throw error;
    }
  }

  /**
   * Déconnecte l'appareil courant. Fonctionne aussi avec un access token expiré,
   * pourvu que le refresh token (cookie ou corps) prouve la possession de la session.
   */
  @Post('logout')
  @SkipTenantGate()
  @UseGuards(OptionalJwtAuthGuard)
  async logout(
    @Body() refreshDto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Renseigné par OptionalJwtAuthGuard si l'access token est encore valide.
    const sessionId = (req.user as AuthenticatedUser | null | undefined)
      ?.sessionId;
    if (sessionId) {
      await this.authService.logout(sessionId);
    } else {
      const token = this.readRefreshToken(req, refreshDto);
      if (token) await this.authService.logoutWithRefreshToken(token);
    }

    if (!this.isMobile(req)) this.clearCookies(res);
    return { message: 'Déconnexion réussie' };
  }

  /**
   * Endpoint de validation de session renvoyant les informations de profil agrégées.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: RequestWithUser) {
    return this.authService.getMe(req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('security')
  updateSecurity(
    @Req() req: RequestWithUser,
    @Body() updateSecurityDto: UpdateSecurityDto,
  ) {
    return this.authService.updateSecurity(
      req.user.userId,
      updateSecurityDto,
      req.user.sessionId,
    );
  }
}
