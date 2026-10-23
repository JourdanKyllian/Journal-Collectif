import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetVerificationDto {
  @ApiProperty({ description: 'Compte vérifié (peut proposer des articles)' })
  @IsBoolean()
  verified!: boolean;
}
