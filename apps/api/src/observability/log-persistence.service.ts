import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface LogEntryInput {
  correlationId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface LogQueryFilters {
  correlationId?: string;
  start?: Date;
  end?: Date;
  level?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LogPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async writeLog(entry: LogEntryInput): Promise<void> {
    await this.prisma.logEntry.create({
      data: {
        correlationId: entry.correlationId,
        level: entry.level,
        service: entry.service,
        eventType: entry.eventType,
        payload: entry.payload,
      },
    });
  }

  async queryLogs(filters: LogQueryFilters) {
    const {
      correlationId,
      start,
      end,
      level,
      eventType,
      limit = 50,
      offset = 0,
    } = filters;

    const where: Record<string, unknown> = {};
    if (correlationId) where.correlationId = correlationId;
    if (level) where.level = level;
    if (eventType) where.eventType = eventType;
    if (start || end) {
      where.timestamp = {};
      if (start) (where.timestamp as Record<string, Date>).gte = start;
      if (end) (where.timestamp as Record<string, Date>).lte = end;
    }

    const [data, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.logEntry.count({ where }),
    ]);

    return { data, total, limit, offset };
  }
}
