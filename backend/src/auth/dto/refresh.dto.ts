import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  /**
   * Le Refresh Token stocké côté client
   * @example eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}