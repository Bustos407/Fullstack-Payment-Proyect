import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './application/payments.service';
import { PaymentsController } from './presentation/payments.controller';
import { Payment } from './infrastructure/typeorm/payment.entity';
import { ProductsModule } from '../products/products.module';
import { WompiClient } from './infrastructure/wompi/wompi.client';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), ProductsModule, ConfigModule],
  providers: [
    {
      provide: WompiClient,
      useFactory: (config: ConfigService) => {
        const privateKey = config.get<string>('WOMPI_PRIVATE_KEY');
        const integritySecret = config.get<string>('WOMPI_INTEGRITY_SECRET');
        const baseUrl = config.get<string>('WOMPI_BASE_URL', 'https://sandbox.wompi.co/v1');
        if (!privateKey || !integritySecret) return null;
        return new WompiClient(baseUrl, privateKey, integritySecret);
      },
      inject: [ConfigService],
    },
    PaymentsService,
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}

