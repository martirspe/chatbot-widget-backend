import { IsString, IsOptional } from 'class-validator';

// DTO para recibir los datos de una promoción.
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