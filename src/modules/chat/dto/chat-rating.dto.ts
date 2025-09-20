import { IsString, IsInt, IsOptional } from 'class-validator';

// DTO para recibir la calificación y comentarios del chat.
export class ChatRatingDto {
  @IsString()
  sessionId!: string;

  @IsInt()
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}