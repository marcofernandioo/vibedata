import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  DEFAULT_BACKEND_PORT,
  DEFAULT_FRONTEND_ORIGIN,
} from './config/configuration';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin:
      configService.get<string>('app.frontendOrigin') ??
      DEFAULT_FRONTEND_ORIGIN,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(
    configService.get<number>('app.port') ?? DEFAULT_BACKEND_PORT,
  );
}
void bootstrap();
