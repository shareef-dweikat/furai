import type { INestApplication } from '@nestjs/common';
import { API_GLOBAL_PREFIX } from '@furai/shared';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  });
}
