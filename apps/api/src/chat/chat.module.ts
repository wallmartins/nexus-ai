import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AgentModule } from '../agent/agent.module';
import { DatabaseModule } from '../database/database.module';
import { MemoryModule } from '../memory/memory.module';
import { ObservabilityModule } from '../observability/observability.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    AgentModule,
    DatabaseModule,
    MemoryModule,
    ObservabilityModule,
    LlmModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
