import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { RagService } from '@modules/rag/application/rag.service';
import { formatError } from '@common/utils/error.utils';
import { ChatRepository } from '@modules/chat/infrastructure/chat.repository';
import { ChatMessageDto } from '@modules/chat/dto/chat-message.dto';
import { PromotionDto } from '@modules/chat/dto/promotion.dto';
import { ChatRatingDto } from '@modules/chat/dto/chat-rating.dto';

// Servicio principal para procesar mensajes de chat, gestionar sesiones y cachear respuestas.
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  // Inyecta repositorio, servicio RAG y cliente Redis.
  constructor(
    private readonly repo: ChatRepository,
    private readonly rag: RagService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  // Crea una nueva sesión de chat y devuelve su ID.
  async createSession(): Promise<string> {
    return await this.repo.ensureSession();
  }

  // Procesa el mensaje, gestiona sesión, consulta RAG y cachea la respuesta.
  async processMessage(dto: ChatMessageDto) {
    try {
      const { message, sessionId, source, topK, minScore } = dto;
      const cacheKey = `chat:${sessionId}:${message}:${source ?? ''}:${topK}:${minScore}`;
      const cached = await this.getCachedMessage(cacheKey);
      if (cached && cached.startsWith('{')) {
        const { response, documents } = JSON.parse(cached);
        return { sessionId, response, documents };
      }

      const sid = await this.repo.ensureSession(sessionId);
      await this.repo.addMessage({ role: 'user', message, sessionId: sid });
      const { response, documents } = await this.rag.answer(message, topK, minScore);
      await this.repo.addMessage({ role: 'assistant', message: response, sessionId: sid });

      await this.cacheMessage(cacheKey, JSON.stringify({ response, documents }));

      return { sessionId: sid, response, documents };
    } catch (error) {
      this.logger.error(`Error en processMessage: ${formatError(error)}`);
      throw new InternalServerErrorException('Error procesando el mensaje');
    }
  }

  // Guarda una respuesta en el cache Redis con expiración de 1 hora.
  async cacheMessage(key: string, value: string) {
    await this.redis.set(key, value, 'EX', 3600);
  }

  // Obtiene una respuesta cacheada desde Redis.
  async getCachedMessage(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  // Marca la sesión para transferencia a un agente humano.
  async transferToAgent(sessionId?: string) {
    try {
      const sid = await this.repo.ensureSession(sessionId);
      await this.repo.addMessage({
        role: 'user',
        message: '[Solicitud de transferencia a agente humano]',
        sessionId: sid
      });
      return {
        sessionId: sid,
        message: 'Un agente humano se pondrá en contacto contigo en breve.'
      };
    } catch (error) {
      return {
        sessionId: sessionId,
        message: 'El agente se comunicará contigo pronto.'
      };
    }
  }

  async getPromotions(): Promise<PromotionDto[]> {
    // Aquí puedes consultar la base de datos, un API externa, etc.
    // Ejemplo estático:
    return [
      {
        title: 'Descuento 20% en todo sandalias',
        description: 'Aprovecha nuestro descuento especial hasta el 30 de septiembre.',
        validUntil: '2025-09-30',
        url: 'https://marrso.com/promociones'
      },
      {
        title: 'Descuento 50% en todo botines',
        description: 'Aprovecha nuestro descuento especial hasta el 30 de septiembre.',
        validUntil: '2025-09-30',
        url: 'https://marrso.com/promociones'
      }
    ];
  }

  async rateChat(dto: ChatRatingDto): Promise<{ status: string; response: string }> {
    try {
      await this.repo.saveRating(dto);
      this.logger.log(`Calificación guardada correctamente para sesión: ${dto.sessionId ?? 'desconocida'}`);
      return { status: 'success', response: 'Gracias por calificar nuestro servicio.' };
    } catch (error) {
      const formattedError = formatError(error);
      this.logger.error(`Error guardando calificación para sesión: ${dto.sessionId ?? 'desconocida'} - ${formattedError}`);
      return { status: 'error', response: 'No se pudo guardar la calificación. Inténtalo de nuevo más tarde.' };
    }
  }
}
