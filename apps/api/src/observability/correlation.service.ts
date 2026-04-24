import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

type CorrelationContext = {
  correlationId: string;
};

@Injectable()
export class CorrelationService {
  private readonly storage = new AsyncLocalStorage<CorrelationContext>();

  runWithCorrelationId<T>(callback: () => T, correlationId?: string): T {
    const id = correlationId ?? this.generateId();
    return this.storage.run({ correlationId: id }, callback);
  }

  getCorrelationId(): string | undefined {
    const store = this.storage.getStore();
    return store?.correlationId;
  }

  private generateId(): string {
    return randomUUID();
  }
}
