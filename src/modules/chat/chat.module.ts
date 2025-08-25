
import { Module } from '@nestjs/common';
import { ChatController } from './presentation/chat.controller';
import { ChatService } from './application/chat.service';
import { ChatRepository } from './infrastructure/chat.repository';
import { RagModule } from '../rag/rag.module';
@Module({ imports: [RagModule], controllers: [ChatController], providers: [ChatService, ChatRepository] })
export class ChatModule {}
