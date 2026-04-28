import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  LogPersistenceService,
  LogQueryFilters,
} from './log-persistence.service';
import { LogQueryResultDto, MetricsResponseDto } from './observability.dto';

@ApiTags('Observability')
@Controller('api/v1/observability')
export class ObservabilityController {
  constructor(
    private readonly logPersistence: LogPersistenceService,
  ) {}

  @Get('logs')
  @ApiOperation({ summary: 'Query log entries' })
  @ApiQuery({ name: 'correlationId', required: false, description: 'Filter by correlation ID' })
  @ApiQuery({ name: 'start', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'end', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'from', required: false, description: 'Alias for start' })
  @ApiQuery({ name: 'to', required: false, description: 'Alias for end' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by log level' })
  @ApiQuery({ name: 'eventType', required: false, description: 'Filter by event type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Pagination limit' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiResponse({ status: 200, description: 'Log query results', type: LogQueryResultDto })
  async getLogs(
    @Query('correlationId') correlationId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('level') level?: string,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: LogQueryFilters = {
      correlationId,
      level,
      eventType,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const fromDate = from ?? start;
    const toDate = to ?? end;

    if (fromDate) filters.start = new Date(fromDate);
    if (toDate) filters.end = new Date(toDate);

    return this.logPersistence.queryLogs(filters);
  }
}
