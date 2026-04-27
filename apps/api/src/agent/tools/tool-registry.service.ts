import { Injectable } from '@nestjs/common';
import { Tool, ToolInput, ToolResult } from './tool.types';
import { LoggerService } from '../../observability/logger.service';

@Injectable()
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  constructor(private readonly logger: LoggerService) {}

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool "${tool.name}" is being re-registered`, {
        service: 'tool-registry',
        eventType: 'tool.register.overwrite',
      });
    }

    this.tools.set(tool.name, tool);

    this.logger.info(`Tool registered: ${tool.name}`, {
      service: 'tool-registry',
      eventType: 'tool.register',
      toolName: tool.name,
    });
  }

  async invoke(toolName: string, input: ToolInput): Promise<ToolResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      this.logger.warn(`Tool not found: ${toolName}`, {
        service: 'tool-registry',
        eventType: 'tool.invoke.not_found',
        toolName,
        correlationId: input.correlationId,
      });

      return {
        toolName,
        output: null,
        error: `Tool "${toolName}" not found`,
      };
    }

    this.logger.info(`Tool invoking: ${toolName}`, {
      service: 'tool-registry',
      eventType: 'tool.invoke.start',
      toolName,
      correlationId: input.correlationId,
    });

    try {
      const result = await tool.invoke(input);

      this.logger.info(`Tool completed: ${toolName}`, {
        service: 'tool-registry',
        eventType: 'tool.invoke.complete',
        toolName,
        correlationId: input.correlationId,
        hasError: !!result.error,
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error(`Tool failed: ${toolName}`, error, {
        service: 'tool-registry',
        eventType: 'tool.invoke.error',
        toolName,
        correlationId: input.correlationId,
      });

      return {
        toolName,
        output: null,
        error: error.message,
      };
    }
  }

  list(): string[] {
    return Array.from(this.tools.keys());
  }

  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }
}
