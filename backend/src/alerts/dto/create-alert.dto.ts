import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @IsIn(['urgent', 'info', 'event'])
  type!: string;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  @MaxLength(500)
  message!: string;

  @IsOptional()
  startDate?: string | null;

  @IsOptional()
  endDate?: string | null;
}
