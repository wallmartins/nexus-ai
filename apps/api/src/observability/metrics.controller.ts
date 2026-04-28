import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  MetricsService,
  TimeWindow,
  Granularity,
  MetricsResponse,
  AggregatedMetrics,
} from './metrics.service';
import { MetricsResponseDto } from './observability.dto';

const VALID_WINDOWS: TimeWindow[] = ['1h', '6h', '24h', '7d', '30d'];
const VALID_GRANULARITIES: Granularity[] = ['hour', 'day'];

@ApiTags('Observability')
@Controller('api/v1/observability/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated metrics' })
  @ApiQuery({ name: 'window', required: false, description: 'Preset time window', enum: ['1h', '6h', '24h', '7d', '30d'] })
  @ApiQuery({ name: 'from', required: false, description: 'Custom range start (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Custom range end (ISO 8601)' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Time series granularity', enum: ['hour', 'day'] })
  @ApiResponse({ status: 200, description: 'Aggregated metrics', type: MetricsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getMetrics(
    @Query('window') window?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: string,
  ): Promise<MetricsResponse | (AggregatedMetrics & { window: string })> {
    if (window) {
      const w = window as TimeWindow;
      if (!VALID_WINDOWS.includes(w)) {
        throw new BadRequestException({
          code: 'INVALID_TIME_WINDOW',
          message: `Window must be one of: ${VALID_WINDOWS.join(', ')}`,
        });
      }
      return this.metricsService.aggregate(w);
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    if (!fromDate || !toDate) {
      throw new BadRequestException({
        code: 'MISSING_DATE_RANGE',
        message:
          'Provide either a window parameter or both from and to date parameters',
      });
    }

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException({
        code: 'INVALID_DATE_FORMAT',
        message: 'from and to must be valid ISO 8601 date strings',
      });
    }

    if (fromDate > toDate) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'from date must be before or equal to to date',
      });
    }

    if (granularity) {
      const g = granularity as Granularity;
      if (!VALID_GRANULARITIES.includes(g)) {
        throw new BadRequestException({
          code: 'INVALID_GRANULARITY',
          message: `Granularity must be one of: ${VALID_GRANULARITIES.join(', ')}`,
        });
      }
      return this.metricsService.aggregateTimeSeries(fromDate, toDate, g);
    }

    const summary = await this.metricsService.aggregateRange(fromDate, toDate);
    return {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      summary,
    };
  }
}
