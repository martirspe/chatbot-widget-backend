import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from '../application/chat.service';
import { ChatMessageDto } from '../dto/chat-message.dto';

// Controlador que expone el endpoint POST /chat/message para procesar mensajes de usuario.
@Controller('chat')
export class ChatController {

  // Inyecta el servicio principal para procesar mensajes de chat.
  constructor(
    private readonly chatService: ChatService
  ) { }

  // Procesa el mensaje recibido y retorna la respuesta generada por el servicio de chat.
  @Post('message')
  async message(@Body() dto: ChatMessageDto) {
    return this.chatService.processMessage(dto);
  }
}
