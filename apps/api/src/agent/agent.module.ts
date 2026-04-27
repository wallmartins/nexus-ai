import { Module } from '@nestjs/common';
import { DecisionAgent } from './decision-agent.service';
import { SynthesisWorkflow } from './synthesis-workflow.service';
import { ToolRegistry } from './tools/tool-registry.service';
import { RetrievalTool } from './tools/retrieval.tool';
import { CalculatorTool } from './tools/calculator.tool';
import { LlmModule } from '../llm/llm.module';
import { SettingsModule } from '../settings/settings.module';
import { ObservabilityModule } from '../observability/observability.module';
import { RagModule } from '../rag/rag.module';
import { MemoryModule } from '../memory/memory.module';

@Module({
  imports: [LlmModule, SettingsModule, ObservabilityModule, RagModule, MemoryModule],
  providers: [DecisionAgent, SynthesisWorkflow, ToolRegistry, RetrievalTool, CalculatorTool],
  exports: [DecisionAgent, SynthesisWorkflow, ToolRegistry],
})
export class AgentModule {}
