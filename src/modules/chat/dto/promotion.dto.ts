import { IsString, IsOptional } from 'class-validator';

export class PromotionDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  validUntil?: string;
}