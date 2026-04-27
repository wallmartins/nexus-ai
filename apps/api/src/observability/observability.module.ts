import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CorrelationService } from './correlation.service';
import { CorrelationMiddleware } from './correlation.middleware';
import { LoggerService } from './logger.service';
import { LogPersistenceService } from './log-persistence.service';
import { ObservabilityController } from './observability.controller';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [ObservabilityController, MetricsController],
  providers: [CorrelationService, LoggerService, LogPersistenceService, MetricsService],
  exports: [CorrelationService, LoggerService, LogPersistenceService, MetricsService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
