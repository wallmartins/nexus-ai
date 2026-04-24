import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CorrelationService } from './correlation.service';
import { CorrelationMiddleware } from './correlation.middleware';
import { LoggerService } from './logger.service';

@Module({
  providers: [CorrelationService, LoggerService],
  exports: [CorrelationService, LoggerService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
