import { Controller, Post, Body, Get } from '@nestjs/common';
import { ChatService } from '@modules/chat/application/chat.service';
import { StartSessionResponseDto } from '@modules/chat/dto/start-session-response.dto';
import { ChatMessageDto } from '@modules/chat/dto/chat-message.dto';
import { ChatRatingDto } from '@modules/chat/dto/chat-rating.dto';

// Controlador que expone el endpoint POST /chat/message para procesar mensajes de usuario.
@Controller('chat')
export class ChatController {

  // Inyecta el servicio principal para procesar mensajes de chat.
  constructor(
    private readonly chatService: ChatService
  ) { }

  // Inicia una nueva sesión de chat y retorna el ID de la sesión.
  @Post('start-session')
  async startSession(): Promise<StartSessionResponseDto> {
    const sessionId = await this.chatService.createSession();
    return { sessionId };
  }

  // Procesa el mensaje recibido y retorna la respuesta generada por el servicio de chat.
  @Post('message')
  async message(@Body() dto: ChatMessageDto) {
    return this.chatService.processMessage(dto);
  }

  // Endpoint para transferir la conversación a un agente humano.
  @Post('transfer')
  async transfer(@Body() body: { sessionId?: string }) {
    return this.chatService.transferToAgent(body.sessionId);
  }

  // Obtiene las promociones disponibles.
  @Get('promotions')
  async getPromotions() {
    return await this.chatService.getPromotions();
  }

  // Califica una conversación de chat.
  @Post('rate')
  async rateChat(@Body() dto: ChatRatingDto) {
    return await this.chatService.rateChat(dto);
  }
}
