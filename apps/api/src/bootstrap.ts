import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ENV } from './config/config.module';
import type { Env } from './config/env';

/** Shared by main.ts and the integration tests so tests exercise the real HTTP configuration. */
export function configureApp(app: INestApplication, env: Env) {
  const express = app as NestExpressApplication;
  express.set('trust proxy', 1); // behind a platform proxy; required for correct client IPs in rate limiting
  express.disable('x-powered-by');
  app.use(helmet());
  app.enableCors({
    origin: env.API_CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    maxAge: 600,
  });
  app.enableShutdownHooks();
}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  configureApp(app, app.get<Env>(ENV));
  return app;
}
