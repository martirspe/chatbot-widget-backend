import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { Message } from '@modules/chat/domain/message.interface';
import { ChatRatingDto } from '@modules/chat/dto/chat-rating.dto';

// Repositorio para gestionar sesiones y mensajes de chat en la base de datos.
@Injectable()
export class ChatRepository {

  // Inyecta el servicio Prisma para acceso a la base de datos.
  constructor(
    private readonly prisma: PrismaService
  ) { }

  // Asegura que exista una sesión y crea una nueva si no se proporciona sessionId.
  async ensureSession(sessionId?: string): Promise<string> {
    if (sessionId) {
      // Si enviaron un sessionId, validar que no esté cerrada
      const existing = await this.prisma.session.findUnique({
        where: { id: sessionId },
        select: { id: true, endedAt: true }
      });
      if (existing && !existing.endedAt) return existing.id;
      // Si no existe o está cerrada, crear una nueva
    }
    const s = await this.prisma.session.create({ data: {} });
    return s.id;
  }

  // Agrega un mensaje a la base de datos asociado a una sesión.
  async addMessage(m: Message): Promise<void> {
    await this.prisma.message.create({
      data: {
        role: m.role,
        message: m.message,
        sessionId: m.sessionId,
        metadata: m.metadata
      }
    });
  }

  // Guarda una calificación de chat en la base de datos.
  async saveRating(dto: ChatRatingDto): Promise<void> {
    await this.prisma.chatRating.create({
      data: {
        sessionId: dto.sessionId,
        rating: dto.rating,
        comment: dto.comment
      }
    });
  }

  // Marca la sesión como finalizada (soft close) sin borrar datos.
  async closeSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { endedAt: new Date() }
    });
  }

  // Registra un evento de transferencia en AgentTransfer cuando haya userId
  async recordAgentTransfer(sessionId: string, _event: 'requested' | 'assigned' | 'completed'): Promise<void> {
    if (!sessionId) return;
    const s = await this.prisma.session.findUnique({ where: { id: sessionId }, select: { userId: true } });
    if (!s?.userId) return; // si no hay usuario asociado, omitir
    await this.prisma.agentTransfer.create({ data: { userId: s.userId, sessionId } });
  }
}
