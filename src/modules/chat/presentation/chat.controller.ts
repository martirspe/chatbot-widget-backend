
import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from '../application/chat.service';
import { ChatMessageDto } from '../dto/chat-message.dto';

@Controller('chat')
export class ChatController {

  constructor(
    private readonly chatService: ChatService
  ) { }

  @Post('message') async message(@Body() dto: ChatMessageDto) {
    return this.chatService.processMessage(dto);
  }

}
