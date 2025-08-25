
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Message } from '../domain/message.entity';

@Injectable() export class ChatRepository {

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async ensureSession(sessionId?: string): Promise<string> {
    if (sessionId) return sessionId;
    const s = await this.prisma.session.create({ data: {} });
    return s.id;
  }

  async addMessage(m: Message): Promise<void> {
    await this.prisma.message.create({ data: { role: m.role, text: m.text, sessionId: m.sessionId } });
  }

}
