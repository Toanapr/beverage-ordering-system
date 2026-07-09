import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Beverage Ordering API")
    .setDescription("API documentation for Beverage Ordering System")
    .setVersion("1.0")
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
