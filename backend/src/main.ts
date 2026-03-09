import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
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
  if (process.env.NODE_ENV === 'production') {
    const server = app.getHttpAdapter().getInstance();

    server.get('/api/docs', (req: Request, res: Response) => {
      const protocol = req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http';
      const host = req.headers.host;
      const docsJsonUrl = `${protocol}://${host}/api/docs-json`;
      const editorUrl = `https://editor.swagger.io/?url=${encodeURIComponent(docsJsonUrl)}`;

      res.type('html').send(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Checkout API Docs</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 720px;
        margin: 40px auto;
        padding: 0 16px;
        line-height: 1.5;
      }
      a { color: #0b57d0; }
      code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <h1>Checkout API Docs</h1>
    <p>La interfaz pesada de Swagger UI no se sirve en producción en esta instancia.</p>
    <p><a href="${editorUrl}" target="_blank" rel="noopener">Abrir documentación en Swagger Editor</a></p>
    <p>Si prefieres importarla manualmente, usa esta URL:</p>
    <p><code>${docsJsonUrl}</code></p>
  </body>
</html>`);
    });

    server.get('/api/docs-json', (_req: Request, res: Response) => {
      res.json(document);
    });
  } else {
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Checkout API Docs',
      swaggerOptions: { persistAuthorization: true },
      jsonDocumentUrl: 'api/docs-json',
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Backend escuchando en http://localhost:${port}/api`);
  logger.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();

