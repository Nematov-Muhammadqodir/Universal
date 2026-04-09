import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Allow comma-separated origins via CORS_ORIGINS env, fall back to "all" in dev
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : true;
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
  app.use('/uploads', express.static('./uploads'));

  const port = process.env.PORT || process.env.PORT_API || 3000;
  await app.listen(port);
}
bootstrap();
