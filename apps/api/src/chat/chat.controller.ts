import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatMessageRequest, ChatMessageResponse } from './chat.types';
import { throttlerConfig } from '../config/throttler.config';
import { ChatMessageRequestDto, ChatMessageResponseDto } from './chat.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiBody({ type: ChatMessageRequestDto })
  @ApiResponse({ status: 200, description: 'Assistant response', type: ChatMessageResponseDto })
  @ApiResponse({ status: 400, description: 'Empty message or validation error' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  @Throttle({
    default: {
      limit: throttlerConfig.chat.limit,
      ttl: throttlerConfig.chat.ttl,
    },
  })
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
  @ApiOperation({ summary: 'Get messages for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'List of session messages' })
  @ApiResponse({ status: 400, description: 'Missing session ID' })
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
