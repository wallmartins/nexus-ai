import { Module } from '@nestjs/common';
import { DecisionAgent } from './decision-agent.service';
import { LlmModule } from '../llm/llm.module';
import { SettingsModule } from '../settings/settings.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [LlmModule, SettingsModule, ObservabilityModule],
  providers: [DecisionAgent],
  exports: [DecisionAgent],
})
export class AgentModule {}
