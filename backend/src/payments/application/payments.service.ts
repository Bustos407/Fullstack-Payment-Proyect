import { Injectable, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../infrastructure/typeorm/payment.entity';
import { PaymentStatus } from '../domain/payment-status.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentWompiDto } from './dto/create-payment-wompi.dto';
import { ProductsService } from '../../products/application/products.service';
import { WompiClient, IWompiClient } from '../infrastructure/wompi/wompi.client';
import { calculateTotal } from './constants';
import { Result, ok, err } from './result';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly productsService: ProductsService,
    @Optional()
    @Inject(WompiClient)
    private readonly wompiClient: IWompiClient | null,
  ) {}

  private async simulateWompiAuthorization(_: CreatePaymentDto, totalAmount: number): Promise<PaymentStatus> {
    if (totalAmount > 1000000) {
      return PaymentStatus.REJECTED;
    }
    return PaymentStatus.APPROVED;
  }

  /** Flujo mock: reserva stock y simula respuesta (sin API Wompi). ROP: retorna Result en lugar de lanzar. */
  async createPayment(dto: CreatePaymentDto): Promise<Result<Payment, string>> {
    try {
      const product = await this.productsService.reserveStock(dto.productId, dto.units);
      const subtotal = Number(product.price) * dto.units;
      const totalAmount = calculateTotal(subtotal);
      const status = await this.simulateWompiAuthorization(dto, totalAmount);

      const payment = this.paymentsRepository.create({
        product,
        units: dto.units,
        totalAmount,
        status,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        deliveryAddress: dto.deliveryAddress,
      });

      const saved = await this.paymentsRepository.save(payment);
      return ok(saved);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear el pago';
      return err(message);
    }
  }

  /** Flujo real: crea transacción PENDING, llama API Wompi, actualiza según resultado. */
  async createPaymentWithWompi(dto: CreatePaymentWompiDto): Promise<Payment> {
    const product = await this.productsService.findOne(dto.productId);
    const subtotal = Number(product.price) * dto.units;
    const totalAmount = calculateTotal(subtotal);
    const amountInCents = Math.round(totalAmount * 100);

    const payment = this.paymentsRepository.create({
      product,
      units: dto.units,
      totalAmount,
      status: PaymentStatus.PENDING,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      deliveryAddress: dto.deliveryAddress,
    });
    const saved = await this.paymentsRepository.save(payment);

    if (!this.wompiClient) {
      throw new Error('Wompi no configurado: defina WOMPI_PRIVATE_KEY y WOMPI_INTEGRITY_SECRET');
    }

    const wompiRes = await this.wompiClient.createTransaction({
      reference: saved.id,
      amountInCents,
      customerEmail: dto.customerEmail,
      acceptanceToken: dto.acceptanceToken,
      acceptPersonalAuth: dto.acceptPersonalAuth,
      cardToken: dto.cardToken,
      installments: dto.installments ?? 1,
    });

    const wompiId = wompiRes.data?.id;
    if (!wompiId) {
      await this.paymentsRepository.update(saved.id, { status: PaymentStatus.REJECTED });
      const updated = await this.paymentsRepository.findOne({ where: { id: saved.id } });
      return updated!;
    }

    await this.paymentsRepository.update(saved.id, { wompiTransactionId: wompiId });

    const finalStatus = await this.pollWompiUntilFinal(wompiId);
    const ourStatus = finalStatus === 'APPROVED' ? PaymentStatus.APPROVED : PaymentStatus.REJECTED;

    if (ourStatus === PaymentStatus.APPROVED) {
      await this.productsService.reserveStock(dto.productId, dto.units);
    }

    await this.paymentsRepository.update(saved.id, { status: ourStatus });
    const finalPayment = await this.paymentsRepository.findOne({ where: { id: saved.id } });
    return finalPayment!;
  }

  private async pollWompiUntilFinal(wompiId: string, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await this.wompiClient!.getTransaction(wompiId);
      const status = res.data?.status ?? '';
      if (this.wompiClient!.isFinalStatus(status)) {
        return status;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return 'ERROR';
  }

  async findOne(id: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({ where: { id } });
  }
}

