jest.mock('pino', () => {
  const mockPinoFn = jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }));

  (mockPinoFn as any).stdTimeFunctions = {
    isoTime: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockPinoFn,
    stdTimeFunctions: {
      isoTime: jest.fn(),
    },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';
import { LoggerService } from './logger.service';
import { CorrelationService } from './correlation.service';

const mockedPino = jest.mocked(pino);

describe('LoggerService', () => {
  let logger: LoggerService;
  let correlationService: CorrelationService;

  beforeEach(async () => {
    mockedPino.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        CorrelationService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'NODE_ENV') return 'test';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    logger = module.get<LoggerService>(LoggerService);
    correlationService = module.get<CorrelationService>(CorrelationService);
  });

  it('instantiates', () => {
    expect(logger).toBeDefined();
  });

  describe('logging with correlation ID', () => {
    it('includes correlation ID in info log', () => {
      correlationService.runWithCorrelationId(() => {
        logger.info('Test message', { key: 'value' });

        const pinoInstance = mockedPino.mock.results[0].value as any;
        expect(pinoInstance.info).toHaveBeenCalledTimes(1);
        const [context, message] = pinoInstance.info.mock.calls[0];
        expect(message).toBe('Test message');
        expect(context.correlationId).toBeDefined();
        expect(context.key).toBe('value');
      });
    });

    it('includes correlation ID in warn log', () => {
      correlationService.runWithCorrelationId(() => {
        logger.warn('Warning message');

        const pinoInstance = mockedPino.mock.results[0].value as any;
        expect(pinoInstance.warn).toHaveBeenCalledTimes(1);
        const [context] = pinoInstance.warn.mock.calls[0];
        expect(context.correlationId).toBeDefined();
      });
    });

    it('includes error details in error log', () => {
      correlationService.runWithCorrelationId(() => {
        const error = new Error('Something broke');
        logger.error('Error occurred', error, { service: 'test' });

        const pinoInstance = mockedPino.mock.results[0].value as any;
        expect(pinoInstance.error).toHaveBeenCalledTimes(1);
        const [context, message] = pinoInstance.error.mock.calls[0];
        expect(message).toBe('Error occurred');
        expect(context.correlationId).toBeDefined();
        expect(context.service).toBe('test');
        expect(context.error).toBeDefined();
        expect(context.error.message).toBe('Something broke');
      });
    });

    it('handles error log without Error object', () => {
      correlationService.runWithCorrelationId(() => {
        logger.error('Simple error');

        const pinoInstance = mockedPino.mock.results[0].value as any;
        expect(pinoInstance.error).toHaveBeenCalledTimes(1);
        const [context, message] = pinoInstance.error.mock.calls[0];
        expect(message).toBe('Simple error');
        expect(context.error).toBeUndefined();
      });
    });

    it('includes correlation ID in debug log', () => {
      correlationService.runWithCorrelationId(() => {
        logger.debug('Debug message');

        const pinoInstance = mockedPino.mock.results[0].value as any;
        expect(pinoInstance.debug).toHaveBeenCalledTimes(1);
        const [context] = pinoInstance.debug.mock.calls[0];
        expect(context.correlationId).toBeDefined();
      });
    });
  });

  describe('logging without correlation ID', () => {
    it('logs with undefined correlationId outside context', () => {
      logger.info('No context message');

      const pinoInstance = mockedPino.mock.results[0].value as any;
      expect(pinoInstance.info).toHaveBeenCalledTimes(1);
      const [context, message] = pinoInstance.info.mock.calls[0];
      expect(message).toBe('No context message');
      expect(context.correlationId).toBeUndefined();
    });
  });
});
