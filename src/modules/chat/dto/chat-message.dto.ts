
import { IsOptional, IsString, MinLength } from 'class-validator';
export class ChatMessageDto { @IsString() @MinLength(1) text!: string; @IsOptional() @IsString() sessionId?: string; }
