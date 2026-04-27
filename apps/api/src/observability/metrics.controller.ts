import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MetricsService, TimeWindow, AggregatedMetrics } from './metrics.service';

const VALID_WINDOWS: TimeWindow[] = ['1h', '6h', '24h', '7d', '30d'];

@Controller('api/v1/observability/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Query('window') window?: string,
  ): Promise<AggregatedMetrics> {
    const w = (window ?? '24h') as TimeWindow;
    if (!VALID_WINDOWS.includes(w)) {
      throw new BadRequestException({
        code: 'INVALID_TIME_WINDOW',
        message: `Window must be one of: ${VALID_WINDOWS.join(', ')}`,
      });
    }
    return this.metricsService.aggregate(w);
  }
}
