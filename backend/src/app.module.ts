import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { Product } from './products/infrastructure/typeorm/product.entity';
import { Payment } from './payments/infrastructure/typeorm/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USER || 'wompi',
        password: process.env.DB_PASSWORD || 'wompi',
        database: process.env.DB_NAME || 'wompi_db',
        entities: [Product, Payment],
        synchronize: true,
      }),
    }),
    ProductsModule,
    PaymentsModule,
  ],
})
export class AppModule {}

