import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageRequest, ChatMessageResponse } from './chat.types';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() request: ChatMessageRequest,
  ): Promise<ChatMessageResponse> {
    if (!request.message || request.message.trim().length === 0) {
      throw new BadRequestException({
        code: 'CHAT_EMPTY_MESSAGE',
        message: 'Message cannot be empty',
      });
    }

    return this.chatService.sendMessage(request);
  }

  @Get('sessions/:sessionId/messages')
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException({
        code: 'CHAT_MISSING_SESSION_ID',
        message: 'Session ID is required',
      });
    }

    return this.chatService.getSessionMessages(sessionId);
  }
}
