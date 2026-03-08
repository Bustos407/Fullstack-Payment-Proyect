import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from '../application/payments.service';
import { PaymentStatus } from '../domain/payment-status.enum';
import { CreatePaymentWompiDto } from '../application/dto/create-payment-wompi.dto';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  const mockPayment = {
    id: 'uuid-1',
    status: PaymentStatus.APPROVED,
    totalAmount: 40000,
  };

  const validDto: CreatePaymentWompiDto = {
    productId: 1,
    units: 2,
    cardToken: 'tok_xxx',
    acceptanceToken: 'accept_xxx',
    acceptPersonalAuth: 'auth_xxx',
    customerName: 'Test',
    customerEmail: 'test@example.com',
    deliveryAddress: 'Calle 123',
  };

  beforeEach(async () => {
    const mockPaymentsService = {
      createPaymentWithWompi: jest.fn(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to createPaymentWithWompi and returns the payment', async () => {
    service.createPaymentWithWompi.mockResolvedValue(mockPayment as never);
    const result = await controller.create(validDto);
    expect(result).toEqual(mockPayment);
    expect(service.createPaymentWithWompi).toHaveBeenCalledWith(validDto);
  });

  it('findOne delegates to the service', async () => {
    service.findOne.mockResolvedValue(mockPayment as never);
    const result = await controller.findOne('uuid-1');
    expect(result).toEqual(mockPayment);
    expect(service.findOne).toHaveBeenCalledWith('uuid-1');
  });
});
