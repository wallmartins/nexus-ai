import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.schema';
import { AgentModule } from './agent/agent.module';
import { ChatModule } from './chat/chat.module';
import { DatabaseModule } from './database/database.module';
import { DocumentsModule } from './documents/documents.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { HealthModule } from './health/health.module';
import { LlmModule } from './llm/llm.module';
import { MemoryModule } from './memory/memory.module';
import { ObservabilityModule } from './observability/observability.module';
import { QueueModule } from './queue/queue.module';
import { RagModule } from './rag/rag.module';
import { RedisModule } from './redis/redis.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ObservabilityModule,
    AgentModule,
    ChatModule,
    DatabaseModule,
    DocumentsModule,
    EmbeddingsModule,
    HealthModule,
    LlmModule,
    MemoryModule,
    QueueModule,
    RagModule,
    RedisModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
