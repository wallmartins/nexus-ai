import { Test, TestingModule } from '@nestjs/testing';
import { ToolRegistry } from './tool-registry.service';
import { LoggerService } from '../../observability/logger.service';
import { Tool, ToolInput, ToolResult } from './tool.types';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  const loggerService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolRegistry,
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    registry = module.get<ToolRegistry>(ToolRegistry);
  });

  it('instantiates with empty tool list', () => {
    expect(registry).toBeDefined();
    expect(registry.list()).toEqual([]);
  });

  describe('register', () => {
    it('registers a tool', () => {
      const tool: Tool = {
        name: 'test-tool',
        invoke: jest.fn(),
      };

      registry.register(tool);

      expect(registry.list()).toContain('test-tool');
      expect(registry.has('test-tool')).toBe(true);
      expect(loggerService.info).toHaveBeenCalledWith(
        'Tool registered: test-tool',
        expect.objectContaining({ service: 'tool-registry', eventType: 'tool.register' }),
      );
    });

    it('warns on duplicate registration', () => {
      const tool: Tool = {
        name: 'test-tool',
        invoke: jest.fn(),
      };

      registry.register(tool);
      registry.register(tool);

      expect(loggerService.warn).toHaveBeenCalledWith(
        'Tool "test-tool" is being re-registered',
        expect.objectContaining({ service: 'tool-registry', eventType: 'tool.register.overwrite' }),
      );
    });
  });

  describe('invoke', () => {
    it('invokes a registered tool and returns result', async () => {
      const tool: Tool = {
        name: 'echo',
        invoke: jest.fn().mockResolvedValue({
          toolName: 'echo',
          output: 'hello',
        } as ToolResult),
      };

      registry.register(tool);

      const result = await registry.invoke('echo', {
        query: 'hello',
        correlationId: 'corr-1',
      });

      expect(tool.invoke).toHaveBeenCalledWith({
        query: 'hello',
        correlationId: 'corr-1',
      });
      expect(result.output).toBe('hello');
      expect(loggerService.info).toHaveBeenCalledWith(
        'Tool invoking: echo',
        expect.objectContaining({ service: 'tool-registry', eventType: 'tool.invoke.start', correlationId: 'corr-1' }),
      );
    });

    it('returns error for unregistered tool', async () => {
      const result = await registry.invoke('missing', {
        query: 'test',
        correlationId: 'corr-2',
      });

      expect(result.toolName).toBe('missing');
      expect(result.output).toBeNull();
      expect(result.error).toBe('Tool "missing" not found');
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Tool not found: missing',
        expect.objectContaining({ service: 'tool-registry', eventType: 'tool.invoke.not_found' }),
      );
    });

    it('catches and logs tool exceptions', async () => {
      const tool: Tool = {
        name: 'broken',
        invoke: jest.fn().mockRejectedValue(new Error('Tool crash')),
      };

      registry.register(tool);

      const result = await registry.invoke('broken', {
        query: 'test',
        correlationId: 'corr-3',
      });

      expect(result.toolName).toBe('broken');
      expect(result.output).toBeNull();
      expect(result.error).toBe('Tool crash');
      expect(loggerService.error).toHaveBeenCalledWith(
        'Tool failed: broken',
        expect.any(Error),
        expect.objectContaining({ service: 'tool-registry', eventType: 'tool.invoke.error', correlationId: 'corr-3' }),
      );
    });
  });
});
