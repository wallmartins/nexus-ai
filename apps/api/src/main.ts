import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nexus AI API')
    .setDescription('REST API for the Nexus AI RAG system')
    .setVersion('0.1.0')
    .addTag('Documents', 'Document upload and management')
    .addTag('Chat', 'Conversational AI with RAG')
    .addTag('Queues', 'Async job processing status')
    .addTag('Observability', 'Logs, metrics, and tracing')
    .addTag('Evaluations', 'Evaluation pipeline runs')
    .addTag('Settings', 'System configuration')
    .addTag('Health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
