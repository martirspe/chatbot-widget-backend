import { IsOptional, IsString, MinLength } from 'class-validator';

// DTO para recibir el mensaje, la sesión y parámetros de búsqueda en el chat.
export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  topK?: number;

  @IsOptional()
  minScore?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
