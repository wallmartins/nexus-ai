import { Controller, Get, Query } from '@nestjs/common';
import {
  LogPersistenceService,
  LogQueryFilters,
} from './log-persistence.service';

@Controller('api/v1/observability')
export class ObservabilityController {
  constructor(
    private readonly logPersistence: LogPersistenceService,
  ) {}

  @Get('logs')
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
