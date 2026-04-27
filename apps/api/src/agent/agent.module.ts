import { Module } from '@nestjs/common';
import { DecisionAgent } from './decision-agent.service';
import { SynthesisWorkflow } from './synthesis-workflow.service';
import { LlmModule } from '../llm/llm.module';
import { SettingsModule } from '../settings/settings.module';
import { ObservabilityModule } from '../observability/observability.module';
import { RagModule } from '../rag/rag.module';
import { MemoryModule } from '../memory/memory.module';

@Module({
  imports: [LlmModule, SettingsModule, ObservabilityModule, RagModule, MemoryModule],
  providers: [DecisionAgent, SynthesisWorkflow],
  exports: [DecisionAgent, SynthesisWorkflow],
})
export class AgentModule {}
