import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CorrelationService } from './correlation.service';
import { CorrelationMiddleware } from './correlation.middleware';
import { LoggerService } from './logger.service';
import { LogPersistenceService } from './log-persistence.service';
import { ObservabilityController } from './observability.controller';

@Module({
  controllers: [ObservabilityController],
  providers: [CorrelationService, LoggerService, LogPersistenceService],
  exports: [CorrelationService, LoggerService, LogPersistenceService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
