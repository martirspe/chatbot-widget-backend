import { IsString, IsInt, IsOptional } from 'class-validator';

export class ChatRatingDto {
  @IsString()
  sessionId!: string;

  @IsInt()
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}