import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Player-Id',
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
    .setTitle('Hijack Poker Rewards API')
    .setDescription(
      'Loyalty rewards system for the Hijack Poker platform. ' +
      'Players earn points from cash game play, progress through tiers, ' +
      'and track rewards on a web dashboard.',
    )
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'X-Player-Id', in: 'header' },
      'X-Player-Id',
    )
    .addBearerAuth()
    .addTag('Health', 'Service health checks')
    .addTag('Points', 'Points award and history')
    .addTag('Player', 'Player rewards profile')
    .addTag('Leaderboard', 'Monthly leaderboard')
    .addTag('Notifications', 'Player notifications')
    .addTag('Admin', 'Admin operations (role-guarded)')
    .addTag('System', 'System operations (monthly reset)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.PORT || '5000', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Rewards API running on http://0.0.0.0:${port}`);
  console.log(`Swagger UI at http://0.0.0.0:${port}/api`);
}
bootstrap();
