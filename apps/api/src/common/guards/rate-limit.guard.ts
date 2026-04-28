import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: {
      limit: number;
      ttl: number;
      key: string;
      tracker: string;
      totalHits: number;
      timeToExpire: number;
      isBlocked: boolean;
      timeToBlockExpire: number;
    },
  ): Promise<void> {
    const { res } = this.getRequestResponse(context);
    res.header('Retry-After', Math.ceil(throttlerLimitDetail.timeToBlockExpire / 1000));
    await super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
