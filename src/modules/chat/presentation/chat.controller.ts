import { Controller, Post, Body, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { ChatService } from '@modules/chat/application/chat.service';
import { StartSessionResponseDto } from '@modules/chat/dto/start-session-response.dto';
import { ChatMessageDto } from '@modules/chat/dto/chat-message.dto';
import { ChatRatingDto } from '@modules/chat/dto/chat-rating.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { Observable } from 'rxjs';

// Controlador que expone el endpoint POST /chat/message para procesar mensajes de usuario.
@Controller('chat')
export class ChatController {

  // Inyecta el servicio principal para procesar mensajes de chat.
  constructor(
    private readonly chatService: ChatService,
    @InjectRedis() private readonly redis: Redis,
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
  async transfer(@Body() body: { sessionId?: string; message?: string }) {
    // Devuelve siempre { sessionId, response }
    return this.chatService.transferToAgent(body.sessionId, body.message);
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

  // Finaliza una sesión de chat y elimina sus datos.
  @Post('end-session')
  async endSession(@Body() body: { sessionId?: string }) {
    return await this.chatService.endSession(body.sessionId);
  }

  // Estado de transferencia a agente
  @Get('transfer-status')
  async getTransferStatus(@Query('sessionId') sessionId?: string) {
    return await this.chatService.getTransferStatus(sessionId);
  }

  // (Opcional) Actualizar estado de transferencia desde sistemas externos
  @Post('transfer-status')
  async setTransferStatus(@Body() body: { sessionId: string; status: 'requested' | 'assigned' | 'completed' }) {
    return await this.chatService.setTransferStatus(body.sessionId, body.status);
  }

  // Stream de estado de transferencia por SSE
  @Sse('transfer-stream')
  transferStream(@Query('sessionId') sessionId?: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>(observer => {
      if (!sessionId) {
        observer.next({ data: { status: 'none' } });
        observer.complete?.();
        return;
      }

      // Enviar estado actual al conectar
      this.chatService.getTransferStatus(sessionId).then(s => observer.next({ data: s })).catch(() => {
        observer.next({ data: { sessionId, status: 'none' } });
      });

      // Suscribirse a eventos de estado en Redis
      const sub = this.redis.duplicate();
      const channel = 'agent_transfer_status';
      const onMessage = (_: string, raw: string) => {
        try {
          const evt = JSON.parse(raw);
          if (evt && evt.sessionId === sessionId) {
            observer.next({ data: { sessionId, status: evt.status } });
          }
        } catch { /* noop */ }
      };
      sub.on('message', onMessage);
      sub.subscribe(channel).catch(() => { /* noop */ });

      return async () => {
        try {
          sub.off('message', onMessage);
          await sub.unsubscribe(channel);
          sub.disconnect();
        } catch { /* noop */ }
      };
    });
  }
}
