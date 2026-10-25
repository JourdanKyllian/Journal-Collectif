import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshDto {
  /**
   * Refresh token `idSession.secret`. Mobile : dans le corps. Web : lu depuis le cookie HTTP-Only
   * `refresh_token` quand le corps est vide.
   * @example 0b6f3c1e-8d2a-4f7e-9a1b-2c3d4e5f6a7b.k3J...
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  refresh_token?: string;
}
