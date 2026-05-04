import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = NestFactory.create(AppModule);
  const instance = await app;

  // Allow up to 5 MB bodies so base64-encoded logo images fit
  instance.use(json({ limit: '5mb' }));
  instance.use(urlencoded({ extended: true, limit: '5mb' }));

  instance.setGlobalPrefix('api/v1');
  instance.enableCors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.WEBSITE_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  });
  instance.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await instance.listen(process.env.PORT ?? 3002);
  console.log(`TAMS API running on port ${process.env.PORT ?? 3002}`);
}
bootstrap();
