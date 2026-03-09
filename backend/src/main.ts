import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpLoggingInterceptor } from './common/http-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.use(helmet());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('REST API for products, payments and stock. Integration with payment gateway in Sandbox.')
    .setVersion('1.0')
    .addTag('products', 'Products and stock')
    .addTag('payments', 'Payments and transactions')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Checkout API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Backend escuchando en http://localhost:${port}/api`);
  logger.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();

