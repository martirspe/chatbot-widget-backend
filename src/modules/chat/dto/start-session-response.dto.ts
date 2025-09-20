import { IsString } from 'class-validator';

// DTO para la respuesta al iniciar una nueva sesión de chat.
export class StartSessionResponseDto {
  @IsString()
  sessionId!: string;
}