import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Player-Id, Accept',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hijack Poker Streaks API')
    .setDescription(
      'Daily engagement system for the Hijack Poker platform. ' +
      'Track login and play streaks, earn milestone rewards, ' +
      'and protect progress with streak freezes.',
    )
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'X-Player-Id', in: 'header' },
      'X-Player-Id',
    )
    .addTag('Health', 'Service health checks')
    .addTag('Streaks', 'Streak check-in and state')
    .addTag('Calendar', 'Calendar heat map data')
    .addTag('Rewards', 'Streak milestone rewards')
    .addTag('Freezes', 'Streak freeze management')
    .addTag('Internal', 'Internal endpoints for game processor')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.PORT || '5001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Streaks API running on http://0.0.0.0:${port}`);
  console.log(`Swagger UI at http://0.0.0.0:${port}/api`);
}
bootstrap();
