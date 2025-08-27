import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChatRepository } from '../infrastructure/chat.repository';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { RagService } from '../../rag/application/rag.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';

@Injectable()
export class ChatService {
  constructor(
    private readonly repo: ChatRepository,
    private readonly rag: RagService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async processMessage({ text, sessionId }: ChatMessageDto) {
    try {
      const cacheKey = `chat:${sessionId}:${text}`;
      const cached = await this.getCachedMessage(cacheKey);
      if (cached && cached.startsWith('{')) {
        const { reply, documents } = JSON.parse(cached);
        return { sessionId, reply, documents };
      }

      const sid = await this.repo.ensureSession(sessionId);
      await this.repo.addMessage({ role: 'user', text, sessionId: sid });
      const { reply, documents } = await this.rag.answer(text);
      await this.repo.addMessage({ role: 'assistant', text: reply, sessionId: sid });

      // Guarda tanto reply como documents en el cache
      await this.cacheMessage(cacheKey, JSON.stringify({ reply, documents }));

      return { sessionId: sid, reply, documents };
    } catch (error) {
      console.error('Error en processMessage:', error);
      throw new InternalServerErrorException('Error procesando el mensaje');
    }
  }

  async cacheMessage(key: string, value: string) {
    await this.redis.set(key, value, 'EX', 3600); // Expira en 1 hora
  }

  async getCachedMessage(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

}
