import { Module } from '@nestjs/common';
import { ChatController } from '@modules/chat/presentation/chat.controller';
import { ChatService } from '@modules/chat/application/chat.service';
import { ChatRepository } from '@modules/chat/infrastructure/chat.repository';
import { RagModule } from '@modules/rag/rag.module';
import { ChatInactivityService } from '@modules/chat/application/chat-inactivity.service';

// Módulo de chat que agrupa controlador, servicio y repositorio, e importa RagModule para respuestas contextuales.
@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, ChatInactivityService],
})
export class ChatModule { }
