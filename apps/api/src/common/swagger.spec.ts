import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import request from 'supertest';

@ApiTags('Health')
@Controller('health')
class TestHealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Healthy' })
  check() {
    return { status: 'healthy' };
  }
}

@Module({
  controllers: [TestHealthController],
})
class TestModule {}

describe('Swagger OpenAPI Docs (TASK-045)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = module.createNestApplication();

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nexus AI API')
      .setDescription('REST API for the Nexus AI RAG system')
      .setVersion('0.1.0')
      .addTag('Documents')
      .addTag('Chat')
      .addTag('Queues')
      .addTag('Observability')
      .addTag('Evaluations')
      .addTag('Settings')
      .addTag('Health')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('serves Swagger UI at /api/docs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs')
      .expect(200);

    expect(response.text).toContain('swagger-ui');
  });

  it('serves OpenAPI JSON at /api/docs-json', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(response.body).toHaveProperty('openapi');
    expect(response.body).toHaveProperty('info.title', 'Nexus AI API');
    expect(response.body).toHaveProperty('info.version', '0.1.0');
    expect(response.body).toHaveProperty('paths');
    expect(response.body.paths).toHaveProperty('/health');
  });

  it('includes documented tags in the OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const tags = response.body.tags.map((t: { name: string }) => t.name);
    expect(tags).toContain('Documents');
    expect(tags).toContain('Chat');
    expect(tags).toContain('Queues');
    expect(tags).toContain('Observability');
    expect(tags).toContain('Evaluations');
    expect(tags).toContain('Settings');
    expect(tags).toContain('Health');
  });
});
