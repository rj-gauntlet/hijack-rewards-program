import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from './app.module';

let cachedHandler: ReturnType<typeof serverless> | null = null;

async function bootstrapExpress(): Promise<express.Express> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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

  await app.init();
  return expressApp;
}

export const handler = async (event: unknown, context: unknown): Promise<unknown> => {
  if (!cachedHandler) {
    const expressApp = await bootstrapExpress();
    cachedHandler = serverless(expressApp);
  }
  return cachedHandler(event as object, context as object);
};
