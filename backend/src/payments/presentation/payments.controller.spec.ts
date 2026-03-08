import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../application/payments.service';
import { PaymentStatus } from '../domain/payment-status.enum';
import { CreatePaymentDto } from '../application/dto/create-payment.dto';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  const mockPayment = {
    id: 'uuid-1',
    status: PaymentStatus.APPROVED,
    totalAmount: 40000,
  };

  const validDto: CreatePaymentDto = {
    productId: 1,
    units: 2,
    cardHolderName: 'Test',
    cardNumber: '4111111111111111',
    cardExp: '12/25',
    cardCvv: '123',
    customerName: 'Test',
    customerEmail: 'test@example.com',
    deliveryAddress: 'Calle 123',
  };

  beforeEach(async () => {
    const mockPaymentsService = {
      createPayment: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get(PaymentsService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create delega en el servicio y retorna el pago cuando Result es ok', async () => {
    service.createPayment.mockResolvedValue({ ok: true, value: mockPayment } as never);
    const result = await controller.create(validDto);
    expect(result).toEqual(mockPayment);
    expect(service.createPayment).toHaveBeenCalledWith(validDto);
  });

  it('create lanza BadRequestException cuando Result es err', async () => {
    service.createPayment.mockResolvedValue({ ok: false, error: 'Producto no encontrado' } as never);
    await expect(controller.create(validDto)).rejects.toThrow(BadRequestException);
  });

  it('findOne delega en el servicio', async () => {
    service.findOne.mockResolvedValue(mockPayment as never);
    const result = await controller.findOne('uuid-1');
    expect(result).toEqual(mockPayment);
    expect(service.findOne).toHaveBeenCalledWith('uuid-1');
  });
});
