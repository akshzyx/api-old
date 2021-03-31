// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix(process.env.API_PREFIX || '');
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.API_PORT || 3000);
}
bootstrap();
