import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoDbModule } from './common/dynamodb/dynamodb.module';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DynamoDbModule,
    ProductsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
