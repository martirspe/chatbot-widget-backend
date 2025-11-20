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
  async transferToAgent(sessionId?: string, userMessage?: string) {
    try {
      const sid = await this.repo.ensureSession(sessionId);
      if (userMessage && userMessage.trim()) {
        await this.repo.addMessage({ role: 'user', message: userMessage, sessionId: sid });
      }
      await this.repo.addMessage({
        role: 'system',
        message: '[Solicitud de transferencia a agente humano]',
        sessionId: sid,
        metadata: { type: 'transfer_request', source: userMessage ? 'user-intent' : 'system', detectedAt: new Date().toISOString() }
      });
      // Idempotencia básica: evitar múltiples avisos en ventana corta
      const key = `agent_transfer:${sid}`;
      const already = await this.redis.get(key);
      if (!already) {
        await this.redis.set(key, 'requested', 'EX', 1800); // 30 min
        // Publica eventos para sistemas externos (contact center, notificador, etc.)
        await this.redis.publish('agent_transfer_requested', JSON.stringify({ sessionId: sid, ts: Date.now() }));
        await this.redis.publish('agent_transfer_status', JSON.stringify({ sessionId: sid, status: 'requested', ts: Date.now() }));
      }
      // Auditoría persistente (si existe userId en la sesión)
      await this.repo.recordAgentTransfer(sid, 'requested');
      return { sessionId: sid, response: 'Un agente humano se pondrá en contacto contigo en breve.' };
    } catch (error) {
      return { sessionId: sessionId, response: 'El agente se comunicará contigo pronto.' };
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

  // Finaliza una sesión de chat (soft close) sin borrar datos.
  async endSession(sessionId?: string): Promise<{ status: string }>{
    try {
      if (!sessionId) return { status: 'noop' };
      await this.repo.closeSession(sessionId);
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Error cerrando sesión ${sessionId}: ${formatError(error)}`);
      return { status: 'error' };
    }
  }

  // Obtiene el estado de transferencia a agente humano
  async getTransferStatus(sessionId?: string): Promise<{ sessionId?: string; status: 'none' | 'requested' | 'assigned' | 'completed' }>{
    if (!sessionId) return { status: 'none' };
    const sid = sessionId;
    const key = `agent_transfer:${sid}`;
    const val = await this.redis.get(key);
    const status = (val as 'requested' | 'assigned' | 'completed' | null) || 'none';
    return { sessionId: sid, status };
  }

  // Establece el estado de transferencia (para integración con contact center)
  async setTransferStatus(sessionId: string, status: 'requested' | 'assigned' | 'completed'): Promise<{ sessionId: string; status: string }>{
    const sid = await this.repo.ensureSession(sessionId);
    const key = `agent_transfer:${sid}`;
    // Mantener TTL si ya existe; sino asignar uno por defecto
    const ttl = await this.redis.ttl(key);
    if (ttl && ttl > 0) {
      await this.redis.set(key, status, 'EX', ttl);
    } else {
      await this.redis.set(key, status, 'EX', 1800);
    }
    await this.redis.publish('agent_transfer_status', JSON.stringify({ sessionId: sid, status, ts: Date.now() }));
    // Auditoría persistente (si existe userId en la sesión)
    await this.repo.recordAgentTransfer(sid, status);
    return { sessionId: sid, status };
  }
}
