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

  const cdnOrigins = ['https://cdn.jsdelivr.net', 'https://unpkg.com'];
  app.use(
    helmet({
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'", ...cdnOrigins],
          'script-src': ["'self'", "'unsafe-inline'", ...cdnOrigins],
          'style-src': ["'self'", "'unsafe-inline'", ...cdnOrigins],
          'connect-src': ["'self'", ...cdnOrigins],
          'img-src': ["'self'", 'data:', ...cdnOrigins],
          'font-src': ["'self'", ...cdnOrigins],
        },
      },
    }),
  );
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
  const swaggerUiBase = 'https://unpkg.com/swagger-ui-dist@5.9.0';
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Checkout API Docs',
    customCssUrl: `${swaggerUiBase}/swagger-ui.css`,
    customJs: [
      `${swaggerUiBase}/swagger-ui-bundle.js`,
      `${swaggerUiBase}/swagger-ui-standalone-preset.js`,
    ],
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/></svg>',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Backend escuchando en http://localhost:${port}/api`);
  logger.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();

