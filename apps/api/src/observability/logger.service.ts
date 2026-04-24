import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';
import { CorrelationService } from './correlation.service';
import { LogPersistenceService } from './log-persistence.service';

export type LogContext = {
  [key: string]: unknown;
};

const LOG_LEVELS = ['info', 'warn', 'error', 'debug'] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function toString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function isLogLevel(level: string): level is LogLevel {
  for (const l of LOG_LEVELS) {
    if (l === level) return true;
  }
  return false;
}

@Injectable()
export class LoggerService {
  private readonly logger: pino.Logger;

  constructor(
    private readonly config: ConfigService,
    private readonly correlationService: CorrelationService,
    private readonly logPersistence: LogPersistenceService,
  ) {
    const isDev = config.get<string>('NODE_ENV') === 'development';

    this.logger = pino({
      level: isDev ? 'debug' : 'info',
      formatters: {
        level: (label: string) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...(isDev && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    });
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? { error: { message: error.message, stack: error.stack, name: error.name } }
      : {};
    this.log('error', message, { ...context, ...errorContext });
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  private log(level: pino.Level, message: string, context?: LogContext): void {
    const correlationId = this.correlationService.getCorrelationId();
    this.logger[level]({ correlationId, ...context }, message);

    const safeLevel = isLogLevel(level) ? level : 'info';

    void this.logPersistence
      .writeLog({
        correlationId: correlationId ?? 'unknown',
        level: safeLevel,
        service: toString(context?.service, 'app'),
        eventType: toString(context?.eventType, 'log'),
        payload: { message, ...(context ?? {}) },
      })
      .catch((err: unknown) => {
        this.logger.error(
          { correlationId, persistenceError: err instanceof Error ? err.message : String(err) },
          'Log persistence failed',
        );
      });
  }
}
