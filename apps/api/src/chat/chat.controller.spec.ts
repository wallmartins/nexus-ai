import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { BadRequestException } from '@nestjs/common';

describe('ChatController', () => {
  let controller: ChatController;

  const chatService = {
    sendMessage: jest.fn(),
    getSessionMessages: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/v1/chat', () => {
    it('should send a message and return assistant response', async () => {
      const request = {
        message: 'What is the refund policy?',
      };

      chatService.sendMessage.mockResolvedValue({
        sessionId: 'session-1',
        messageId: 'msg-1',
        role: 'assistant',
        content: 'You can request a refund within 30 days.',
        sources: [],
        latencyMs: 1200,
        tokens: { input: 400, output: 100 },
        correlationId: 'corr-123',
      });

      const result = await controller.sendMessage(request);

      expect(result.sessionId).toBe('session-1');
      expect(result.content).toBe('You can request a refund within 30 days.');
      expect(chatService.sendMessage).toHaveBeenCalledWith(request);
    });

    it('should reject empty messages', async () => {
      const request = { message: '' };

      await expect(controller.sendMessage(request)).rejects.toThrow(
        BadRequestException,
      );

      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only messages', async () => {
      const request = { message: '   ' };

      await expect(controller.sendMessage(request)).rejects.toThrow(
        BadRequestException,
      );

      expect(chatService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/chat/sessions/:sessionId/messages', () => {
    it('should return session messages', async () => {
      chatService.getSessionMessages.mockResolvedValue([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          sources: [],
          latencyMs: null,
          tokens: { input: 0, output: 0 },
          correlationId: 'corr-1',
          modelProvider: '',
          modelName: '',
          createdAt: new Date(),
        },
      ]);

      const result = await controller.getSessionMessages('session-1');

      expect(result).toHaveLength(1);
      expect(chatService.getSessionMessages).toHaveBeenCalledWith('session-1');
    });
  });
});
