import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationService } from './correlation.service';

describe('CorrelationService', () => {
  let service: CorrelationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorrelationService],
    }).compile();

    service = module.get<CorrelationService>(CorrelationService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  it('generates a correlation ID when none is provided', () => {
    service.runWithCorrelationId(() => {
      const id = service.getCorrelationId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  it('uses provided correlation ID', () => {
    const providedId = 'custom-correlation-id-123';
    service.runWithCorrelationId(() => {
      const id = service.getCorrelationId();
      expect(id).toBe(providedId);
    }, providedId);
  });

  it('returns undefined when outside async context', () => {
    expect(service.getCorrelationId()).toBeUndefined();
  });

  it('isolates correlation IDs between nested contexts', () => {
    const outerId = 'outer-id';
    const innerId = 'inner-id';

    service.runWithCorrelationId(() => {
      expect(service.getCorrelationId()).toBe(outerId);

      service.runWithCorrelationId(() => {
        expect(service.getCorrelationId()).toBe(innerId);
      }, innerId);

      expect(service.getCorrelationId()).toBe(outerId);
    }, outerId);
  });
});
