import { Controller, Get, HttpStatus, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, Throttle, SkipThrottle } from '@nestjs/throttler';
import request from 'supertest';
import { RateLimitGuard } from './rate-limit.guard';

@Controller('test')
class TestController {
  @Post('chat')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  chat() {
    return { ok: true };
  }

  @Post('upload')
  @Throttle({ default: { limit: 1, ttl: 60_000 } })
  upload() {
    return { ok: true };
  }

  @Get('health')
  @SkipThrottle()
  health() {
    return { ok: true };
  }
}

describe('RateLimitGuard', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60_000,
            limit: 10_000,
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: RateLimitGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /test/chat', () => {
    it('allows requests up to the limit', async () => {
      await request(app.getHttpServer())
        .post('/test/chat')
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/test/chat')
        .expect(HttpStatus.CREATED);
    });

    it('returns 429 with Retry-After header when limit is exceeded', async () => {
      await request(app.getHttpServer()).post('/test/chat').expect(HttpStatus.CREATED);
      await request(app.getHttpServer()).post('/test/chat').expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/test/chat')
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      expect(response.headers['retry-after']).toBeDefined();
      expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    });
  });

  describe('POST /test/upload', () => {
    it('allows a single request within the limit', async () => {
      await request(app.getHttpServer())
        .post('/test/upload')
        .expect(HttpStatus.CREATED);
    });

    it('returns 429 when limit is exceeded', async () => {
      await request(app.getHttpServer()).post('/test/upload').expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/test/upload')
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      expect(response.headers['retry-after']).toBeDefined();
    });
  });

  describe('GET /test/health', () => {
    it('does not apply rate limiting', async () => {
      for (let i = 0; i < 12; i++) {
        await request(app.getHttpServer())
          .get('/test/health')
          .expect(HttpStatus.OK);
      }
    });
  });
});
