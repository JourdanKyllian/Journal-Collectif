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
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
