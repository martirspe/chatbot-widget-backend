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
    if (sessionId) return sessionId;
    const s = await this.prisma.session.create({ data: {} });
    return s.id;
  }

  // Agrega un mensaje a la base de datos asociado a una sesión.
  async addMessage(m: Message): Promise<void> {
    await this.prisma.message.create({
      data: {
        role: m.role,
        message: m.message,
        sessionId: m.sessionId
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
}
