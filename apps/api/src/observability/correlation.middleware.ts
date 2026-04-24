import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CorrelationService } from './correlation.service';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly correlationService: CorrelationService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const headerId = req.headers['x-correlation-id'];
    const correlationId = typeof headerId === 'string' ? headerId : undefined;

    this.correlationService.runWithCorrelationId(() => {
      const id = this.correlationService.getCorrelationId();
      if (id) {
        res.setHeader('X-Correlation-Id', id);
      }
      next();
    }, correlationId);
  }
}
