import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ChatRepository } from '../infrastructure/chat.repository';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { RagService } from '../../rag/application/rag.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { formatError } from '../../../common/utils/error.utils';

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

  // Procesa el mensaje, gestiona sesión, consulta RAG y cachea la respuesta.
  async processMessage(dto: ChatMessageDto) {
    try {
      const { text, sessionId, source, topK = 1, minScore = 0.7 } = dto;
      const cacheKey = `chat:${sessionId}:${text}:${source ?? ''}:${topK}:${minScore}`;
      const cached = await this.getCachedMessage(cacheKey);
      if (cached && cached.startsWith('{')) {
        const { reply, documents } = JSON.parse(cached);
        return { sessionId, reply, documents };
      }

      const sid = await this.repo.ensureSession(sessionId);
      await this.repo.addMessage({ role: 'user', text, sessionId: sid });
      const { reply, documents } = await this.rag.answer(text, topK, minScore, source);
      await this.repo.addMessage({ role: 'assistant', text: reply, sessionId: sid });

      await this.cacheMessage(cacheKey, JSON.stringify({ reply, documents }));

      return { sessionId: sid, reply, documents };
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

}
