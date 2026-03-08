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
        const privateKey = config.get<string>('WOMPI_PRIVATE_KEY', 'prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg');
        const integritySecret = config.get<string>('WOMPI_INTEGRITY_SECRET', 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp');
        const baseUrl = config.get<string>('WOMPI_BASE_URL', 'https://api-sandbox.co.uat.wompi.dev/v1');
        return new WompiClient(baseUrl, privateKey, integritySecret);
      },
      inject: [ConfigService],
    },
    PaymentsService,
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}

