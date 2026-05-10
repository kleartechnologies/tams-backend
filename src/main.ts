import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');

  console.log('PORT:', process.env.PORT);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

  const instance = await NestFactory.create(AppModule, { rawBody: true });

  // Health check bypasses global prefix and auth guards — required by Railway
  instance.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Allow up to 5 MB bodies so base64-encoded logo images fit
  instance.use(json({ limit: '5mb' }));
  instance.use(urlencoded({ extended: true, limit: '5mb' }));

  instance.setGlobalPrefix('api/v1');
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.WEBSITE_URL,
    'https://frontend-alpha-two-92.vercel.app',
    'https://tams-website.vercel.app',
    'http://localhost:3000',
    'http://localhost:3005',
  ].filter(Boolean) as string[];

  instance.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  instance.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  // '0.0.0.0' is required — Railway's load balancer cannot reach 127.0.0.1
  await instance.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port}`);
}
bootstrap();
