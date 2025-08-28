import { Module } from '@nestjs/common';
import { ChatController } from './presentation/chat.controller';
import { ChatService } from './application/chat.service';
import { ChatRepository } from './infrastructure/chat.repository';
import { RagModule } from '../rag/rag.module';

// Módulo de chat que agrupa controlador, servicio y repositorio, e importa RagModule para respuestas contextuales.
@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule { }
