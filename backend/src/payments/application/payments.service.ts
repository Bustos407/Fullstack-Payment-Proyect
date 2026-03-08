import { Injectable, Inject } from '@nestjs/common';
import { PaymentsDynamoRepository } from '../infrastructure/dynamodb/payments.dynamodb.repository';
import { PaymentStatus } from '../domain/payment-status.enum';
import { CreatePaymentWompiDto } from './dto/create-payment-wompi.dto';
import { ProductsService } from '../../products/application/products.service';
import { WompiClient, IWompiClient } from '../infrastructure/wompi/wompi.client';
import { calculateTotal } from './constants';

export interface PaymentResponse {
  id: string;
  productId: number;
  units: number;
  totalAmount: string;
  status: PaymentStatus;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  wompiTransactionId: string | null;
  /** Timestamp in milliseconds (epoch). */
  createdAt: number;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsDynamoRepository,
    private readonly productsService: ProductsService,
    @Inject(WompiClient)
    private readonly wompiClient: IWompiClient,
  ) {}

  /** Creates a payment using Wompi Sandbox API. */
  async createPaymentWithWompi(dto: CreatePaymentWompiDto): Promise<PaymentResponse> {
    const product = await this.productsService.findOne(dto.productId);
    const subtotal = Number(product.price) * dto.units;
    const totalAmount = calculateTotal(subtotal);
    const amountInCents = Math.round(totalAmount * 100);

    const saved = await this.paymentsRepository.create({
      productId: dto.productId,
      units: dto.units,
      totalAmount,
      status: PaymentStatus.PENDING,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      deliveryAddress: dto.deliveryAddress,
    });

    try {
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
        await this.paymentsRepository.updateStatus(saved.id, PaymentStatus.REJECTED);
        const updated = await this.paymentsRepository.findById(saved.id);
        return this.toResponse(updated ?? saved);
      }

      await this.paymentsRepository.updateWompiTransactionId(saved.id, wompiId);

      const finalStatus = await this.pollWompiUntilFinal(wompiId);
      const ourStatus = finalStatus === 'APPROVED' ? PaymentStatus.APPROVED : PaymentStatus.REJECTED;

      if (ourStatus === PaymentStatus.APPROVED) {
        await this.productsService.reserveStock(dto.productId, dto.units);
      }

      await this.paymentsRepository.updateStatus(saved.id, ourStatus);
      const finalPayment = await this.paymentsRepository.findById(saved.id);
      return this.toResponse(finalPayment ?? { ...saved, status: ourStatus });
    } catch (error) {
      await this.paymentsRepository.updateStatus(saved.id, PaymentStatus.REJECTED);
      throw error;
    }
  }

  private toResponse(record: { id: string; productId: number; units: number; totalAmount: string; status: PaymentStatus; customerName: string; customerEmail: string; deliveryAddress: string; wompiTransactionId?: string | null; createdAt: number | string }): PaymentResponse {
    const createdAt = typeof record.createdAt === 'number' ? record.createdAt : new Date(record.createdAt).getTime();
    return {
      id: record.id,
      productId: record.productId,
      units: record.units,
      totalAmount: record.totalAmount,
      status: record.status,
      customerName: record.customerName,
      customerEmail: record.customerEmail,
      deliveryAddress: record.deliveryAddress,
      wompiTransactionId: record.wompiTransactionId ?? null,
      createdAt,
    };
  }

  private async pollWompiUntilFinal(wompiId: string, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await this.wompiClient.getTransaction(wompiId);
      const status = res.data?.status ?? '';
      if (this.wompiClient.isFinalStatus(status)) {
        return status;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return 'ERROR';
  }

  async findOne(id: string): Promise<PaymentResponse | null> {
    const record = await this.paymentsRepository.findById(id);
    return record ? this.toResponse(record) : null;
  }
}
