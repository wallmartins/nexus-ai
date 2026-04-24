import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationMiddleware } from './correlation.middleware';
import { CorrelationService } from './correlation.service';

describe('CorrelationMiddleware', () => {
  let middleware: CorrelationMiddleware;
  let correlationService: CorrelationService;

  const mockNext = jest.fn();
  const mockSetHeader = jest.fn();

  beforeEach(async () => {
    mockNext.mockClear();
    mockSetHeader.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationService, CorrelationMiddleware],
    }).compile();

    middleware = module.get<CorrelationMiddleware>(CorrelationMiddleware);
    correlationService = module.get<CorrelationService>(CorrelationService);
  });

  it('instantiates', () => {
    expect(middleware).toBeDefined();
  });

  it('generates correlation ID when header is absent', () => {
    const req = { headers: {} } as any;
    const res = { setHeader: mockSetHeader } as any;

    middleware.use(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockSetHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      expect.any(String),
    );
  });

  it('uses correlation ID from request header', () => {
    const req = { headers: { 'x-correlation-id': 'existing-id-123' } } as any;
    const res = { setHeader: mockSetHeader } as any;

    middleware.use(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockSetHeader).toHaveBeenCalledWith('X-Correlation-Id', 'existing-id-123');
  });

  it('ignores non-string header values', () => {
    const req = { headers: { 'x-correlation-id': ['invalid'] } } as any;
    const res = { setHeader: mockSetHeader } as any;

    middleware.use(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockSetHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      expect.any(String),
    );
  });
});
