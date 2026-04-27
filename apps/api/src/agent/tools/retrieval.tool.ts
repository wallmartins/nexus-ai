import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../../rag/retrieval.service';
import { Tool, ToolInput, ToolResult } from './tool.types';

@Injectable()
export class RetrievalTool implements Tool {
  readonly name = 'retrieval';

  constructor(private readonly retrievalService: RetrievalService) {}

  async invoke(input: ToolInput): Promise<ToolResult> {
    try {
      const chunks = await this.retrievalService.retrieve({ query: input.query });
      return { toolName: this.name, output: chunks };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { toolName: this.name, output: [], error: message };
    }
  }
}
